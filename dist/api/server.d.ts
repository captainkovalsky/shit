import express from 'express';
export declare class ApiServer {
    private app;
    private port;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    start(): Promise<void>;
    getApp(): express.Application;
}
//# sourceMappingURL=server.d.ts.map