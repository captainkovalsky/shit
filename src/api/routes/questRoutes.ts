import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ success: true, data: { quests: [] } });
});

export { router as questRoutes };
