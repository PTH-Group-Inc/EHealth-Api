"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
// services/mail.service.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class MailService {
    static async send(options) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });
        }
        catch (error) {
            console.error('❌ Lỗi gửi email:', error);
        }
    }
}
exports.MailService = MailService;
MailService.transporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
