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
                const zodError = error as ZodError<any>;
                require('fs').appendFileSync('zod_error.log', JSON.stringify(zodError.issues, null, 2) + '\n');
                return res.status(422).json({
                    success: false,
                    message: "Validation Error",
                    errors: zodError.issues.map((e: any) => ({
                        path: e.path.join('.'),
                        message: e.message
                    }))
                });
            }
            next(error);
        }
    };
};
