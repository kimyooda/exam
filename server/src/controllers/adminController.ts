import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';

const adminCode = 'knda123';

type AdminOrderItemRow = {
  orderId: number;
  phoneNumber: string;
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

type CreateMenuBody = {
  adminCode?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  imageUrl?: string;
};

function isAdminCodeValid(value: unknown) {
  return String(value ?? '').trim() === adminCode;
}

export async function getAdminOrders(request: Request, response: Response) {
  if (!isAdminCodeValid(request.query.adminCode)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  try {
    const result = await pool.query<AdminOrderItemRow>(`
      SELECT
        o.id AS "orderId",
        u.phone_number AS "phoneNumber",
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
      ORDER BY o.created_at DESC, oi.id ASC
    `);

    const orders = result.rows.reduce<
      Array<{
        orderId: number;
        phoneNumber: string;
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
          phoneNumber: row.phoneNumber,
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
    response.status(500).json({ message: '관리자 주문 내역을 불러오지 못했습니다.' });
  }
}

export async function deleteAdminOrder(request: Request, response: Response) {
  if (!isAdminCodeValid(request.body?.adminCode)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  const orderId = Number(request.params.orderId);

  if (!Number.isInteger(orderId)) {
    response.status(400).json({ message: '주문 번호가 올바르지 않습니다.' });
    return;
  }

  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [orderId]);

    if (result.rowCount === 0) {
      response.status(404).json({ message: '삭제할 주문을 찾을 수 없습니다.' });
      return;
    }

    response.json({ orderId, message: '주문이 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '주문을 삭제하지 못했습니다.' });
  }
}

export async function deleteAllAdminOrders(request: Request, response: Response) {
  if (!isAdminCodeValid(request.body?.adminCode)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  try {
    const result = await pool.query('DELETE FROM orders RETURNING id');
    response.json({ deletedCount: result.rowCount, message: '전체 주문이 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '전체 주문을 삭제하지 못했습니다.' });
  }
}

export async function createAdminMenu(request: Request, response: Response) {
  const { adminCode: code, name, description, category, price, imageUrl } = request.body as CreateMenuBody;

  if (!isAdminCodeValid(code)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    response.status(400).json({ message: '메뉴 이름, 설명, 카테고리를 입력해주세요.' });
    return;
  }

  const menuPrice = Number(price);

  if (!Number.isInteger(menuPrice) || menuPrice < 0) {
    response.status(400).json({ message: '가격은 0 이상의 정수여야 합니다.' });
    return;
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO menus (name, description, category, price, image_url, is_available)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING
          id,
          name,
          description,
          category,
          price,
          image_url AS "imageUrl",
          is_available AS "isAvailable"
      `,
      [name.trim(), description.trim(), category.trim(), menuPrice, imageUrl?.trim() || null]
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '메뉴를 추가하지 못했습니다.' });
  }
}

export async function updateAdminMenu(request: Request, response: Response) {
  const { adminCode: code, name, description, category, price, imageUrl } = request.body as CreateMenuBody;

  if (!isAdminCodeValid(code)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  const menuId = Number(request.params.menuId);

  if (!Number.isInteger(menuId)) {
    response.status(400).json({ message: '메뉴 ID가 올바르지 않습니다.' });
    return;
  }

  if (!name?.trim() || !description?.trim() || !category?.trim()) {
    response.status(400).json({ message: '메뉴 이름, 설명, 카테고리를 입력해주세요.' });
    return;
  }

  const menuPrice = Number(price);

  if (!Number.isInteger(menuPrice) || menuPrice < 0) {
    response.status(400).json({ message: '가격은 0 이상의 정수여야 합니다.' });
    return;
  }

  try {
    const result = await pool.query(
      `
        UPDATE menus
        SET
          name = $1,
          description = $2,
          category = $3,
          price = $4,
          image_url = $5
        WHERE id = $6
        RETURNING
          id,
          name,
          description,
          category,
          price,
          image_url AS "imageUrl",
          is_available AS "isAvailable"
      `,
      [name.trim(), description.trim(), category.trim(), menuPrice, imageUrl?.trim() || null, menuId]
    );

    if (result.rowCount === 0) {
      response.status(404).json({ message: '수정할 메뉴를 찾을 수 없습니다.' });
      return;
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '메뉴를 수정하지 못했습니다.' });
  }
}

export async function hideAdminMenu(request: Request, response: Response) {
  if (!isAdminCodeValid(request.body?.adminCode)) {
    response.status(401).json({ message: '관리자 코드가 올바르지 않습니다.' });
    return;
  }

  const menuId = Number(request.params.menuId);

  if (!Number.isInteger(menuId)) {
    response.status(400).json({ message: '메뉴 ID가 올바르지 않습니다.' });
    return;
  }

  try {
    const result = await pool.query(
      'UPDATE menus SET is_available = false WHERE id = $1 RETURNING id',
      [menuId]
    );

    if (result.rowCount === 0) {
      response.status(404).json({ message: '숨길 메뉴를 찾을 수 없습니다.' });
      return;
    }

    response.json({ menuId, message: '메뉴가 숨김 처리되었습니다.' });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '메뉴를 숨기지 못했습니다.' });
  }
}
