import { db } from '../../db';
import { payments, orders } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const getInvoiceDetails = {
  name: 'get_invoice_details',
  description: 'Get invoice details for a payment or order',
  parameters: z.object({
    paymentId: z.string().optional().describe('The payment ID'),
    orderId: z.string().optional().describe('The order ID'),
    userId: z.string().describe('The user ID'),
  }),
  execute: async ({ paymentId, orderId, userId }: { paymentId?: string; orderId?: string; userId: string }) => {
    let payment;

    if (paymentId) {
      const result = await db
        .select()
        .from(payments)
        .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
        .limit(1);
      payment = result[0];
    } else if (orderId) {
      const result = await db
        .select()
        .from(payments)
        .where(and(eq(payments.orderId, orderId), eq(payments.userId, userId)))
        .limit(1);
      payment = result[0];
    }

    if (!payment) {
      return { error: 'Payment not found' };
    }

    return {
      invoice: {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        invoiceUrl: payment.invoiceUrl,
        createdAt: payment.createdAt,
      },
    };
  },
};

export const checkRefundStatus = {
  name: 'check_refund_status',
  description: 'Check the refund status for a payment',
  parameters: z.object({
    paymentId: z.string().describe('The payment ID'),
    userId: z.string().describe('The user ID'),
  }),
  execute: async ({ paymentId, userId }: { paymentId: string; userId: string }) => {
    const payment = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
      .limit(1);

    if (payment.length === 0) {
      return { error: 'Payment not found' };
    }

    const paymentData = payment[0];

    return {
      paymentId: paymentData.id,
      orderId: paymentData.orderId,
      originalAmount: paymentData.amount,
      status: paymentData.status,
      refundAmount: paymentData.refundAmount,
      refundReason: paymentData.refundReason,
      refundProcessedAt: paymentData.status === 'refunded' ? paymentData.updatedAt : null,
    };
  },
};

export const listUserPayments = {
  name: 'list_user_payments',
  description: 'List all payments for a specific user',
  parameters: z.object({
    userId: z.string().describe('The user ID'),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const userPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId));

    return {
      payments: userPayments.map(payment => ({
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
      })),
    };
  },
};

export const billingTools = [getInvoiceDetails, checkRefundStatus, listUserPayments];
