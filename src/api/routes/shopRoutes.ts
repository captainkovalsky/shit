import { Router } from 'express';

const router = Router();

router.get('/items', (_req, res) => {
  res.json({ success: true, data: { items: [] } });
});

export { router as shopRoutes };
