-- =====================================================================
-- SEED DATA: MODULE 6B - BẢO HIỂM Y TẾ (INSURANCE)
-- =====================================================================
-- Thứ tự chạy: SAU 01, 01b, 02, 03, 04, 05, 06_services
-- Bao gồm: insurance_providers, insurance_coverages
-- =====================================================================

BEGIN;

-- *********************************************************************
-- 1. NHÀ CUNG CẤP BẢO HIỂM (INSURANCE PROVIDERS)
-- Gồm: BHYT Nhà nước + Bảo hiểm tư nhân phổ biến tại Việt Nam
-- insurance_type: STATE (BHYT), PRIVATE (Bảo hiểm tư nhân)
-- *********************************************************************
INSERT INTO insurance_providers (insurance_providers_id, provider_code, provider_name, insurance_type, contact_phone, contact_email, address, support_notes, is_active) VALUES
('INS_BHYT', 'BHYT', 'Bảo hiểm Y tế Việt Nam (BHYT)', 'STATE', '1900-9068', 'bhyt@vss.gov.vn', '7 Tràng Thi, Hoàn Kiếm, Hà Nội', 'Bảo hiểm y tế bắt buộc do BHXH Việt Nam quản lý. Mức hưởng: 80% (thông thường), 95% (hưu trí, người nghèo), 100% (trẻ em dưới 6 tuổi, quân nhân). Đăng ký KCB ban đầu tại cơ sở y tế tuyến xã/huyện/tỉnh.', TRUE),
('INS_BHXH_HCM', 'BHXH-HCM', 'Bảo hiểm Xã hội TP. Hồ Chí Minh', 'STATE', '028-3829-0405', 'bhxh.hcm@vss.gov.vn', '25 Nguyễn Thị Minh Khai, Q.1, TP. Hồ Chí Minh', 'Chi nhánh BHXH tại TP.HCM. Xử lý hồ sơ BHYT, thanh toán chi phí KCB BHYT cho các cơ sở y tế khu vực phía Nam.', TRUE),
('INS_BAOVIET', 'BAOVIET', 'Tổng Công ty Bảo hiểm Bảo Việt', 'PRIVATE', '1900-558-868', 'cskh@baoviet.com.vn', '8 Lê Thái Tổ, Hoàn Kiếm, Hà Nội', 'Bảo hiểm sức khỏe toàn diện: Nội trú, ngoại trú, thai sản, nha khoa. Mạng lưới 200+ bệnh viện liên kết. Bảo lãnh viện phí trực tiếp.', TRUE),
('INS_PRUDENTIAL', 'PRUDENTIAL', 'Prudential Việt Nam', 'PRIVATE', '1800-1247', 'cskh@prudential.com.vn', 'Tòa nhà Saigon Trade Center, 37 Tôn Đức Thắng, Q.1, TP.HCM', 'Bảo hiểm nhân thọ kết hợp sức khỏe. Gói PRU-Hành Trang Vững Bước, PRU-Sức Khỏe Vàng. Chi trả bệnh hiểm nghèo, phẫu thuật.', TRUE),
('INS_MANULIFE', 'MANULIFE', 'Manulife Việt Nam', 'PRIVATE', '1800-1220', 'hotro@manulife.com.vn', 'Tầng 15, Manulife Tower, 75 Hoàng Văn Thái, Q.7, TP.HCM', 'Bảo hiểm sức khỏe Max - Sống Khỏe. Chi trả viện phí, phẫu thuật, ngoại trú. Mạng lưới 150+ BV liên kết toàn quốc.', TRUE),
('INS_AIA', 'AIA', 'AIA Việt Nam', 'PRIVATE', '1800-599-920', 'vn.service@aia.com', 'Tầng 18, Bitexco Financial Tower, Q.1, TP.HCM', 'Bảo hiểm sức khỏe AIA Absolute Health Plus. Chi trả 100% viện phí (theo hạn mức), phòng đơn, bệnh hiểm nghèo.', TRUE),
('INS_DAIICHI', 'DAIICHI', 'Dai-ichi Life Việt Nam', 'PRIVATE', '1800-599-920', 'cskh@dai-ichi-life.com.vn', 'Tầng 20, Dai-ichi Tower, 2B Nguyễn Thị Minh Khai, Q.1, TP.HCM', 'Bảo hiểm An Tâm Viện Phí. Chi trả nội trú, phẫu thuật, trợ cấp nằm viện. Quyền lợi bổ sung: Ngoại trú, nha khoa.', TRUE),
('INS_PVI', 'PVI', 'Bảo hiểm PVI (PVI Insurance)', 'PRIVATE', '024-3942-3681', 'baohi@pvi.com.vn', 'Tầng 15, PVI Tower, 168 Trần Thái Tông, Cầu Giấy, Hà Nội', 'Bảo hiểm sức khỏe doanh nghiệp và cá nhân. PVI Care - gói ngoại trú, nội trú, thai sản. Bảo lãnh viện phí 100+ BV.', TRUE),
('INS_MICS', 'MIC', 'Bảo hiểm Quân đội (MIC)', 'PRIVATE', '1900-9247', 'info@mic.vn', 'Tầng 12, MIPEC Tower, 229 Tây Sơn, Đống Đa, Hà Nội', 'Bảo hiểm sức khỏe cá nhân MIC Care. Chi trả viện phí lên đến 1 tỷ VNĐ/năm. Thanh toán bổ sung BHYT.', TRUE),
('INS_LIBERTY', 'LIBERTY', 'Liberty Insurance Việt Nam', 'PRIVATE', '028-3812-5678', 'info@libertyinsurance.com.vn', 'Tầng 15, TNR Tower, 180-192 Nguyễn Công Trứ, Q.1, TP.HCM', 'Bảo hiểm sức khỏe Liberty HealthCare. Gói Đồng, Bạc, Vàng, Kim Cương. Mạng lưới 120+ BV liên kết.', TRUE);

-- *********************************************************************
-- 2. PHẠM VI BẢO HIỂM (INSURANCE COVERAGES)
-- Mỗi nhà cung cấp có nhiều gói bảo hiểm với tỷ lệ chi trả khác nhau
-- coverage_percent: Tỷ lệ chi trả (%) theo gói
-- *********************************************************************
INSERT INTO insurance_coverages (insurance_coverages_id, coverage_name, provider_id, coverage_percent, description, is_active) VALUES
('COV_BHYT_100', 'BHYT - Mức hưởng 100%', 'INS_BHYT', 100.00, 'Trẻ em dưới 6 tuổi, bộ đội, công an, người có công. Hưởng 100% chi phí KCB trong danh mục BHYT.', TRUE),
('COV_BHYT_95', 'BHYT - Mức hưởng 95%', 'INS_BHYT', 95.00, 'Người hưu trí, mất sức lao động, người thuộc hộ nghèo, đồng bào dân tộc thiểu số, người có công cách mạng.', TRUE),
('COV_BHYT_80', 'BHYT - Mức hưởng 80%', 'INS_BHYT', 80.00, 'Người lao động, công chức, viên chức, HSSV, thân nhân quân nhân. Mức hưởng phổ biến nhất.', TRUE),
('COV_BHYT_TRAI', 'BHYT - Trái tuyến', 'INS_BHYT', 40.00, 'KCB trái tuyến: Tuyến huyện 70%, Tuyến tỉnh 60%, Tuyến TW 40% (chỉ nội trú). Ngoại trú trái tuyến tự chi trả.', TRUE),
('COV_BHYT_CC', 'BHYT - Cấp cứu', 'INS_BHYT', 80.00, 'Cấp cứu được hưởng BHYT tại bất kỳ cơ sở y tế nào, không cần giấy chuyển tuyến. Mức hưởng theo quyền lợi gốc.', TRUE),
('COV_BHYT_5NAM', 'BHYT - Đóng liên tục 5 năm', 'INS_BHYT', 100.00, 'Đóng BHYT liên tục từ 5 năm trở lên và có số tiền cùng chi trả trong năm > 6 tháng lương cơ sở: Được hưởng 100%.', TRUE),
('COV_BHXH_HCM_80', 'BHXH HCM - Đúng tuyến 80%', 'INS_BHXH_HCM', 80.00, 'KCB đúng tuyến tại TP.HCM, mức hưởng 80% chi phí theo danh mục BHYT cho người lao động.', TRUE),
('COV_BHXH_HCM_100', 'BHXH HCM - Trẻ em 100%', 'INS_BHXH_HCM', 100.00, 'Trẻ em dưới 6 tuổi tại TP.HCM, hưởng 100% chi phí KCB BHYT.', TRUE),
('COV_BV_DONG', 'Bảo Việt An Gia - Gói Đồng', 'INS_BAOVIET', 70.00, 'Nội trú: 70% chi phí (tối đa 100 triệu/năm). Phẫu thuật: 70%. Không bao gồm ngoại trú.', TRUE),
('COV_BV_BAC', 'Bảo Việt An Gia - Gói Bạc', 'INS_BAOVIET', 80.00, 'Nội trú: 80% (tối đa 200 triệu/năm). Ngoại trú: 80% (tối đa 20 triệu/năm). Thai sản: 10 triệu.', TRUE),
('COV_BV_VANG', 'Bảo Việt An Gia - Gói Vàng', 'INS_BAOVIET', 100.00, 'Nội trú: 100% (tối đa 500 triệu/năm). Ngoại trú: 100% (tối đa 50 triệu/năm). Thai sản: 30 triệu. Nha khoa: 5 triệu.', TRUE),
('COV_PRU_BASIC', 'PRU-Sức Khỏe Vàng - Cơ bản', 'INS_PRUDENTIAL', 60.00, 'Chi trả 60% viện phí nội trú (tối đa 150 triệu/năm). Phẫu thuật: 60%. Trợ cấp nằm viện: 300K/ngày.', TRUE),
('COV_PRU_PLUS', 'PRU-Sức Khỏe Vàng - Nâng cao', 'INS_PRUDENTIAL', 80.00, 'Chi trả 80% viện phí (tối đa 300 triệu/năm). Ngoại trú: 80% (tối đa 30 triệu). Bệnh hiểm nghèo: 500 triệu.', TRUE),
('COV_PRU_VIP', 'PRU-Hành Trang Vững Bước VIP', 'INS_PRUDENTIAL', 100.00, 'Chi trả 100% (tối đa 1 tỷ/năm). Phòng đơn VIP. Bệnh hiểm nghèo: 2 tỷ. Ngoại trú + Nha khoa + Thai sản.', TRUE),
('COV_MANU_BASIC', 'Max - Sống Khỏe Cơ bản', 'INS_MANULIFE', 70.00, 'Nội trú 70% (tối đa 200 triệu/năm). Phẫu thuật: 70%. ICU: 1 triệu/ngày (tối đa 30 ngày).', TRUE),
('COV_MANU_PLUS', 'Max - Sống Khỏe Nâng cao', 'INS_MANULIFE', 80.00, 'Nội trú 80% (tối đa 500 triệu/năm). Ngoại trú: 80% (tối đa 30 triệu). Bệnh hiểm nghèo: 300 triệu.', TRUE),
('COV_MANU_PREM', 'Max - Sống Khỏe Cao cấp', 'INS_MANULIFE', 100.00, 'Nội trú 100% (tối đa 2 tỷ/năm). Phòng đơn. Ngoại trú 100%. Thai sản: 50 triệu. Khắp toàn cầu.', TRUE),
('COV_AIA_SILVER', 'AIA Absolute Health - Silver', 'INS_AIA', 70.00, 'Nội trú 70% (tối đa 200 triệu/năm). Phẫu thuật ngày: 70%. Xe cứu thương: 2 triệu/lần.', TRUE),
('COV_AIA_GOLD', 'AIA Absolute Health - Gold', 'INS_AIA', 80.00, 'Nội trú 80% (tối đa 500 triệu/năm). Ngoại trú 80% (tối đa 30 triệu). Ung thư: 300 triệu.', TRUE),
('COV_AIA_PLAT', 'AIA Absolute Health - Platinum', 'INS_AIA', 100.00, 'Nội trú + Ngoại trú 100% (tối đa 3 tỷ/năm). Phòng Suite. Điều trị ung thư không giới hạn.', TRUE),
('COV_DAI_BASIC', 'An Tâm Viện Phí - Cơ bản', 'INS_DAIICHI', 70.00, 'Nội trú 70% (tối đa 150 triệu/năm). Trợ cấp nằm viện: 500K/ngày. Phẫu thuật: tối đa 100 triệu/lần.', TRUE),
('COV_DAI_PLUS', 'An Tâm Viện Phí - Toàn diện', 'INS_DAIICHI', 100.00, 'Nội trú + Ngoại trú 100% (tối đa 1 tỷ/năm). Nha khoa: 10 triệu. Thai sản: 20 triệu. Phòng đơn.', TRUE),
('COV_PVI_STD', 'PVI Care - Tiêu chuẩn', 'INS_PVI', 70.00, 'Nội trú 70% (tối đa 200 triệu/năm). Ngoại trú: 70% (tối đa 15 triệu). Bảo lãnh viện phí 100+ BV.', TRUE),
('COV_PVI_PREM', 'PVI Care - Cao cấp', 'INS_PVI', 100.00, 'Nội trú + Ngoại trú 100% (tối đa 1.5 tỷ/năm). Thai sản: 40 triệu. Nha khoa: 10 triệu. Toàn cầu.', TRUE),
('COV_MIC_BASIC', 'MIC Care - Cơ bản', 'INS_MICS', 70.00, 'Nội trú 70% (tối đa 200 triệu/năm). Phẫu thuật: 70%. Bổ sung BHYT: thanh toán phần BN cùng chi trả.', TRUE),
('COV_MIC_GOLD', 'MIC Care - Vàng', 'INS_MICS', 100.00, 'Nội trú + Ngoại trú 100% (tối đa 1 tỷ/năm). Bệnh hiểm nghèo: 500 triệu. Thai sản: 25 triệu.', TRUE),
('COV_LIB_DONG', 'Liberty HealthCare - Đồng', 'INS_LIBERTY', 60.00, 'Nội trú 60% (tối đa 100 triệu/năm). Không bao gồm ngoại trú. Trợ cấp nằm viện: 200K/ngày.', TRUE),
('COV_LIB_BAC', 'Liberty HealthCare - Bạc', 'INS_LIBERTY', 80.00, 'Nội trú 80% (tối đa 300 triệu/năm). Ngoại trú: 80% (tối đa 20 triệu). Xe cứu thương: 3 triệu.', TRUE),
('COV_LIB_VANG', 'Liberty HealthCare - Vàng', 'INS_LIBERTY', 100.00, 'Nội trú + Ngoại trú 100% (tối đa 1 tỷ/năm). Thai sản: 30 triệu. Nha khoa: 8 triệu. Phòng VIP.', TRUE);

COMMIT;

-- =====================================================================
-- THỐNG KÊ SEED DATA MODULE 6B - BẢO HIỂM Y TẾ
-- =====================================================================
-- insurance_providers:   10 nhà cung cấp (2 BHYT nhà nước + 8 tư nhân)
-- insurance_coverages:   29 gói bảo hiểm (mức chi trả 40% - 100%)
-- TỔNG:                  39 bản ghi
-- =====================================================================