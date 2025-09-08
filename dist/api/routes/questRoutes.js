"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.questRoutes = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.questRoutes = router;
router.get('/', (_req, res) => {
    res.json({ success: true, data: { quests: [] } });
});
//# sourceMappingURL=questRoutes.js.map