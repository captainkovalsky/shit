import request from 'supertest';
import { Server } from '../../src/api/server';

describe('API Server Tests', () => {
  let server: Server;
  let app: any;

  beforeAll(() => {
    server = new Server();
    app = server.getApp();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('User Routes', () => {
    it('should get user profile', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Character Routes', () => {
    it('should get characters list', async () => {
      const response = await request(app)
        .get('/api/v1/characters')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('characters');
      expect(Array.isArray(response.body.data.characters)).toBe(true);
    });
  });

  describe('Battle Routes', () => {
    it('should start PvE battle', async () => {
      const response = await request(app)
        .post('/api/v1/battles/pve')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('battle');
    });
  });

  describe('Quest Routes', () => {
    it('should get quests list', async () => {
      const response = await request(app)
        .get('/api/v1/quests')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('quests');
      expect(Array.isArray(response.body.data.quests)).toBe(true);
    });
  });

  describe('Shop Routes', () => {
    it('should get shop items', async () => {
      const response = await request(app)
        .get('/api/v1/shop/items')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('items');
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });
  });

  describe('Payment Routes', () => {
    it('should create payment intent', async () => {
      const response = await request(app)
        .post('/api/v1/payments/intents')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('payment_intent');
    });
  });

  describe('Webhook Routes', () => {
    it('should handle telegram payment webhook', async () => {
      const response = await request(app)
        .post('/api/v1/webhooks/telegram/payments')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect(404);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/battles/pve')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });
});
