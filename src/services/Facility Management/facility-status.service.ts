// src/services/Facility Management/facility-status.service.ts
import { HolidayRepository } from '../../repository/Facility Management/holiday.repository';
import { ClosedDayRepository } from '../../repository/Facility Management/closed-day.repository';
import { OperatingHourRepository } from '../../repository/Facility Management/operating-hour.repository';
import { FacilityRepository } from '../../repository/Facility Management/facility.repository';
import { DAY_OF_WEEK_MAP } from '../../models/Facility Management/operating-hour.model';
import { AppError } from '../../utils/app-error.util';

/**
 * Kết quả trạng thái cơ sở cho 1 ngày
 */
export interface FacilityDayStatus {
    facility_id?: string;
    facility_name?: string;
    date: string;
    day_of_week: number;
    day_name: string;
    is_open: boolean;
    open_time: string | null;
    close_time: string | null;
    reason: 'HOLIDAY' | 'HOLIDAY_SPECIAL' | 'CLOSED_DAY' | 'CLOSED' | 'OPERATING_HOURS' | 'NO_CONFIG';
    note: string | null;
}

export class FacilityStatusService {

    /**
     * Xác định trạng thái mở/đóng cửa của 1 cơ sở tại 1 ngày cụ thể.
     */
    static async determineFacilityStatus(facilityId: string, dateStr: string): Promise<FacilityDayStatus> {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = dateObj.getDay(); // 0=CN, 6=T7 (đúng chuẩn DB)
        const dayName = DAY_OF_WEEK_MAP[dayOfWeek] || `Day ${dayOfWeek}`;
        const facility = await FacilityRepository.findFacilityById(facilityId);
        const facilityName = facility ? facility.name : undefined;

        // Kiểm tra Holiday (ưu tiên cao nhất)
        const holiday = await HolidayRepository.findByFacilityAndDate(facilityId, dateStr);
        if (holiday) {
            if (holiday.is_closed) {
                return {
                    facility_id: facilityId, facility_name: facilityName,
                    date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
                    is_open: false, open_time: null, close_time: null,
                    reason: 'HOLIDAY', note: holiday.title,
                };
            }
            // Mở giờ đặc biệt
            return {
                facility_id: facilityId, facility_name: facilityName,
                date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
                is_open: true,
                open_time: holiday.special_open_time,
                close_time: holiday.special_close_time,
                reason: 'HOLIDAY_SPECIAL', note: holiday.title,
            };
        }

        // Kiểm tra Closed Days (theo day_of_week)
        const hasFullClosure = await ClosedDayRepository.hasFullDayClosure(facilityId, dayOfWeek);
        if (hasFullClosure) {
            return {
                facility_id: facilityId, facility_name: facilityName,
                date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
                is_open: false, open_time: null, close_time: null,
                reason: 'CLOSED_DAY', note: `Ngày nghỉ cố định - ${dayName}`,
            };
        }

        // Kiểm tra Operating Hours (theo day_of_week)
        const opHour = await OperatingHourRepository.findByFacilityAndDay(facilityId, dayOfWeek);
        if (!opHour) {
            return {
                facility_id: facilityId, facility_name: facilityName,
                date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
                is_open: true, open_time: '07:00:00', close_time: '17:00:00',
                reason: 'NO_CONFIG', note: 'Chưa thiết lập giờ hoạt động cho ngày này (Dùng giờ mặc định)',
            };
        }

        if (opHour.is_closed) {
            return {
                facility_id: facilityId, facility_name: facilityName,
                date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
                is_open: false, open_time: null, close_time: null,
                reason: 'CLOSED', note: null,
            };
        }

        return {
            facility_id: facilityId, facility_name: facilityName,
            date: dateStr, day_of_week: dayOfWeek, day_name: dayName,
            is_open: true,
            open_time: opHour.open_time,
            close_time: opHour.close_time,
            reason: 'OPERATING_HOURS', note: null,
        };
    }

    /**
     * Lấy trạng thái hôm nay
     */
    static async getStatusToday(facilityId?: string): Promise<FacilityDayStatus | FacilityDayStatus[]> {
        const today = new Date().toISOString().slice(0, 10);
        if (!facilityId) {
            const facilities = await FacilityRepository.getFacilitiesForDropdown();
            return Promise.all(facilities.map(f => this.determineFacilityStatus(f.id, today)));
        }
        return this.determineFacilityStatus(facilityId, today);
    }

    /**
     * Lấy trạng thái theo ngày
     */
    static async getStatusByDate(facilityId: string, dateStr: string): Promise<FacilityDayStatus | FacilityDayStatus[]> {
        if (!dateStr) throw new AppError(400, 'MISSING_DATE', 'Bắt buộc phải có date.');
        if (!facilityId) {
            const facilities = await FacilityRepository.getFacilitiesForDropdown();
            return Promise.all(facilities.map(f => this.determineFacilityStatus(f.id, dateStr)));
        }
        return this.determineFacilityStatus(facilityId, dateStr);
    }

    /**
     * Trả về danh sách trạng thái cho tất cả các ngày trong 1 tháng.
     */
    static async getCalendar(facilityId: string, month: number, year: number): Promise<any> {
        if (!month || month < 1 || month > 12) throw new AppError(400, 'INVALID_MONTH', 'month phải từ 1-12.');
        if (!year || year < 2000) throw new AppError(400, 'INVALID_YEAR', 'year phải >= 2000.');

        const daysInMonth = new Date(year, month, 0).getDate();

        if (!facilityId) {
            const facilities = await FacilityRepository.getFacilitiesForDropdown();
            const result = [];
            for (const facility of facilities) {
                const days: FacilityDayStatus[] = [];
                for (let day = 1; day <= daysInMonth; day++) {
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const status = await this.determineFacilityStatus(facility.id, dateStr);
                    days.push(status);
                }
                result.push({ facility_id: facility.id, facility_name: facility.name, month, year, days });
            }
            return result;
        }

        const days: FacilityDayStatus[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const status = await this.determineFacilityStatus(facilityId, dateStr);
            days.push(status);
        }

        return { facility_id: facilityId, month, year, days };
    }
}
