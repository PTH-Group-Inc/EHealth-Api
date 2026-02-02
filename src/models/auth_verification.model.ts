export interface AccountVerification {
    id: string;
    accountId: string;
    verifyTokenHash: string;
    expiredAt: Date;
    usedAt: Date | null;
    createdAt: Date;
}