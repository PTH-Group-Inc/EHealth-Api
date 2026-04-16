export interface AppErrorContext {
    /** Tên service/module xảy ra lỗi, ví dụ: 'DispensingService.dispense' */
    module?: string;
    /** Dữ liệu bổ sung để debug */
    data?: Record<string, unknown>;
}

export class AppError extends Error {
    /** HTTP status code trả về cho client */
    public readonly httpCode: number;

    /** Mã lỗi dạng string cho client xử lý, ví dụ: 'NOT_FOUND' */
    public readonly code: string;

    /**
     * Lỗi nghiệp vụ (operational = true): dự kiến được, log ở mức warn.
     */
    public readonly isOperational: boolean;

    /** Thông tin bổ sung để debug (không hiển thị cho client) */
    public readonly context?: AppErrorContext;

    constructor(
        httpCode: number,
        code: string,
        message: string,
        isOperational: boolean = true,
        context?: AppErrorContext,
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.httpCode = httpCode;
        this.code = code;
        this.isOperational = isOperational;
        this.context = context;

        Error.captureStackTrace(this, this.constructor);
    }
}
