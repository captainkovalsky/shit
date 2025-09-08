import request from 'supertest';
import express from 'express';
import { characterRoutes } from '@/api/routes/characterRoutes';

const app = express();
app.use('/api/characters', characterRoutes);

describe('Character Routes', () => {
  describe('GET /api/characters', () => {
    it('should return empty characters array', async () => {
      const response = await request(app)
        .get('/api/characters')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { characters: [] }
      });
    });
  });
});
