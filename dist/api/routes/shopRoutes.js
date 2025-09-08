"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.shopRoutes = router;
router.get('/items', (_req, res) => {
    res.json({ success: true, data: { items: [] } });
});
//# sourceMappingURL=shopRoutes.js.map