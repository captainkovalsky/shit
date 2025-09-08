"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.battleRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.battleRoutes = router;
router.post('/pve', (_req, res) => {
    res.json({ success: true, data: { battle: 'placeholder' } });
});
//# sourceMappingURL=battleRoutes.js.map