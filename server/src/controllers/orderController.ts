import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

type CreateOrderItemBody = {
  menuId: number;
  menuName: string;
  temperature: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type CreateOrderBody = {
  phoneNumber?: string;
  items?: CreateOrderItemBody[];
  totalPrice?: number;
  orderType?: 'user' | 'admin';
};

type OrderItemRow = {
  orderId: number;
  status: string;
  orderTotalPrice: number;
  createdAt: Date;
  itemId: number;
  menuName: string;
  temperature: string;
  size: string;
  quantity: number;
  unitPrice: number;
  itemTotalPrice: number;
};

function isValidOrderItem(item: CreateOrderItemBody) {
  return (
    Number.isInteger(item.menuId) &&
    typeof item.menuName === 'string' &&
    item.menuName.trim().length > 0 &&
    ['HOT', 'ICE'].includes(item.temperature) &&
    ['REGULAR', 'LARGE'].includes(item.size) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0 &&
    Number.isInteger(item.unitPrice) &&
    item.unitPrice >= 0 &&
    Number.isInteger(item.totalPrice) &&
    item.totalPrice >= 0
  );
}

export async function createOrder(request: Request, response: Response) {
  const { phoneNumber, items, totalPrice, orderType = 'user' } = request.body as CreateOrderBody;

  if (!phoneNumber?.trim()) {
    response.status(400).json({ message: '전화번호를 입력해주세요.' });
    return;
  }

  if (!items?.length) {
    response.status(400).json({ message: '주문할 메뉴가 없습니다.' });
    return;
  }

  if (!items.every(isValidOrderItem)) {
    response.status(400).json({ message: '주문 항목 형식이 올바르지 않습니다.' });
    return;
  }

  const calculatedTotalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (totalPrice !== calculatedTotalPrice) {
    response.status(400).json({ message: '총 주문 금액이 올바르지 않습니다.' });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let orderResult;

    if (orderType === 'admin') {
      orderResult = await client.query(
        `
          INSERT INTO admin_orders (admin_code, total_price, status)
          VALUES ($1, $2, 'completed')
          RETURNING id, total_price AS "totalPrice", status, created_at AS "createdAt"
        `,
        [phoneNumber.trim(), calculatedTotalPrice]
      );
    } else {
      const userResult = await client.query(
        `
          INSERT INTO users (phone_number)
          VALUES ($1)
          ON CONFLICT (phone_number)
          DO UPDATE SET phone_number = EXCLUDED.phone_number
          RETURNING id
        `,
        [phoneNumber.trim()]
      );

      const userId = userResult.rows[0].id as number;

      orderResult = await client.query(
        `
          INSERT INTO orders (user_id, total_price, status)
          VALUES ($1, $2, 'completed')
          RETURNING id, total_price AS "totalPrice", status, created_at AS "createdAt"
        `,
        [userId, calculatedTotalPrice]
      );
    }

    const order = orderResult.rows[0];

    for (const item of items) {
      if (orderType === 'admin') {
        await client.query(
          `
            INSERT INTO admin_order_items (
              admin_order_id,
              menu_id,
              menu_name,
              temperature,
              size,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            order.id,
            item.menuId,
            item.menuName,
            item.temperature,
            item.size,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          ]
        );
      } else {
        await client.query(
          `
            INSERT INTO order_items (
              order_id,
              menu_id,
              menu_name,
              temperature,
              size,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            order.id,
            item.menuId,
            item.menuName,
            item.temperature,
            item.size,
            item.quantity,
            item.unitPrice,
            item.totalPrice
          ]
        );
      }
    }

    await client.query('COMMIT');

    response.status(201).json({
      orderId: order.id,
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
      message: '주문이 완료되었습니다.'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    response.status(500).json({ message: '주문을 저장하지 못했습니다.' });
  } finally {
    client.release();
  }
}

export async function getOrders(request: Request, response: Response) {
  const phoneNumber = String(request.query.phoneNumber ?? '').trim();

  if (!phoneNumber) {
    response.status(400).json({ message: '전화번호를 입력해주세요.' });
    return;
  }

  try {
    const result = await pool.query<OrderItemRow>(
      `
        SELECT
          o.id AS "orderId",
          o.status,
          o.total_price AS "orderTotalPrice",
          o.created_at AS "createdAt",
          oi.id AS "itemId",
          oi.menu_name AS "menuName",
          oi.temperature,
          oi.size,
          oi.quantity,
          oi.unit_price AS "unitPrice",
          oi.total_price AS "itemTotalPrice"
        FROM orders o
        JOIN users u ON u.id = o.user_id
        JOIN order_items oi ON oi.order_id = o.id
        WHERE u.phone_number = $1
        ORDER BY o.created_at DESC, oi.id ASC
      `,
      [phoneNumber]
    );

    const orders = result.rows.reduce<
      Array<{
        orderId: number;
        status: string;
        totalPrice: number;
        createdAt: Date;
        items: Array<{
          itemId: number;
          menuName: string;
          temperature: string;
          size: string;
          quantity: number;
          unitPrice: number;
          totalPrice: number;
        }>;
      }>
    >((orderList, row) => {
      let order = orderList.find((currentOrder) => currentOrder.orderId === row.orderId);

      if (!order) {
        order = {
          orderId: row.orderId,
          status: row.status,
          totalPrice: row.orderTotalPrice,
          createdAt: row.createdAt,
          items: []
        };
        orderList.push(order);
      }

      order.items.push({
        itemId: row.itemId,
        menuName: row.menuName,
        temperature: row.temperature,
        size: row.size,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        totalPrice: row.itemTotalPrice
      });

      return orderList;
    }, []);

    response.json(orders);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '주문 내역을 불러오지 못했습니다.' });
  }
}
