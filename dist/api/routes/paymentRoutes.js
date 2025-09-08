"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.paymentRoutes = router;
router.post('/intents', (_req, res) => {
    res.json({ success: true, data: { payment_intent: 'placeholder' } });
});
//# sourceMappingURL=paymentRoutes.js.map