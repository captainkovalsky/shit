import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        telegramId: string;
        userId: string;
    };
}
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const optionalAuthMiddleware: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map