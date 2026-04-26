/**
 * Unit tests cho Pre-Book Deposit Flow
 * 
 * Test strategy: mock tất cả dependencies (Repository, PaymentGateway, pool)
 * để kiểm tra business logic thuần túy.
 */

// ── Mock dependencies TRƯỚC khi import ──

jest.mock('../../config/postgresdb', () => {
    const mockClient = {
        query: jest.fn(),
        release: jest.fn(),
    };
    return {
        pool: {
            connect: jest.fn().mockResolvedValue(mockClient),
            query: jest.fn(),
        },
        __mockClient: mockClient,
    };
});

jest.mock('../../repository/Appointment Management/appointment.repository');
jest.mock('../../repository/Appointment Management/appointment-audit-log.repository');
jest.mock('../../repository/Appointment Management/appointment-change.repository');
jest.mock('../../repository/Appointment Management/appointment-coordination.repository');
jest.mock('../../repository/EMR/encounter.repository');
jest.mock('../../repository/Billing/billing-payment-gateway.repository');
jest.mock('../../repository/Billing/billing-invoices.repository');
jest.mock('../../repository/Facility Management/branch.repository');
jest.mock('../Billing/billing-invoices.service');
jest.mock('../Billing/billing-refund.service');
jest.mock('../Billing/billing-payment-gateway.service');
jest.mock('../Facility Management/facility-status.service');
jest.mock('../Facility Management/booking-config.service');
jest.mock('../Core/notification-engine.service');
jest.mock('./appointment-coordination.service');

import { AppointmentService } from './appointment.service';
import { AppointmentRepository } from '../../repository/Appointment Management/appointment.repository';
import { PaymentGatewayService } from '../Billing/billing-payment-gateway.service';
import { APPOINTMENT_STATUS, PRE_BOOK_DEPOSIT_AMOUNT } from '../../constants/appointment.constant';

// Access mock internals via require (can't import __mockClient from TS module)
const { __mockClient } = require('../../config/postgresdb');

// Helper: tạo input hợp lệ
const validInput = () => ({
    patient_id: 'PAT_test123',
    branch_id: 'BRN_test123',
    shift_id: 'SFT_test123',
    appointment_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // ngày mai
    booking_channel: 'APP' as const,
    slot_id: 'SLT_test123',
});

// Mock appointment trả về
const mockAppointment = {
    appointments_id: 'APT_test123',
    appointment_code: 'APT-20260425-XXXX',
    patient_id: 'PAT_test123',
    branch_id: 'BRN_test123',
    status: APPOINTMENT_STATUS.PENDING_DEPOSIT,
    appointment_date: '2026-04-25',
    booking_channel: 'APP',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
};

const mockPaymentOrder = {
    payment_orders_id: 'PO_test123',
    order_code: 'EHealth12345',
    qr_code_url: 'https://qr.sepay.vn/test',
    amount: PRE_BOOK_DEPOSIT_AMOUNT,
    expires_at: new Date(Date.now() + 900000).toISOString(),
    remaining_seconds: 900,
};

describe('AppointmentService.preBookAppointment', () => {

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks
        (AppointmentRepository.getPatientStatus as jest.Mock).mockResolvedValue({
            exists: true,
            is_blacklisted: false,
        });
        (AppointmentRepository.branchExists as jest.Mock).mockResolvedValue(true);
        (AppointmentRepository.getShiftIdBySlot as jest.Mock).mockResolvedValue('SFT_test123');
        (AppointmentRepository.shiftExists as jest.Mock).mockResolvedValue(true);
        (AppointmentRepository.create as jest.Mock).mockResolvedValue(mockAppointment);
        (AppointmentRepository.findWithPatientAccount as jest.Mock).mockResolvedValue(null);

        // Mock smartAllocate (private → gọi internal)
        jest.spyOn(AppointmentService as any, 'smartAllocate').mockResolvedValue({
            warning: null,
        });

        // Mock pool client
        __mockClient.query.mockResolvedValue({ rows: [] });

        // Mock PaymentGateway
        (PaymentGatewayService.generateQR as jest.Mock).mockResolvedValue(mockPaymentOrder);
    });

    // ─── VALIDATION TESTS ───

    it('should throw MISSING_REQUIRED_FIELDS when patient_id is missing', async () => {
        const input = validInput();
        delete (input as any).patient_id;

        await expect(AppointmentService.preBookAppointment(input))
            .rejects.toMatchObject({ code: 'MISSING_REQUIRED_FIELDS' });
    });

    it('should throw MISSING_REQUIRED_FIELDS when branch_id is missing', async () => {
        const input = validInput();
        delete (input as any).branch_id;

        await expect(AppointmentService.preBookAppointment(input))
            .rejects.toMatchObject({ code: 'MISSING_REQUIRED_FIELDS' });
    });

    it('should throw MISSING_REQUIRED_FIELDS when both slot_id and shift_id are missing', async () => {
        const input = validInput();
        delete (input as any).slot_id;
        delete (input as any).shift_id;

        await expect(AppointmentService.preBookAppointment(input))
            .rejects.toMatchObject({ code: 'MISSING_REQUIRED_FIELDS' });
    });

    it('should throw INVALID_DATE for past dates', async () => {
        const input = validInput();
        input.appointment_date = '2020-01-01';

        await expect(AppointmentService.preBookAppointment(input))
            .rejects.toMatchObject({ code: 'INVALID_DATE' });
    });

    it('should throw PATIENT_NOT_FOUND when patient does not exist', async () => {
        (AppointmentRepository.getPatientStatus as jest.Mock).mockResolvedValue({
            exists: false,
            is_blacklisted: false,
        });

        await expect(AppointmentService.preBookAppointment(validInput()))
            .rejects.toMatchObject({ code: 'PATIENT_NOT_FOUND' });
    });

    it('should throw PATIENT_BLACKLISTED for online booking by blacklisted patient', async () => {
        (AppointmentRepository.getPatientStatus as jest.Mock).mockResolvedValue({
            exists: true,
            is_blacklisted: true,
        });

        await expect(AppointmentService.preBookAppointment(validInput()))
            .rejects.toMatchObject({ code: 'PATIENT_BLACKLISTED' });
    });

    it('should allow blacklisted patient via DIRECT_CLINIC with warning', async () => {
        (AppointmentRepository.getPatientStatus as jest.Mock).mockResolvedValue({
            exists: true,
            is_blacklisted: true,
        });

        const input = validInput();
        input.booking_channel = 'DIRECT_CLINIC' as any;

        const result = await AppointmentService.preBookAppointment(input);
        expect(result.warning).toContain('danh sách đen');
    });

    it('should throw BRANCH_NOT_FOUND when branch does not exist', async () => {
        (AppointmentRepository.branchExists as jest.Mock).mockResolvedValue(false);

        await expect(AppointmentService.preBookAppointment(validInput()))
            .rejects.toMatchObject({ code: 'BRANCH_NOT_FOUND' });
    });

    // ─── HAPPY PATH ───

    it('should create appointment with PENDING_DEPOSIT status', async () => {
        const result = await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        expect(result.status).toBe(APPOINTMENT_STATUS.PENDING_DEPOSIT);
        expect(AppointmentRepository.create).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ new_status: APPOINTMENT_STATUS.PENDING_DEPOSIT }),
            APPOINTMENT_STATUS.PENDING_DEPOSIT,
            __mockClient
        );
    });

    it('should create deposit invoice within transaction', async () => {
        await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        // BEGIN + INSERT invoice + INSERT invoice_detail + COMMIT
        const queryCalls = __mockClient.query.mock.calls.map((c: any) =>
            typeof c[0] === 'string' ? c[0].trim().substring(0, 30) : ''
        );
        expect(queryCalls).toContain('BEGIN');
        expect(queryCalls).toContain('COMMIT');

        // Should have invoice INSERT
        const invoiceInsert = __mockClient.query.mock.calls.find((c: any) =>
            typeof c[0] === 'string' && c[0].includes('INSERT INTO invoices')
        );
        expect(invoiceInsert).toBeTruthy();
        // Verify deposit amount
        expect(invoiceInsert[1]).toContain(PRE_BOOK_DEPOSIT_AMOUNT);
        expect(invoiceInsert[0]).toContain('appointment_id');
        expect(invoiceInsert[0]).toContain('invoice_type');
        expect(invoiceInsert[0]).toContain("'PRE_BOOKING'");
        expect(invoiceInsert[1]).toContain(mockAppointment.appointments_id);
    });

    it('should create invoice_detail with reference_type APPOINTMENT', async () => {
        await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        const detailInsert = __mockClient.query.mock.calls.find((c: any) =>
            typeof c[0] === 'string' && c[0].includes('INSERT INTO invoice_details')
        );
        expect(detailInsert).toBeTruthy();
        expect(detailInsert[0]).toContain("'APPOINTMENT'");
    });

    it('should call PaymentGatewayService.generateQR with correct amount', async () => {
        await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        expect(PaymentGatewayService.generateQR).toHaveBeenCalledWith(
            expect.objectContaining({
                amount: PRE_BOOK_DEPOSIT_AMOUNT,
            }),
            'USER_001'
        );
    });

    it('should return deposit_invoice and payment_order in response', async () => {
        const result = await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        expect(result.deposit_invoice).toBeDefined();
        expect(result.deposit_invoice.deposit_amount).toBe(PRE_BOOK_DEPOSIT_AMOUNT);
        expect(result.deposit_invoice.invoice_id).toMatch(/^INV_/);
        expect(result.deposit_invoice.invoice_code).toMatch(/^INV-/);

        expect(result.payment_order).toBeDefined();
        expect(result.payment_order.qr_code_url).toBe('https://qr.sepay.vn/test');
        expect(result.payment_order.payment_order_id).toBe('PO_test123');
    });

    it('should still succeed when QR generation fails (graceful degradation)', async () => {
        (PaymentGatewayService.generateQR as jest.Mock).mockRejectedValue(
            new Error('Gateway timeout')
        );

        const result = await AppointmentService.preBookAppointment(validInput(), 'USER_001');

        expect(result.appointments_id).toBe('APT_test123');
        expect(result.deposit_invoice).toBeDefined();
        expect(result.payment_order).toBeNull();
    });

    it('should ROLLBACK transaction on create failure', async () => {
        (AppointmentRepository.create as jest.Mock).mockRejectedValue(
            new Error('DB constraint violation')
        );

        await expect(AppointmentService.preBookAppointment(validInput()))
            .rejects.toThrow('DB constraint violation');

        const queryCalls = __mockClient.query.mock.calls.map((c: any) =>
            typeof c[0] === 'string' ? c[0].trim() : ''
        );
        expect(queryCalls).toContain('ROLLBACK');
    });

    it('should always release client (even on error)', async () => {
        (AppointmentRepository.create as jest.Mock).mockRejectedValue(new Error('fail'));

        try {
            await AppointmentService.preBookAppointment(validInput());
        } catch {}

        expect(__mockClient.release).toHaveBeenCalled();
    });
});

describe('AppointmentService.confirmDepositPayment', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (AppointmentRepository.findWithPatientAccount as jest.Mock).mockResolvedValue(null);
    });

    it('should skip if appointment not found', async () => {
        (AppointmentRepository.findById as jest.Mock).mockResolvedValue(null);

        await AppointmentService.confirmDepositPayment('APT_nonexist', 'INV_xxx');

        expect(AppointmentRepository.confirmAppointment).not.toHaveBeenCalled();
    });

    it('should skip if appointment is not PENDING_DEPOSIT', async () => {
        (AppointmentRepository.findById as jest.Mock).mockResolvedValue({
            ...mockAppointment,
            status: APPOINTMENT_STATUS.CONFIRMED,
        });

        await AppointmentService.confirmDepositPayment('APT_test123', 'INV_xxx');

        expect(AppointmentRepository.confirmAppointment).not.toHaveBeenCalled();
    });

    it('should confirm PENDING_DEPOSIT appointment', async () => {
        (AppointmentRepository.findById as jest.Mock).mockResolvedValue({
            ...mockAppointment,
            status: APPOINTMENT_STATUS.PENDING_DEPOSIT,
        });
        (AppointmentRepository.confirmAppointment as jest.Mock).mockResolvedValue({
            ...mockAppointment,
            status: APPOINTMENT_STATUS.CONFIRMED,
        });

        await AppointmentService.confirmDepositPayment('APT_test123', 'INV_xxx');

        expect(AppointmentRepository.confirmAppointment).toHaveBeenCalledWith(
            'APT_test123',
            null,
            expect.objectContaining({
                old_status: APPOINTMENT_STATUS.PENDING_DEPOSIT,
                new_status: APPOINTMENT_STATUS.CONFIRMED,
            })
        );
    });

    it('should include invoice_id in audit log action_note', async () => {
        (AppointmentRepository.findById as jest.Mock).mockResolvedValue({
            ...mockAppointment,
            status: APPOINTMENT_STATUS.PENDING_DEPOSIT,
        });
        (AppointmentRepository.confirmAppointment as jest.Mock).mockResolvedValue({
            ...mockAppointment,
            status: APPOINTMENT_STATUS.CONFIRMED,
        });

        await AppointmentService.confirmDepositPayment('APT_test123', 'INV_deposit_001');

        const call = (AppointmentRepository.confirmAppointment as jest.Mock).mock.calls[0];
        expect(call[2].action_note).toContain('INV_deposit_001');
    });
});

// ─── CONSTANTS TESTS ───

describe('Pre-Book Constants', () => {
    it('PENDING_DEPOSIT should be defined in APPOINTMENT_STATUS', () => {
        expect(APPOINTMENT_STATUS.PENDING_DEPOSIT).toBe('PENDING_DEPOSIT');
    });

    it('PRE_BOOK_DEPOSIT_AMOUNT should be a positive number', () => {
        expect(PRE_BOOK_DEPOSIT_AMOUNT).toBeGreaterThan(0);
        expect(typeof PRE_BOOK_DEPOSIT_AMOUNT).toBe('number');
    });
});

describe('Confirmation Constants', () => {
    it('CONFIRMABLE_STATUSES should include PENDING_DEPOSIT', () => {
        const { CONFIRMABLE_STATUSES } = require('../../constants/appointment-confirmation.constant');
        expect(CONFIRMABLE_STATUSES).toContain('PENDING_DEPOSIT');
        expect(CONFIRMABLE_STATUSES).toContain('PENDING');
    });
});

describe('AppointmentStatus Type', () => {
    it('INVOICE_ITEM_TYPE should include APPOINTMENT', () => {
        const { INVOICE_ITEM_TYPE } = require('../../constants/billing-invoices.constant');
        expect(INVOICE_ITEM_TYPE.APPOINTMENT).toBe('APPOINTMENT');
    });
});
