import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

export const fetchOrderDetails = {
  name: 'fetch_order_details',
  description: 'Fetch detailed information about a specific order',
  parameters: z.object({
    orderId: z.string().describe('The order ID to fetch'),
    userId: z.string().describe('The user ID who owns the order'),
  }),
  execute: async ({ orderId, userId }: { orderId: string; userId: string }) => {
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (order.length === 0) {
      return { error: 'Order not found or does not belong to this user' };
    }

    return {
      order: {
        id: order[0].id,
        status: order[0].status,
        totalAmount: order[0].totalAmount,
        items: order[0].items,
        shippingAddress: order[0].shippingAddress,
        trackingNumber: order[0].trackingNumber,
        estimatedDelivery: order[0].estimatedDelivery,
        createdAt: order[0].createdAt,
      },
    };
  },
};

export const checkDeliveryStatus = {
  name: 'check_delivery_status',
  description: 'Check the delivery status and tracking information for an order',
  parameters: z.object({
    orderId: z.string().describe('The order ID to check'),
    userId: z.string().describe('The user ID who owns the order'),
  }),
  execute: async ({ orderId, userId }: { orderId: string; userId: string }) => {
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (order.length === 0) {
      return { error: 'Order not found' };
    }

    const orderData = order[0];
    
    return {
      orderId: orderData.id,
      status: orderData.status,
      trackingNumber: orderData.trackingNumber,
      estimatedDelivery: orderData.estimatedDelivery,
      currentLocation: orderData.trackingNumber ? 'In transit to destination' : 'Preparing for shipment',
      lastUpdate: orderData.updatedAt,
    };
  },
};

export const listUserOrders = {
  name: 'list_user_orders',
  description: 'List all orders for a specific user',
  parameters: z.object({
    userId: z.string().describe('The user ID'),
  }),
  execute: async ({ userId }: { userId: string }) => {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    return {
      orders: userOrders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      })),
    };
  },
};

export const orderTools = [fetchOrderDetails, checkDeliveryStatus, listUserOrders];
