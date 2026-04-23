import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedData = schema.parse(req[source]);
            req[source] = parsedData;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(422).json({
                    success: false,
                    message: "Validation Error",
                    errors: error.errors.map(e => ({
                        path: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};
