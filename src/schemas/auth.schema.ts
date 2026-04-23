import { z } from 'zod';

export const loginEmailSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
    clientInfo: z.object({
        deviceId: z.string(),
        deviceName: z.string()
    }).optional()
});

export const loginPhoneSchema = z.object({
    phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống'),
    clientInfo: z.object({
        deviceId: z.string(),
        deviceName: z.string()
    }).optional()
});

export const registerEmailSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
});

export const registerPhoneSchema = z.object({
    phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(15, 'Số điện thoại không hợp lệ'),
    password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự')
});

export const verifyEmailSchema = z.object({
    email: z.string().email('Email không hợp lệ'),
    code: z.string().min(6, 'Mã OTP phải có 6 ký tự').max(6, 'Mã OTP phải có 6 ký tự')
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email không hợp lệ')
});

export const resetPasswordSchema = z.object({
    otp: z.string().min(6, 'Mã OTP phải có 6 ký tự'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
});

export const unlockAccountSchema = z.object({
    accountId: z.string().min(1, 'ID tài khoản không được để trống')
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token không được để trống')
});
