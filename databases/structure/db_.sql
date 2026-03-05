-- HỆ THỐNG CỐT LÕI & PHÂN QUYỀN
-- 1. Quản lý Người dùng & Hồ sơ cá nhân

-- Bảng lưu trữ tài khoản đăng nhập
CREATE TABLE nguoi_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    so_dien_thoai VARCHAR(20) UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL, -- Mật khẩu đã được mã hóa
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE (Hoạt động), INACTIVE (Đã khóa)
    dang_nhap_cuoi_luc TIMESTAMP,
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_xoa TIMESTAMP NULL -- Dùng cho xóa mềm (Soft Delete)
);

-- Bảng thông tin cá nhân của người dùng
CREATE TABLE ho_so_nguoi_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL UNIQUE,
    ho_va_ten VARCHAR(255) NOT NULL,
    ngay_sinh DATE,
    gioi_tinh VARCHAR(20), 
    so_cccd VARCHAR(50) UNIQUE, 
    url_anh_dai_dien TEXT,
    dia_chi TEXT,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- 2. Quản lý Vai trò & Phân quyền (RBAC)

-- Bảng định nghĩa các chức vụ/vai trò (Admin, Bác sĩ, Lễ tân...)
CREATE TABLE vai_tro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_vai_tro VARCHAR(50) UNIQUE NOT NULL, 
    ten_vai_tro VARCHAR(100) NOT NULL,
    mo_ta TEXT,
    la_he_thong BOOLEAN DEFAULT FALSE -- Nếu là TRUE thì không cho phép xóa
);

-- Bảng định nghĩa các quyền cụ thể (ví dụ: Xem bệnh án, Sửa bệnh án...)
CREATE TABLE quyen_han (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_quyen VARCHAR(100) UNIQUE NOT NULL, 
    phan_he VARCHAR(100) NOT NULL, -- Nhóm chức năng (Bệnh án, Lịch khám...)
    mo_ta TEXT
);

-- Bảng trung gian: Vai trò này có những quyền gì
CREATE TABLE vai_tro_quyen_han (
    vai_tro_id UUID NOT NULL,
    quyen_han_id UUID NOT NULL,
    PRIMARY KEY (vai_tro_id, quyen_han_id),
    FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(id) ON DELETE CASCADE,
    FOREIGN KEY (quyen_han_id) REFERENCES quyen_han(id) ON DELETE CASCADE
);

-- Bảng trung gian: Người dùng này giữ những vai trò gì
CREATE TABLE vai_tro_nguoi_dung (
    nguoi_dung_id UUID NOT NULL,
    vai_tro_id UUID NOT NULL,
    PRIMARY KEY (nguoi_dung_id, vai_tro_id),
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (vai_tro_id) REFERENCES vai_tro(id) ON DELETE CASCADE
);

-- 3. Quản lý Danh mục dùng chung (Dân tộc, Tôn giáo, Tỉnh thành...)

CREATE TABLE danh_muc_nen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_danh_muc VARCHAR(50) UNIQUE NOT NULL, 
    ten_danh_muc VARCHAR(100) NOT NULL,
    mo_ta TEXT
);

CREATE TABLE chi_tiet_danh_muc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_danh_muc VARCHAR(50) NOT NULL,
    ma_chi_tiet VARCHAR(50) NOT NULL,
    gia_tri VARCHAR(255) NOT NULL,
    thu_tu INT DEFAULT 0,
    khi_dung BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ma_danh_muc) REFERENCES danh_muc_nen(ma_danh_muc) ON DELETE CASCADE,
    UNIQUE (ma_danh_muc, ma_chi_tiet)
);

-- 4. Cấu hình hệ thống & Thông báo

-- Nơi lưu các cài đặt linh hoạt của hệ thống (lưu dạng JSON)
CREATE TABLE cau_hinh_he_thong (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    khoa_cau_hinh VARCHAR(100) UNIQUE NOT NULL, 
    gia_tri_cau_hinh JSON NOT NULL, 
    mo_ta TEXT,
    nguoi_cap_nhat UUID REFERENCES nguoi_dung(id),
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quản lý mẫu thông báo chung
CREATE TABLE thong_bao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tieu_de VARCHAR(255) NOT NULL,
    noi_dung TEXT NOT NULL,
    loai_thong_bao VARCHAR(50), 
    id_tham_chieu UUID, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quản lý trạng thái đọc thông báo của từng người dùng
CREATE TABLE thong_bao_nguoi_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thong_bao_id UUID NOT NULL,
    nguoi_dung_id UUID NOT NULL,
    da_doc BOOLEAN DEFAULT FALSE,
    doc_luc TIMESTAMP,
    FOREIGN KEY (thong_bao_id) REFERENCES thong_bao(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- 5. Nhật ký Hệ thống (Lưu lại lịch sử thao tác của nhân viên)
CREATE TABLE nhat_ky_he_thong (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID, 
    hanh_dong VARCHAR(50) NOT NULL, -- THÊM, SỬA, XÓA
    ten_bang VARCHAR(100) NOT NULL, 
    id_ban_ghi UUID NOT NULL, 
    du_lieu_cu JSON, -- Data trước khi sửa
    du_lieu_moi JSON, -- Data sau khi sửa
    dia_chi_ip VARCHAR(45),
    thiet_bi TEXT,
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE SET NULL
);

-- ========================================================
-- QUẢN LÝ BỆNH NHÂN 

-- Bảng thông tin y tế cơ bản của Bệnh nhân
CREATE TABLE benh_nhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL UNIQUE, 
    ma_benh_nhan VARCHAR(50) UNIQUE NOT NULL, 
    nhom_mau VARCHAR(5), 
    yeu_to_rh VARCHAR(5), -- Rh+ hoặc Rh-
    tinh_trang_hon_nhan VARCHAR(50), 
    nghe_nghiep VARCHAR(100), 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_xoa TIMESTAMP NULL,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- Những người cần báo tin khi bệnh nhân có cấp cứu
CREATE TABLE nguoi_lien_he_benh_nhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    ten_nguoi_lien_he VARCHAR(255) NOT NULL,
    moi_quan_he VARCHAR(50) NOT NULL, 
    so_dien_thoai VARCHAR(20) NOT NULL,
    dia_chi TEXT,
    la_lien_he_khan_cap BOOLEAN DEFAULT FALSE, 
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

-- Quản lý thẻ BHYT hoặc Bảo hiểm tư nhân
CREATE TABLE bao_hiem_benh_nhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    loai_bao_hiem VARCHAR(50) NOT NULL, 
    nha_cung_cap VARCHAR(255) NOT NULL, 
    so_bao_hiem VARCHAR(100) NOT NULL UNIQUE, 
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    phan_tram_chi_tra INT, 
    la_bao_hiem_chinh BOOLEAN DEFAULT TRUE, 
    url_tai_lieu TEXT, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

-- Các bệnh lý đã và đang mắc phải của Bệnh nhân / Gia đình
CREATE TABLE tien_su_benh_ly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    ma_benh_ly VARCHAR(20), 
    ten_benh_ly VARCHAR(255) NOT NULL, 
    loai_tien_su VARCHAR(50) NOT NULL, 
    ngay_chan_doan DATE, 
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE', 
    ghi_chu TEXT,
    nguoi_ghi_nhan UUID, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_ghi_nhan) REFERENCES nguoi_dung(id) ON DELETE SET NULL
);

-- Thông tin cảnh báo bệnh nhân bị dị ứng thuốc hay thức ăn (Rất quan trọng)
CREATE TABLE di_ung_benh_nhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    loai_di_ung VARCHAR(50), 
    ten_di_ung VARCHAR(255) NOT NULL, 
    phan_ung TEXT, 
    muc_do VARCHAR(50), -- Nhẹ, Vừa, Nặng ngất...
    ghi_chu TEXT,
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

-- Phân loại bệnh nhân (Ví dụ: Thẻ VIP, Thẻ Mãn tính...)
CREATE TABLE nhan_dan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nhan VARCHAR(50) UNIQUE NOT NULL, 
    ten_nhan VARCHAR(100) NOT NULL,
    ma_mau VARCHAR(10) DEFAULT '#000000', 
    mo_ta TEXT
);

CREATE TABLE nhan_dan_benh_nhan (
    benh_nhan_id UUID NOT NULL,
    nhan_id UUID NOT NULL,
    nguoi_gan UUID, 
    gan_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (benh_nhan_id, nhan_id),
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE,
    FOREIGN KEY (nhan_id) REFERENCES nhan_dan(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_gan) REFERENCES nguoi_dung(id) ON DELETE SET NULL
);

-- Lưu file xét nghiệm ngoài, hoặc giấy tờ tùy thân
CREATE TABLE tai_lieu_benh_nhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    loai_tai_lieu VARCHAR(50), 
    tieu_de VARCHAR(255) NOT NULL,
    url_tap_tin TEXT NOT NULL, 
    nguoi_tai_len UUID,
    tai_len_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_tai_len) REFERENCES nguoi_dung(id) ON DELETE SET NULL
);

-- ========================================================
-- QUẢN LÝ TÀI NGUYÊN (PHÒNG KHÁM, BÁC SĨ)

CREATE TABLE chuyen_khoa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_chuyen_khoa VARCHAR(50) UNIQUE NOT NULL, 
    ten_chuyen_khoa VARCHAR(150) NOT NULL,
    mo_ta TEXT
);

-- Bảng thông tin chuyên môn của Bác sĩ
CREATE TABLE bac_si (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoi_dung_id UUID NOT NULL UNIQUE, 
    chuyen_khoa_id UUID NOT NULL,
    hoc_ham VARCHAR(100), 
    tieu_su TEXT,
    phi_kham DECIMAL(12,2), 
    dang_hoat_dong BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE,
    FOREIGN KEY (chuyen_khoa_id) REFERENCES chuyen_khoa(id)
);

-- Bảng danh sách các phòng khám
CREATE TABLE phong_kham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_phong VARCHAR(50) UNIQUE NOT NULL, 
    ten_phong VARCHAR(100) NOT NULL, 
    loai_phong VARCHAR(50), 
    suc_chua INT DEFAULT 1, 
    dang_hoat_dong BOOLEAN DEFAULT TRUE
);

-- ========================================================
-- QUẢN LÝ LỊCH LÀM VIỆC & KHUNG GIỜ

-- Bác sĩ ngồi phòng nào, ca nào, ngày nào
CREATE TABLE lich_lam_viec_bac_si (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bac_si_id UUID NOT NULL,
    phong_id UUID NOT NULL,
    ngay_lam_viec DATE NOT NULL,
    ca_lam_viec VARCHAR(50), -- Sáng, Chiều, Tối
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE', 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bac_si_id) REFERENCES bac_si(id) ON DELETE CASCADE,
    FOREIGN KEY (phong_id) REFERENCES phong_kham(id),
    UNIQUE (bac_si_id, ngay_lam_viec, ca_lam_viec) 
);

-- Các ô thời gian nhỏ (15-30 phút) để khách hàng chọn đặt
CREATE TABLE khung_gio_kham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_lam_viec_id UUID NOT NULL,
    gio_bat_dau TIME NOT NULL, 
    gio_ket_thuc TIME NOT NULL,   
    toi_da_benh_nhan INT DEFAULT 1, 
    so_benh_nhan_da_dat INT DEFAULT 0, 
    trang_thai VARCHAR(50) DEFAULT 'AVAILABLE', 
    FOREIGN KEY (lich_lam_viec_id) REFERENCES lich_lam_viec_bac_si(id) ON DELETE CASCADE
);

-- ========================================================
-- ĐẶT LỊCH KHÁM (APPOINTMENTS)

-- Hồ sơ đăng ký khám trước khi đến phòng khám
CREATE TABLE lich_hen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_lich_hen VARCHAR(50) UNIQUE NOT NULL, 
    benh_nhan_id UUID NOT NULL,
    bac_si_id UUID NOT NULL,
    khung_gio_id UUID NOT NULL,
    
    kenh_dat_kham VARCHAR(50) NOT NULL, -- APP, WEB, HOTLINE...
    ly_do_kham TEXT, 
    ghi_chu_trieu_chung TEXT,
    
    trang_thai VARCHAR(50) DEFAULT 'PENDING', -- Chờ xác nhận, Đã đến, Đã hủy...
    
    check_in_luc TIMESTAMP,
    huy_luc TIMESTAMP,
    ly_do_huy TEXT,
    
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id),
    FOREIGN KEY (bac_si_id) REFERENCES bac_si(id),
    FOREIGN KEY (khung_gio_id) REFERENCES khung_gio_kham(id)
);

-- Lưu lại lịch sử nếu khách dời lịch, hủy lịch
CREATE TABLE nhat_ky_lich_hen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_hen_id UUID NOT NULL,
    nguoi_thay_doi UUID, 
    trang_thai_cu VARCHAR(50),
    trang_thai_moi VARCHAR(50),
    ghi_chu_hanh_dong TEXT, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_thay_doi) REFERENCES nguoi_dung(id) ON DELETE SET NULL
);

-- ========================================================
-- KHÁM BỆNH & HỒ SƠ BỆNH ÁN CẬN LÂM SÀNG

-- Khi khách vào phòng gặp bác sĩ -> Sinh ra một "Lượt Khám"
CREATE TABLE luot_kham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lich_hen_id UUID, 
    benh_nhan_id UUID NOT NULL,
    bac_si_id UUID NOT NULL,
    phong_id UUID NOT NULL,
    
    loai_luot_kham VARCHAR(50) DEFAULT 'OUTPATIENT', 
    
    bat_dau_luc TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    ket_thuc_luc TIMESTAMP, 
    
    trang_thai VARCHAR(50) DEFAULT 'IN_PROGRESS', -- Đang khám, Chờ KQ, Hoàn thành
    
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lich_hen_id) REFERENCES lich_hen(id),
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id),
    FOREIGN KEY (bac_si_id) REFERENCES bac_si(id),
    FOREIGN KEY (phong_id) REFERENCES phong_kham(id)
);

-- Phiếu đo huyết áp, nhịp tim, thông tin bác sĩ hỏi bệnh
CREATE TABLE kham_lam_sang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    luot_kham_id UUID NOT NULL UNIQUE, 
    
    nhip_tim INT, 
    huyet_ap_tam_thu INT, 
    huyet_ap_tam_truong INT, 
    nhiet_do DECIMAL(4,2), 
    nhip_tho INT, 
    spo2 INT, 
    can_nang DECIMAL(5,2), 
    chieu_cao DECIMAL(5,2), 
    bmi DECIMAL(4,2), 
    
    ly_do_vao_vien TEXT, 
    ghi_chu_benh_su TEXT, 
    kham_thuc_the TEXT, 
    
    nguoi_ghi_nhan UUID, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cap_nhat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_ghi_nhan) REFERENCES nguoi_dung(id)
);

-- Nhập theo mã bệnh quốc tế ICD-10
CREATE TABLE chan_doan_luot_kham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    luot_kham_id UUID NOT NULL,
    ma_icd10 VARCHAR(20) NOT NULL, 
    ten_chan_doan VARCHAR(255) NOT NULL, 
    loai_chan_doan VARCHAR(50) DEFAULT 'PRIMARY', 
    ghi_chu TEXT, 
    nguoi_chan_doan UUID NOT NULL, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_chan_doan) REFERENCES nguoi_dung(id)
);

-- Bác sĩ yêu cầu đi xét nghiệm máu, chụp X-Quang, Siêu âm
CREATE TABLE chi_dinh_can_lam_sang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    luot_kham_id UUID NOT NULL,
    ma_dich_vu VARCHAR(50) NOT NULL, 
    ten_dich_vu VARCHAR(255) NOT NULL,
    
    chi_dinh_lam_sang TEXT, 
    muc_do_uu_tien VARCHAR(50) DEFAULT 'ROUTINE', 
    
    trang_thai VARCHAR(50) DEFAULT 'PENDING', 
    
    nguoi_chi_dinh UUID NOT NULL, 
    chi_dinh_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_chi_dinh) REFERENCES nguoi_dung(id)
);

-- Chứa kết quả từ phòng xét nghiệm trả về
CREATE TABLE ket_qua_can_lam_sang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chi_dinh_id UUID NOT NULL UNIQUE,
    tom_tat_ket_qua TEXT, 
    chi_tiet_ket_qua JSON, -- Lưu cụ thể từng chỉ số: Máu WBC, Tiểu cầu...
    url_dinh_kem JSON, 
    
    nguoi_thuc_hien UUID, 
    thuc_hien_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chi_dinh_id) REFERENCES chi_dinh_can_lam_sang(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_thuc_hien) REFERENCES nguoi_dung(id)
);

-- Bằng chứng mã hóa bác sĩ đã chốt bệnh án
CREATE TABLE chu_ky_benh_an (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    luot_kham_id UUID NOT NULL UNIQUE,
    nguoi_ky UUID NOT NULL, 
    
    chuoi_ma_hoa_chu_ky VARCHAR(255) NOT NULL, 
    serial_chung_thu VARCHAR(100), 
    
    ky_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dia_chi_ip VARCHAR(45),
    
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_ky) REFERENCES nguoi_dung(id)
);

-- ========================================================
-- KÊ ĐƠN & QUẢN LÝ TỒN KHO THUỐC

CREATE TABLE nhom_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nhom VARCHAR(50) UNIQUE NOT NULL, 
    ten_nhom VARCHAR(150) NOT NULL,
    mo_ta TEXT
);

CREATE TABLE thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_thuoc VARCHAR(50) UNIQUE NOT NULL, 
    ma_thuoc_quoc_gia VARCHAR(100), 
    
    ten_thuong_mai VARCHAR(255) NOT NULL, 
    hoat_chat_chinh TEXT NOT NULL, 
    
    nhom_thuoc_id UUID REFERENCES nhom_thuoc(id),
    
    duong_dung VARCHAR(50), 
    don_vi_cap_phat VARCHAR(20) NOT NULL, 
    
    chi_ban_theo_don BOOLEAN DEFAULT TRUE, 
    dang_hoat_dong BOOLEAN DEFAULT TRUE,
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Thông tin chung của tờ đơn thuốc xuất cho bệnh nhân
CREATE TABLE don_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_don_thuoc VARCHAR(50) UNIQUE NOT NULL, 
    luot_kham_id UUID NOT NULL UNIQUE, 
    bac_si_id UUID NOT NULL, 
    benh_nhan_id UUID NOT NULL, 
    
    trang_thai VARCHAR(50) DEFAULT 'DRAFT', 
    chan_doan_lam_sang TEXT, 
    loi_dan_bac_si TEXT, 
    
    ke_don_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE,
    FOREIGN KEY (bac_si_id) REFERENCES nguoi_dung(id),
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id)
);

-- Từng viên thuốc uống bao nhiêu cữ trong đơn thuốc
CREATE TABLE chi_tiet_don_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    don_thuoc_id UUID NOT NULL,
    thuoc_id UUID NOT NULL,
    
    so_luong INT NOT NULL, 
    lieu_luong VARCHAR(100) NOT NULL, 
    tan_suat VARCHAR(100) NOT NULL, 
    so_ngay_dung INT, 
    
    huong_dan_su_dung TEXT, 
    
    FOREIGN KEY (don_thuoc_id) REFERENCES don_thuoc(id) ON DELETE CASCADE,
    FOREIGN KEY (thuoc_id) REFERENCES thuoc(id)
);

-- Kho chứa số viên, hạn sử dụng, giá vốn lô thuốc
CREATE TABLE ton_kho_nha_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thuoc_id UUID NOT NULL,
    
    ten_lo VARCHAR(100) NOT NULL, 
    ngay_het_han DATE NOT NULL, 
    
    so_luong_ton INT NOT NULL DEFAULT 0, 
    gia_nhap_vao DECIMAL(12,2), 
    gia_ban_le DECIMAL(12,2), 
    
    vi_tri_luu_tru VARCHAR(50), 
    
    FOREIGN KEY (thuoc_id) REFERENCES thuoc(id) ON DELETE CASCADE,
    UNIQUE (thuoc_id, ten_lo) 
);

-- Lệnh từ bác sĩ gửi xuống quầy dược cho dược sĩ bốc thuốc
CREATE TABLE phieu_xuat_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    don_thuoc_id UUID NOT NULL UNIQUE, 
    duoc_si_id UUID NOT NULL, 
    
    trang_thai VARCHAR(50) DEFAULT 'COMPLETED', 
    xuat_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (don_thuoc_id) REFERENCES don_thuoc(id),
    FOREIGN KEY (duoc_si_id) REFERENCES nguoi_dung(id)
);

-- Trừ thuốc cụ thể từ lô tồn kho nào
CREATE TABLE chi_tiet_xuat_thuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phieu_xuat_id UUID NOT NULL,
    chi_tiet_don_thuoc_id UUID NOT NULL, 
    ton_kho_id UUID NOT NULL, 
    
    so_luong_xuat INT NOT NULL, 
    
    FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat_thuoc(id) ON DELETE CASCADE,
    FOREIGN KEY (chi_tiet_don_thuoc_id) REFERENCES chi_tiet_don_thuoc(id),
    FOREIGN KEY (ton_kho_id) REFERENCES ton_kho_nha_thuoc(id)
);

-- ========================================================
-- HỒ SƠ SỨC KHỎE ĐIỆN TỬ (TỔNG HỢP)

-- Timeline ghi nhận mọi dấu ấn của bệnh nhân tại bệnh viện (Tiêm chủng, khám, lấy thuốc)
CREATE TABLE su_kien_dong_thoi_gian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    
    ngay_su_kien TIMESTAMP NOT NULL, 
    
    loai_su_kien VARCHAR(50) NOT NULL, 
    
    tieu_de VARCHAR(255) NOT NULL, 
    tom_tat TEXT, 
    
    id_tham_chieu UUID, 
    bang_tham_chieu VARCHAR(50), 
    
    he_thong_nguon VARCHAR(100) DEFAULT 'INTERNAL_HIS', 
    
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

CREATE INDEX idx_timeline_patient_date ON su_kien_dong_thoi_gian(benh_nhan_id, ngay_su_kien DESC);

-- Tự động vẽ biểu đồ Huyết áp, Cân nặng theo thời gian
CREATE TABLE chi_so_suc_khoe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    
    ma_chi_so VARCHAR(50) NOT NULL, 
    ten_chi_so VARCHAR(100) NOT NULL, 
    
    gia_tri_chi_so JSON NOT NULL, 
    don_vi_do VARCHAR(20) NOT NULL, 
    
    do_luc TIMESTAMP NOT NULL, 
    
    nguon_du_lieu VARCHAR(50) DEFAULT 'SELF_REPORTED', 
    thong_tin_thiet_bi VARCHAR(255), 
    
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

CREATE TABLE ho_so_suc_khoe_ben_ngoai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    
    nha_cung_cap VARCHAR(255) NOT NULL, 
    giao_thuc_dong_bo VARCHAR(50), 
    
    loai_du_lieu VARCHAR(50), 
    du_lieu_goc JSONB NOT NULL, 
    
    trang_thai_dong_bo VARCHAR(50) DEFAULT 'PENDING', 
    dong_bo_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

-- Phân quyền cho phép người nhà hoặc bác sĩ xem dữ liệu
CREATE TABLE quyen_truy_cap_ho_so (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benh_nhan_id UUID NOT NULL,
    nguoi_duoc_cap_id UUID NOT NULL, 
    
    muc_do_truy_cap VARCHAR(50) DEFAULT 'READ_ONLY', 
    
    phan_he_cho_phep JSON, 
    
    hieu_luc_tu TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hieu_luc_den TIMESTAMP, 
    
    trang_thai VARCHAR(50) DEFAULT 'ACTIVE', 
    nguoi_cap_quyen UUID, 
    
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_duoc_cap_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

-- ========================================================
-- TƯ VẤN & KHÁM TỪ XA CHUYÊN DỤNG (TELEMEDICINE)

-- Thông tin tích hợp Zoom/Zalo Video để tạo phòng họp
CREATE TABLE kham_tu_xa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    luot_kham_id UUID NOT NULL UNIQUE, 
    
    nen_tang VARCHAR(50) DEFAULT 'AGORA', 
    id_phong_hop VARCHAR(100), 
    mat_khau_phong VARCHAR(100), 
    
    url_host TEXT, 
    url_join TEXT NOT NULL, 
    
    url_ghi_am TEXT, 
    thoi_luong_ghi_am INT, 
    
    trang_thai_cuoc_goi VARCHAR(50) DEFAULT 'SCHEDULED', 
    
    bat_dau_thuc_te TIMESTAMP, 
    ket_thuc_thuc_te TIMESTAMP, 
    
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE CASCADE
);

-- Lưu log tin nhắn lúc khám online
CREATE TABLE tin_nhan_tu_xa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kham_tu_xa_id UUID NOT NULL,
    
    nguoi_gui_id UUID NOT NULL, 
    loai_nguoi_gui VARCHAR(50), 
    
    loai_tin_nhan VARCHAR(50) DEFAULT 'TEXT', 
    noi_dung TEXT, 
    url_tap_tin TEXT, 
    
    da_doc BOOLEAN DEFAULT FALSE, 
    gui_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (kham_tu_xa_id) REFERENCES kham_tu_xa(id) ON DELETE CASCADE,
    FOREIGN KEY (nguoi_gui_id) REFERENCES nguoi_dung(id) ON DELETE CASCADE
);

CREATE INDEX idx_tele_messages_time ON tin_nhan_tu_xa(kham_tu_xa_id, gui_luc ASC);

-- Đánh giá 5 sao sau khi tư vấn
CREATE TABLE danh_gia_dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kham_tu_xa_id UUID NOT NULL UNIQUE,
    benh_nhan_id UUID NOT NULL,
    
    diem_bac_si INT CHECK (diem_bac_si >= 1 AND diem_bac_si <= 5), 
    danh_gia_bac_si TEXT,
    
    diem_ky_thuat INT CHECK (diem_ky_thuat >= 1 AND diem_ky_thuat <= 5),
    danh_gia_ky_thuat TEXT, 
    loi_ky_thuat JSON, 
    
    gui_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (kham_tu_xa_id) REFERENCES kham_tu_xa(id) ON DELETE CASCADE,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE
);

-- ========================================================
-- THANH TOÁN & THU NGÂN

CREATE TABLE nhom_dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_nhom VARCHAR(50) UNIQUE NOT NULL,
    ten_nhom VARCHAR(100) NOT NULL,
    mo_ta TEXT
);

CREATE TABLE dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_dich_vu VARCHAR(50) UNIQUE NOT NULL, 
    nhom_dich_vu_id UUID REFERENCES nhom_dich_vu(id),
    
    ten_dich_vu VARCHAR(255) NOT NULL,
    gia_niem_yet DECIMAL(12,2) NOT NULL, 
    gia_bao_hiem DECIMAL(12,2) DEFAULT 0, 
    
    dang_hoat_dong BOOLEAN DEFAULT TRUE,
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khuyen_mai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_khuyen_mai VARCHAR(50) UNIQUE NOT NULL, 
    ten_khuyen_mai VARCHAR(150) NOT NULL,
    loai_giam_gia VARCHAR(20) NOT NULL, 
    gia_tri_giam DECIMAL(12,2) NOT NULL,
    
    ngay_bat_dau TIMESTAMP NOT NULL,
    ngay_ket_thuc TIMESTAMP NOT NULL,
    dang_hoat_dong BOOLEAN DEFAULT TRUE
);

-- Gộp chung tiền khám, tiền thuốc, tiền xét nghiệm vào 1 Hóa đơn Tổng
CREATE TABLE hoa_don (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_hoa_don VARCHAR(50) UNIQUE NOT NULL, 
    benh_nhan_id UUID NOT NULL,
    luot_kham_id UUID, 
    
    tong_tien DECIMAL(12,2) NOT NULL DEFAULT 0, 
    tien_giam_gia DECIMAL(12,2) DEFAULT 0, 
    tien_bao_hiem DECIMAL(12,2) DEFAULT 0, 
    tien_thuc_thu DECIMAL(12,2) NOT NULL, 
    tien_da_tra DECIMAL(12,2) DEFAULT 0, 
    
    trang_thai VARCHAR(50) DEFAULT 'UNPAID',  -- Chưa thanh toán, Đã thanh toán, v.v
    
    nguoi_tao UUID, 
    tao_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (benh_nhan_id) REFERENCES benh_nhan(id) ON DELETE CASCADE,
    FOREIGN KEY (luot_kham_id) REFERENCES luot_kham(id) ON DELETE SET NULL
);

-- Lưu lại từng món đã mua để bệnh nhân xem Biên lai
CREATE TABLE chi_tiet_hoa_don (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoa_don_id UUID NOT NULL,
    
    loai_tham_chieu VARCHAR(50) NOT NULL, 
    id_tham_chieu UUID NOT NULL, 
    
    ten_muc VARCHAR(255) NOT NULL, 
    so_luong INT NOT NULL DEFAULT 1,
    don_gia DECIMAL(12,2) NOT NULL,
    thanh_tien DECIMAL(12,2) NOT NULL, 
    
    FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id) ON DELETE CASCADE
);

-- Log lịch sử trả tiền của bệnh nhân (Quẹt thẻ, Tiền mặt, VNPay)
CREATE TABLE giao_dich_thanh_toan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ma_giao_dich VARCHAR(100) UNIQUE NOT NULL, 
    hoa_don_id UUID NOT NULL,
    
    loai_giao_dich VARCHAR(50) DEFAULT 'PAYMENT', 
    phuong_thuc_thanh_toan VARCHAR(50) NOT NULL, 
    
    so_tien DECIMAL(12,2) NOT NULL,
    
    id_giao_dich_cong_thanh_toan VARCHAR(255), 
    phan_hoi_cong_thanh_toan JSON, 
    
    trang_thai VARCHAR(50) DEFAULT 'PENDING', 
    
    thu_ngan_id UUID, 
    thanh_toan_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (hoa_don_id) REFERENCES hoa_don(id),
    FOREIGN KEY (thu_ngan_id) REFERENCES nguoi_dung(id)
);

-- Kiểm đếm cất giữ tiền mặt trong két sắt ngày hôm đó
CREATE TABLE ca_thu_ngan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thu_ngan_id UUID NOT NULL,
    
    bat_dau_ca TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ket_thuc_ca TIMESTAMP,
    
    tong_dau_ca DECIMAL(12,2) NOT NULL, 
    tong_he_thong_tinh DECIMAL(12,2) DEFAULT 0, 
    tong_thuc_te DECIMAL(12,2), 
    
    trang_thai VARCHAR(50) DEFAULT 'OPEN', 
    ghi_chu TEXT, 
    
    FOREIGN KEY (thu_ngan_id) REFERENCES nguoi_dung(id)
);
