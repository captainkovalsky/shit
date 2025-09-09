import { PaymentIntent, PaymentStatus } from '@prisma/client';
import prisma from '../client';
import { UserService } from './UserService';

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  gems: number;
  amountMinor: number;
  currency: string;
  category: 'gems' | 'inventory' | 'cosmetic';
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntent?: PaymentIntent;
  error?: string;
}

export interface IPaymentService {
  createPaymentIntent(userId: string, productId: string): Promise<PaymentIntentResult>;
  processPaymentSuccess(paymentIntentId: string, providerData: Record<string, unknown>): Promise<PaymentIntentResult>;
  processPaymentFailure(paymentIntentId: string, reason: string): Promise<PaymentIntentResult>;
  getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null>;
  getUserPaymentHistory(userId: string): Promise<PaymentIntent[]>;
  getAvailableProducts(): PaymentProduct[];
  validatePaymentWebhook(payload: Record<string, unknown>, signature: string): boolean;
}

export class PaymentService implements IPaymentService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  private products: PaymentProduct[] = [
    {
      id: 'gems_pack_100',
      name: 'Starter Pack',
      description: '100 Gems to get you started',
      gems: 100,
      amountMinor: 299,
      currency: 'USD',
      category: 'gems',
    },
    {
      id: 'gems_pack_500',
      name: 'Adventurer Pack',
      description: '500 Gems for serious adventurers',
      gems: 500,
      amountMinor: 1299,
      currency: 'USD',
      category: 'gems',
    },
    {
      id: 'gems_pack_1000',
      name: 'Hero Pack',
      description: '1000 Gems for legendary heroes',
      gems: 1000,
      amountMinor: 1999,
      currency: 'USD',
      category: 'gems',
    },
    {
      id: 'gems_pack_2500',
      name: 'Legend Pack',
      description: '2500 Gems for ultimate power',
      gems: 2500,
      amountMinor: 3999,
      currency: 'USD',
      category: 'gems',
    },
    {
      id: 'inventory_expansion_10',
      name: 'Inventory Expansion',
      description: 'Add 10 inventory slots',
      gems: 100,
      amountMinor: 299,
      currency: 'USD',
      category: 'inventory',
    },
    {
      id: 'inventory_expansion_20',
      name: 'Large Inventory Expansion',
      description: 'Add 20 inventory slots',
      gems: 180,
      amountMinor: 499,
      currency: 'USD',
      category: 'inventory',
    },
    {
      id: 'cosmetic_skin_rare',
      name: 'Rare Skin',
      description: 'Exclusive rare character skin',
      gems: 200,
      amountMinor: 599,
      currency: 'USD',
      category: 'cosmetic',
    },
    {
      id: 'cosmetic_skin_epic',
      name: 'Epic Skin',
      description: 'Legendary epic character skin',
      gems: 500,
      amountMinor: 1299,
      currency: 'USD',
      category: 'cosmetic',
    },
  ];

  async createPaymentIntent(userId: string, productId: string): Promise<PaymentIntentResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const product = this.products.find(p => p.id === productId);
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    const paymentIntent = await prisma.paymentIntent.create({
      data: {
        userId,
        product: productId,
        amountMinor: product.amountMinor,
        currency: product.currency,
        status: PaymentStatus.PENDING,
        provider: 'telegram',
        metadata: {
          productName: product.name,
          gems: product.gems,
          category: product.category,
        },
        confirmationUrl: `https://t.me/YourBot?start=pay_${Date.now()}`,
      },
    });

    return {
      success: true,
      paymentIntent,
    };
  }

  async processPaymentSuccess(paymentIntentId: string, providerData: any): Promise<PaymentIntentResult> {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
    });

    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found',
      };
    }

    if (paymentIntent.status !== PaymentStatus.PENDING) {
      return {
        success: false,
        error: 'Payment intent is not pending',
      };
    }

    const product = this.products.find(p => p.id === paymentIntent.product);
    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    await prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentStatus.SUCCEEDED,
        metadata: {
          ...(paymentIntent.metadata as any),
          providerData,
          processedAt: new Date().toISOString(),
        },
      },
    });

    if (product.category === 'gems') {
      await this.userService.addGems(paymentIntent.userId, product.gems);
    } else if (product.category === 'inventory') {
      const slots = product.id === 'inventory_expansion_10' ? 10 : 20;
      await this.expandInventory(paymentIntent.userId, slots);
    } else if (product.category === 'cosmetic') {
      await this.grantCosmeticItem(paymentIntent.userId, product.id);
    }

    return {
      success: true,
      paymentIntent: await prisma.paymentIntent.findUnique({
        where: { id: paymentIntentId },
      }) as PaymentIntent,
    };
  }

  async processPaymentFailure(paymentIntentId: string, reason: string): Promise<PaymentIntentResult> {
    const paymentIntent = await prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
    });

    if (!paymentIntent) {
      return {
        success: false,
        error: 'Payment intent not found',
      };
    }

    const updatedPaymentIntent = await prisma.paymentIntent.update({
      where: { id: paymentIntentId },
      data: {
        status: PaymentStatus.FAILED,
        metadata: {
          ...(paymentIntent.metadata as any),
          failureReason: reason,
          failedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      paymentIntent: updatedPaymentIntent,
    };
  }

  async getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
    return prisma.paymentIntent.findUnique({
      where: { id: paymentIntentId },
    });
  }

  async getUserPaymentHistory(userId: string): Promise<PaymentIntent[]> {
    return prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getAvailableProducts(): PaymentProduct[] {
    return [...this.products];
  }

  validatePaymentWebhook(payload: any, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env['TELEGRAM_PAYMENT_SECRET'] || 'your-secret-key';
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  private async expandInventory(userId: string, slots: number): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // const currentExpansions = Math.floor(user.gems / 100);
    // const _newExpansions = currentExpansions + slots;

    await prisma.user.update({
      where: { id: userId },
      data: {
        gems: user.gems - (slots * 10),
      },
    });
  }

  private async grantCosmeticItem(userId: string, itemId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const product = this.products.find(p => p.id === itemId);
    if (!product) {
      throw new Error('Product not found');
    }

    await this.userService.spendGems(userId, product.gems);

    // Note: Cosmetic items are tracked in the payment intent metadata
    // For now, we'll just log the acquisition
    console.log(`Cosmetic item ${itemId} granted to user ${userId}`);
  }
}
