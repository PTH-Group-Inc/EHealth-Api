import { AUTH_ERRORS } from '../constants/auth-error.constant';
import { Account, AccountStatus } from '../models/auth_account.model';
import { ClientInfo } from '../models/auth_user-session.model';
import { SecurityUtil } from './auth-security.util';

export class AuthValidator {
    /*
     * Xác thực thiết bị
     */
    static validateDevice(clientInfo: ClientInfo) {
        if (!clientInfo.deviceId) {
            throw AUTH_ERRORS.INVALID_DEVICE;
        }
    }

    /*
     * Xác thực thông tin đăng nhập
     */
    static async validateCredential(
        account: Account | null,
        password: string
    ) {
        if (!account) {
            throw AUTH_ERRORS.INVALID_CREDENTIAL;
        }

        const isPasswordValid =
            await SecurityUtil.verifyPasswordSafe(password, account.password);

        if (!isPasswordValid) {
            throw AUTH_ERRORS.INVALID_CREDENTIAL;
        }

        if (account.status !== 'ACTIVE') {
            throw AUTH_ERRORS.ACCOUNT_NOT_ACTIVE;
        }
    }
}