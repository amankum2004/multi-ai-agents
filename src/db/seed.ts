import 'dotenv/config';
import { db, client } from './index';
import { orders, payments, faqs } from './schema';
import { nanoid } from 'nanoid';

async function seed() {
  console.log('Seeding database...');

  await db.insert(faqs).values([
    {
      id: nanoid(),
      question: 'How do I reset my password?',
      answer: 'Click "Forgot Password" on the login page.',
      category: 'account',
    },
    {
      id: nanoid(),
      question: 'What are your shipping options?',
      answer: 'Standard (5–7 days) or Express (2–3 days).',
      category: 'shipping',
    },
  ]).onConflictDoNothing();

  await db.insert(orders).values([
    {
      id: 'ORD-001',
      userId: 'user-123',
      status: 'shipped',
      totalAmount: '149.99',
      items: [{ name: 'Headphones', quantity: 1, price: 149.99 }],
      shippingAddress: '123 Main St, NY',
      trackingNumber: 'TRK123',
      estimatedDelivery: new Date(),
    },
  ]).onConflictDoNothing();

  await db.insert(payments).values([
    {
      id: 'PAY-001',
      orderId: 'ORD-001',
      userId: 'user-123',
      amount: '149.99',
      status: 'completed',
      paymentMethod: 'credit_card',
    },
  ]).onConflictDoNothing();

  console.log('Database seeded successfully!');
}

seed()
  .catch((err) => {
    console.error('Error seeding database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end(); // 🔴 VERY IMPORTANT
    process.exit(0);
  });
