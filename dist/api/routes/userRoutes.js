"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.userRoutes = router;
router.get('/me', (_req, res) => {
    res.json({ success: true, data: { user: 'placeholder' } });
});
//# sourceMappingURL=userRoutes.js.map