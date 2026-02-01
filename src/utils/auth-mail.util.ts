// utils/auth-mail.util.ts
import { MailService } from '../services/mail.service'; // Import service vừa tạo

export class AuthMailUtil {
    /**
     * Gửi email reset password
     */
    static async sendResetPasswordEmail(toEmail: string, resetLink: string): Promise<void> {
        const subject = '[E-Health] Yêu cầu đặt lại mật khẩu';

        // Nên làm template HTML đẹp hơn một chút
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Đặt lại mật khẩu</h2>
                <p>Xin chào,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản E-Health của bạn.</p>
                <p>Vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới (Link có hiệu lực trong 15 phút):</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                       style="background-color: #007bff; color: #ffffff; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Đặt lại mật khẩu
                    </a>
                </div>

                <p style="color: #666; font-size: 14px;">
                    Hoặc copy đường dẫn sau vào trình duyệt: <br/>
                    <a href="${resetLink}">${resetLink}</a>
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #999; font-size: 12px;">
                    Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                </p>
            </div>
        `;

        await MailService.send({
            to: toEmail,
            subject,
            html,
        });
    }
}