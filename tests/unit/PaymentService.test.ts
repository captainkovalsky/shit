import { PaymentService } from '@/database/services/PaymentService';
import { PaymentStatus } from '@prisma/client';

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentService = new PaymentService();
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent for valid user and product', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      const result = await paymentService.createPaymentIntent(userId, productId);

      expect(result.success).toBe(true);
      expect(result.paymentIntent).toBeDefined();
      expect(result.paymentIntent?.userId).toBe(userId);
      expect(result.paymentIntent?.product).toBe(productId);
      expect(result.paymentIntent?.status).toBe(PaymentStatus.PENDING);
    });

    it('should return error for non-existent user', async () => {
      const userId = 'non-existent';
      const productId = 'gems_pack_100';

      const result = await paymentService.createPaymentIntent(userId, productId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should return error for non-existent product', async () => {
      const userId = 'user-123';
      const productId = 'non-existent';

      const result = await paymentService.createPaymentIntent(userId, productId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('processPaymentSuccess', () => {
    it('should process successful payment and grant gems', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      const createResult = await paymentService.createPaymentIntent(userId, productId);
      expect(createResult.success).toBe(true);

      const successResult = await paymentService.processPaymentSuccess(
        createResult.paymentIntent!.id,
        { transaction_id: 'tx_123' }
      );

      expect(successResult.success).toBe(true);
      expect(successResult.paymentIntent?.status).toBe(PaymentStatus.SUCCEEDED);
    });

    it('should return error for non-existent payment intent', async () => {
      const result = await paymentService.processPaymentSuccess('non-existent', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });

    it('should return error for non-pending payment intent', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      const createResult = await paymentService.createPaymentIntent(userId, productId);
      await paymentService.processPaymentSuccess(createResult.paymentIntent!.id, {});

      const result = await paymentService.processPaymentSuccess(createResult.paymentIntent!.id, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent is not pending');
    });
  });

  describe('processPaymentFailure', () => {
    it('should process failed payment', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      const createResult = await paymentService.createPaymentIntent(userId, productId);
      const failureResult = await paymentService.processPaymentFailure(
        createResult.paymentIntent!.id,
        'Insufficient funds'
      );

      expect(failureResult.success).toBe(true);
      expect(failureResult.paymentIntent?.status).toBe(PaymentStatus.FAILED);
    });

    it('should return error for non-existent payment intent', async () => {
      const result = await paymentService.processPaymentFailure('non-existent', 'Test failure');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment intent not found');
    });
  });

  describe('getPaymentIntent', () => {
    it('should return payment intent by ID', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      const createResult = await paymentService.createPaymentIntent(userId, productId);
      const paymentIntent = await paymentService.getPaymentIntent(createResult.paymentIntent!.id);

      expect(paymentIntent).toBeDefined();
      expect(paymentIntent?.id).toBe(createResult.paymentIntent!.id);
    });

    it('should return null for non-existent payment intent', async () => {
      const paymentIntent = await paymentService.getPaymentIntent('non-existent');
      expect(paymentIntent).toBeNull();
    });
  });

  describe('getUserPaymentHistory', () => {
    it('should return empty array for user with no payments', async () => {
      const history = await paymentService.getUserPaymentHistory('user-123');
      expect(history).toEqual([]);
    });

    it('should return payment history for user', async () => {
      const userId = 'user-123';
      const productId = 'gems_pack_100';

      await paymentService.createPaymentIntent(userId, productId);
      const history = await paymentService.getUserPaymentHistory(userId);

      expect(history.length).toBe(1);
      expect(history[0].userId).toBe(userId);
    });
  });

  describe('getAvailableProducts', () => {
    it('should return all available products', () => {
      const products = paymentService.getAvailableProducts();

      expect(products.length).toBeGreaterThan(0);
      expect(products.every(p => p.id && p.name && p.description && p.gems && p.amountMinor)).toBe(true);
    });

    it('should include gems packs', () => {
      const products = paymentService.getAvailableProducts();
      const gemsPacks = products.filter(p => p.category === 'gems');

      expect(gemsPacks.length).toBeGreaterThan(0);
      expect(gemsPacks.every(p => p.gems > 0)).toBe(true);
    });

    it('should include inventory expansions', () => {
      const products = paymentService.getAvailableProducts();
      const inventoryItems = products.filter(p => p.category === 'inventory');

      expect(inventoryItems.length).toBeGreaterThan(0);
    });

    it('should include cosmetic items', () => {
      const products = paymentService.getAvailableProducts();
      const cosmeticItems = products.filter(p => p.category === 'cosmetic');

      expect(cosmeticItems.length).toBeGreaterThan(0);
    });
  });

  describe('validatePaymentWebhook', () => {
    it('should validate correct webhook signature', () => {
      const payload = { test: 'data' };
      const signature = 'test-signature';

      const isValid = paymentService.validatePaymentWebhook(payload, signature);

      expect(typeof isValid).toBe('boolean');
    });

    it('should reject invalid webhook signature', () => {
      const payload = { test: 'data' };
      const invalidSignature = 'invalid-signature';

      const isValid = paymentService.validatePaymentWebhook(payload, invalidSignature);

      expect(isValid).toBe(false);
    });
  });

  describe('product categories', () => {
    it('should have gems packs with correct pricing', () => {
      const products = paymentService.getAvailableProducts();
      const gemsPacks = products.filter(p => p.category === 'gems');

      gemsPacks.forEach(pack => {
        expect(pack.gems).toBeGreaterThan(0);
        expect(pack.amountMinor).toBeGreaterThan(0);
        expect(pack.currency).toBe('USD');
      });
    });

    it('should have inventory expansions with correct pricing', () => {
      const products = paymentService.getAvailableProducts();
      const inventoryItems = products.filter(p => p.category === 'inventory');

      inventoryItems.forEach(item => {
        expect(item.gems).toBeGreaterThan(0);
        expect(item.amountMinor).toBeGreaterThan(0);
        expect(item.name).toContain('Inventory');
      });
    });

    it('should have cosmetic items with correct pricing', () => {
      const products = paymentService.getAvailableProducts();
      const cosmeticItems = products.filter(p => p.category === 'cosmetic');

      cosmeticItems.forEach(item => {
        expect(item.gems).toBeGreaterThan(0);
        expect(item.amountMinor).toBeGreaterThan(0);
        expect(item.name).toContain('Skin');
      });
    });
  });
});
