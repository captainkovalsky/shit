"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.webhookRoutes = router;
router.post('/telegram/payments', (_req, res) => {
    res.json({ success: true });
});
//# sourceMappingURL=webhookRoutes.js.map