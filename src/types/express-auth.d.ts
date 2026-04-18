import 'express';

declare global {
    namespace Express {
        interface Request {
            auth?: {
                user_id: string;
                roles: string[];
                permissions: string[];
                sessionId: string;
                [key: string]: any;
            };
        }
    }
}

export {};
