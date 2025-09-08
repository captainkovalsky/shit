"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.characterRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.characterRoutes = router;
router.get('/', (_req, res) => {
    res.json({ success: true, data: { characters: [] } });
});
//# sourceMappingURL=characterRoutes.js.map