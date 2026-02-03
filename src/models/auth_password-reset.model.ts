// src/models/auth_password-reset.model.ts

export interface PasswordReset {
  id: string;
  accountId: string;
  resetToken: string;
  expiredAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface CreatePasswordResetInput {
  accountId: string;
  resetTokenHash: string;
  expiredAt: Date;
}