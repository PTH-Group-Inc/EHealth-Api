import { pool } from '../../config/postgresdb';
import { DispensingRepository } from '../../repository/Medication Management/dispensing.repository';
import { CreateDispenseInput, DispenseOrderFull } from '../../models/Medication Management/dispensing.model';
import {
    DISPENSE_STATUS,
    DISPENSE_CONFIG,
    DISPENSE_ERRORS,
} from '../../constants/dispensing.constant';
import { EncryptionUtil } from '../../utils/encryption.util';

const HTTP_STATUS = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409, INTERNAL_SERVER_ERROR: 500 };

/** Lớp lỗi nghiệp vụ */
class AppError extends Error {
    constructor(
        public httpCode: number,
        public code: string,
        message: string
    ) {
        super(message);
    }
}


export class DispensingService {

    /**
     * Cấp phát thuốc từ đơn thuốc (transaction).
     * validate → BEGIN → create order → create details + deduct stock → update Rx status → COMMIT
     */
    static async dispense(
        prescriptionId: string,
        pharmacistId: string,
        input: CreateDispenseInput
    ): Promise<DispenseOrderFull> {
        // 1. Validate đơn thuốc
        const rxInfo = await DispensingRepository.getPrescriptionInfo(prescriptionId);
        if (!rxInfo.exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', DISPENSE_ERRORS.PRESCRIPTION_NOT_FOUND);
        }
        if (rxInfo.status !== 'PRESCRIBED' && rxInfo.status !== 'PARTIALLY_DISPENSED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'PRESCRIPTION_NOT_PRESCRIBED', DISPENSE_ERRORS.PRESCRIPTION_NOT_PRESCRIBED);
        }

        // 2. Validate items
        if (!input.items || input.items.length === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_ITEMS', DISPENSE_ERRORS.MISSING_ITEMS);
        }

        // 3. Transaction: lock prescription + validate stock + create order + deduct
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lock đơn thuốc (chặn concurrent dispensing)
            await client.query(
                `SELECT prescriptions_id FROM prescriptions WHERE prescriptions_id = $1 FOR UPDATE`,
                [prescriptionId]
            );

            // Kiểm tra chưa cấp phát (an toàn trong transaction)
            const alreadyDispensed = await DispensingRepository.hasDispenseOrder(prescriptionId, client);
            if (alreadyDispensed) {
                throw new AppError(HTTP_STATUS.CONFLICT, 'ALREADY_DISPENSED', DISPENSE_ERRORS.ALREADY_DISPENSED);
            }

            // 4. Validate từng dòng
            for (const item of input.items) {
                if (!item.prescription_detail_id || !item.inventory_id) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ITEM', DISPENSE_ERRORS.INVALID_ITEM);
                }

                // Check dòng thuốc thuộc đơn
                const detail = await DispensingRepository.getPrescriptionDetail(item.prescription_detail_id, prescriptionId);
                if (!detail.exists) {
                    throw new AppError(HTTP_STATUS.NOT_FOUND, 'DETAIL_NOT_FOUND', DISPENSE_ERRORS.DETAIL_NOT_FOUND);
                }

                // Tự động lấy số lượng kê đơn nếu frontend không gửi dispensed_quantity
                if (!item.dispensed_quantity) {
                    item.dispensed_quantity = detail.quantity ?? 0;
                }

                if (item.dispensed_quantity <= 0) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INVALID_ITEM', DISPENSE_ERRORS.INVALID_ITEM);
                }

                // Check lô tồn kho + LOCK
                const batch = await DispensingRepository.lockAndGetInventoryBatch(client, item.inventory_id);
                if (!batch.exists) {
                    throw new AppError(HTTP_STATUS.NOT_FOUND, 'INVENTORY_NOT_FOUND', DISPENSE_ERRORS.INVENTORY_NOT_FOUND);
                }

                // Check drug match
                if (batch.drug_id !== detail.drug_id) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DRUG_MISMATCH', DISPENSE_ERRORS.DRUG_MISMATCH);
                }

                // Check hết hạn
                if (new Date(batch.expiry_date!) <= new Date()) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'BATCH_EXPIRED', DISPENSE_ERRORS.BATCH_EXPIRED);
                }

                // Check tồn kho đủ
                if (batch.stock_quantity! < item.dispensed_quantity) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', DISPENSE_ERRORS.INSUFFICIENT_STOCK);
                }

                // Check facility match: lô kho phải cùng branch với lượt khám
                const rxBranch = await DispensingRepository.getBranchFromPrescription(prescriptionId);
                const invBranch = await DispensingRepository.getBranchFromInventory(item.inventory_id);
                if (rxBranch && invBranch && rxBranch !== invBranch) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'FACILITY_MISMATCH', DISPENSE_ERRORS.FACILITY_MISMATCH);
                }
            }

            // 5. Tạo phiếu
            const orderId = DispensingRepository.generateOrderId();
            const code = DispensingRepository.generateDispenseCode();

            const order = await DispensingRepository.createOrder(
                client, orderId, code, prescriptionId, pharmacistId, input.notes
            );

            const details = [];

            for (const item of input.items) {
                const detailId = DispensingRepository.generateDetailId();
                const detail = await DispensingRepository.createDetail(client, detailId, orderId, item);
                details.push(detail);

                // Trừ tồn kho
                const deducted = await DispensingRepository.deductStock(client, item.inventory_id, item.dispensed_quantity);
                if (!deducted) {
                    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'INSUFFICIENT_STOCK', DISPENSE_ERRORS.INSUFFICIENT_STOCK);
                }
            }

            // Xác định trạng thái cấp phát (PARTIALLY_DISPENSED hay DISPENSED)
            const allRxDetails = await DispensingRepository.getAllPrescriptionDetails(prescriptionId);
            const totalRequested = allRxDetails.reduce((sum, d) => sum + Number(d.quantity), 0);

            // Lấy tổng số lượng đã cấp phát trước đó
            const prevDispenses = await client.query(
                `SELECT SUM(dispensed_quantity) as total_prev 
                 FROM drug_dispense_details ddd
                 JOIN drug_dispense_orders ddo ON ddo.drug_dispense_orders_id = ddd.dispense_order_id
                 WHERE ddo.prescription_id = $1 AND ddo.status IN ('COMPLETED', 'PARTIALLY_DISPENSED')`,
                [prescriptionId]
            );
            const prevDispensed = Number(prevDispenses.rows[0].total_prev || 0);
            const currentDispensed = input.items.reduce((sum, item) => sum + Number(item.dispensed_quantity), 0);
            const totalDispensed = prevDispensed + currentDispensed;

            const finalStatus = (totalDispensed < totalRequested) 
                ? DISPENSE_STATUS.PARTIALLY_DISPENSED 
                : DISPENSE_STATUS.COMPLETED;

            // Cập nhật trạng thái phiếu cấp phát nếu là PARTIALLY_DISPENSED (do createOrder mặc định là COMPLETED)
            if (finalStatus === DISPENSE_STATUS.PARTIALLY_DISPENSED) {
                await client.query(`UPDATE drug_dispense_orders SET status = $1 WHERE drug_dispense_orders_id = $2`, [finalStatus, orderId]);
            }

            // Cập nhật trạng thái đơn thuốc → DISPENSED hoặc PARTIALLY_DISPENSED
            const rxFinalStatus = (totalDispensed < totalRequested) ? 'PARTIALLY_DISPENSED' : 'DISPENSED';
            await DispensingRepository.updatePrescriptionStatus(client, prescriptionId, rxFinalStatus);

            await client.query('COMMIT');

            // Đọc lại phiếu đầy đủ (sau commit)
            const full = await DispensingRepository.findByPrescriptionId(prescriptionId);
            const costSum = full.details.reduce((s, d) => s + (d.dispensed_quantity * (d.unit_price || 0)), 0);

            return {
                order: full.order!,
                details: full.details,
                total_items: full.details.length,
                total_cost: costSum,
            };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

    /**
     * Xem phiếu cấp phát theo đơn thuốc
     */
    static async getByPrescriptionId(prescriptionId: string): Promise<any> {
        // Lấy thông tin đơn thuốc gốc từ DB
        const rxResult = await pool.query(
            `SELECT p.prescriptions_id, p.prescription_code, p.status as rx_status, p.clinical_diagnosis, p.doctor_notes, p.prescribed_at as created_at,
                    pat.full_name AS patient_name, pat.id AS patient_id, pat.date_of_birth, pat.gender, pat.phone_number,
                    up_doc.full_name AS doctor_name,
                    dept.name AS dept_name
             FROM prescriptions p
             LEFT JOIN patients pat ON pat.id::text = p.patient_id
             LEFT JOIN user_profiles up_doc ON up_doc.user_id = p.doctor_id
             LEFT JOIN encounters e ON e.encounters_id = p.encounter_id
             LEFT JOIN medical_rooms mr ON mr.medical_rooms_id = e.room_id
             LEFT JOIN departments dept ON dept.departments_id = mr.department_id
             WHERE p.prescriptions_id = $1`,
            [prescriptionId]
        );

        if (rxResult.rows.length === 0) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PRESCRIPTION_NOT_FOUND', DISPENSE_ERRORS.PRESCRIPTION_NOT_FOUND);
        }

        const rx = rxResult.rows[0];
        let age = 0;
        if (rx.date_of_birth) {
            const birthDate = new Date(rx.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        // Kiểm tra xem đã cấp phát chưa
        const result = await DispensingRepository.findByPrescriptionId(prescriptionId);
        let medicines = [];

        if (result.order) {
            // Đã cấp phát -> lấy từ chi tiết phiếu cấp phát
            medicines = result.details.map((d: any) => ({
                prescription_detail_id: d.prescription_detail_id,
                drug_id: d.drug_id,
                name: d.brand_name || d.name,
                qty: `${d.dispensed_quantity} ${d.dispensing_unit || ''}`.trim(),
                dosage: `${d.dosage || ''} · ${d.frequency || ''} · ${d.usage_instruction || ''}`.trim().replace(/^ · | · $/, '').replace(/ ·  · /g, ' · '),
                lot: d.batch_number || '—',
                expiry: d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('vi-VN') : '—',
            }));
        } else {
            // Chưa cấp phát -> lấy từ chi tiết đơn thuốc gốc và gợi ý lô FEFO
            const detailsResult = await pool.query(
                `SELECT pd.prescription_details_id, pd.drug_id, pd.quantity, pd.dosage, pd.frequency, pd.usage_instruction,
                        d.brand_name, d.dispensing_unit
                 FROM prescription_details pd
                 LEFT JOIN drugs d ON d.drugs_id = pd.drug_id
                 WHERE pd.prescription_id = $1 AND pd.is_active = TRUE`,
                [prescriptionId]
            );

            for (const r of detailsResult.rows) {
                // Gợi ý lô tồn kho theo FEFO
                const batchResult = await pool.query(
                    `SELECT pharmacy_inventory_id, batch_number, expiry_date
                     FROM pharmacy_inventory
                     WHERE drug_id = $1 AND stock_quantity > 0 AND expiry_date > CURRENT_DATE
                     ORDER BY expiry_date ASC
                     LIMIT 1`,
                    [r.drug_id]
                );

                const batch = batchResult.rows[0] || {};
                medicines.push({
                    prescription_detail_id: r.prescription_details_id,
                    drug_id: r.drug_id,
                    inventory_id: batch.pharmacy_inventory_id || '',
                    name: r.brand_name,
                    qty: `${r.quantity} ${r.dispensing_unit || ''}`.trim(),
                    dosage: `${r.dosage || ''} · ${r.frequency || ''} · ${r.usage_instruction || ''}`.trim().replace(/^ · | · $/, '').replace(/ ·  · /g, ' · '),
                    lot: batch.batch_number || 'Hết hàng',
                    expiry: batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('vi-VN') : '—',
                });
            }
        }

        return {
            id: rx.prescriptions_id,
            patient: rx.patient_name || '—',
            patientId: rx.patient_id || '',
            age: age,
            gender: rx.gender === 'MALE' ? 'Nam' : rx.gender === 'FEMALE' ? 'Nữ' : rx.gender || '—',
            phone: rx.phone_number || '—',
            doctor: rx.doctor_name || '—',
            dept: rx.dept_name || '—',
            diagnosis: rx.clinical_diagnosis ? EncryptionUtil.decrypt(rx.clinical_diagnosis) : '—',
            date: rx.created_at ? new Date(rx.created_at).toLocaleDateString('vi-VN') : '—',
            note: rx.doctor_notes ? EncryptionUtil.decrypt(rx.doctor_notes) : '—',
            medicines: medicines,
            isDispensed: !!result.order,
        };
    }

    /**
     * Lịch sử cấp phát (phân trang + filter)
     */
    static async getHistory(
        page: number,
        limit: number,
        status?: string,
        fromDate?: string,
        toDate?: string
    ) {
        const safeLimit = Math.min(limit, DISPENSE_CONFIG.MAX_LIMIT);
        const result = await DispensingRepository.findHistory(page, safeLimit, status, fromDate, toDate);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Xem tồn kho theo thuốc (FEFO)
     */
    static async getInventory(drugId: string) {
        const exists = await DispensingRepository.drugExists(drugId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', DISPENSE_ERRORS.DRUG_NOT_FOUND);
        }
        return DispensingRepository.getInventoryByDrugId(drugId);
    }

    /**
     * Kiểm tra tồn kho đủ cho số lượng yêu cầu
     */
    static async checkStock(drugId: string, quantity: number) {
        const exists = await DispensingRepository.drugExists(drugId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'DRUG_NOT_FOUND', DISPENSE_ERRORS.DRUG_NOT_FOUND);
        }
        return DispensingRepository.checkStock(drugId, quantity);
    }

    /**
     * Lịch sử cấp phát theo dược sĩ
     */
    static async getByPharmacist(
        pharmacistId: string,
        page: number,
        limit: number,
        fromDate?: string,
        toDate?: string
    ) {
        const exists = await DispensingRepository.pharmacistExists(pharmacistId);
        if (!exists) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, 'PHARMACIST_NOT_FOUND', DISPENSE_ERRORS.PHARMACIST_NOT_FOUND);
        }

        const safeLimit = Math.min(limit, DISPENSE_CONFIG.MAX_LIMIT);
        const result = await DispensingRepository.findByPharmacistId(pharmacistId, page, safeLimit, fromDate, toDate);
        return {
            ...result,
            page,
            limit: safeLimit,
            totalPages: Math.ceil(result.total / safeLimit),
        };
    }

    /**
     * Hủy phiếu cấp phát + hoàn tồn kho (transaction)
     */
    static async cancel(dispenseOrderId: string, reason: string): Promise<void> {
        if (!reason || reason.trim() === '') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'MISSING_CANCEL_REASON', DISPENSE_ERRORS.MISSING_CANCEL_REASON);
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lock order
            const orderResult = await client.query(
                `SELECT status, prescription_id FROM drug_dispense_orders WHERE drug_dispense_orders_id = $1 FOR UPDATE`,
                [dispenseOrderId]
            );

            if (orderResult.rows.length === 0) {
                throw new AppError(HTTP_STATUS.NOT_FOUND, 'DISPENSE_ORDER_NOT_FOUND', DISPENSE_ERRORS.DISPENSE_ORDER_NOT_FOUND);
            }

            const order = orderResult.rows[0];

            if (order.status === DISPENSE_STATUS.CANCELLED) {
                throw new AppError(HTTP_STATUS.BAD_REQUEST, 'DISPENSE_ALREADY_CANCELLED', DISPENSE_ERRORS.DISPENSE_ALREADY_CANCELLED);
            }

            const details = await DispensingRepository.getDetailsByOrderId(dispenseOrderId);

            // Hoàn kho từng dòng
            for (const detail of details) {
                await DispensingRepository.restoreStock(client, detail.inventory_id, detail.dispensed_quantity);
            }

            // Hủy phiếu
            await DispensingRepository.cancelOrder(client, dispenseOrderId, reason);

            // Đổi status đơn thuốc về PRESCRIBED
            await DispensingRepository.updatePrescriptionStatus(client, order.prescription_id, 'PRESCRIBED');

            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}
