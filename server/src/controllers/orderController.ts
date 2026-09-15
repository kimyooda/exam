import type { Request, Response } from 'express';
import { pool } from '../db/pool.js';
import { groupOrderRows, type OrderItemJoinRow } from '../utils/orderMapper.js';

type CreateOrderItemBody = {
  menuId: number;
  selectedOptions?: SelectedOptionBody[];
  quantity: number;
};

type CreateOrderBody = {
  phoneNumber?: string;
  items?: CreateOrderItemBody[];
  totalPrice?: number;
  orderType?: 'user' | 'admin';
};

type MenuPriceRow = {
  id: number;
  name: string;
  price: number;
  optionGroups: MenuOptionGroup[];
};

type MenuOption = {
  id: string;
  label: string;
  priceDelta: number;
};

type MenuOptionGroup = {
  id: string;
  name: string;
  options: MenuOption[];
};

type SelectedOptionBody = {
  groupId: string;
  optionId: string;
};

type SelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
};

type CalculatedOrderItem = {
  menuId: number;
  menuName: string;
  temperature: string;
  size: string;
  selectedOptions: SelectedOption[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

function isValidOrderItem(item: CreateOrderItemBody) {
  return (
    Number.isInteger(item.menuId) &&
    Array.isArray(item.selectedOptions) &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function resolveSelectedOptions(menu: MenuPriceRow, selectedOptions: SelectedOptionBody[]) {
  return menu.optionGroups.map<SelectedOption>((group) => {
    const selectedOptionId = selectedOptions.find((option) => option.groupId === group.id)?.optionId;
    const selectedOption = group.options.find((option) => option.id === selectedOptionId);

    if (!selectedOption) {
      throw new Error('주문 옵션 형식이 올바르지 않습니다.');
    }

    return {
      groupId: group.id,
      groupName: group.name,
      optionId: selectedOption.id,
      optionLabel: selectedOption.label,
      priceDelta: selectedOption.priceDelta
    };
  });
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

  const client = await pool.connect();

  try {
    const menuIds = [...new Set(items.map((item) => item.menuId))];
    const menuResult = await client.query<MenuPriceRow>(
      `
        SELECT id, name, price, option_groups AS "optionGroups"
        FROM menus
        WHERE id = ANY($1::int[]) AND is_available = true
      `,
      [menuIds]
    );
    const menuMap = new Map(menuResult.rows.map((menu) => [menu.id, menu]));

    if (menuMap.size !== menuIds.length) {
      response.status(400).json({ message: '주문할 수 없는 메뉴가 포함되어 있습니다.' });
      return;
    }

    const calculatedItems: CalculatedOrderItem[] = items.map((item) => {
      const menu = menuMap.get(item.menuId);

      if (!menu) {
        throw new Error('메뉴 정보를 계산하지 못했습니다.');
      }

      const selectedOptions = resolveSelectedOptions(menu, item.selectedOptions ?? []);
      const optionPrice = selectedOptions.reduce((sum, option) => sum + option.priceDelta, 0);
      const temperatureOption =
        selectedOptions.find((option) => option.groupId === 'temperature') ?? selectedOptions[0];
      const sizeOption = selectedOptions.find((option) => option.groupId === 'size') ?? selectedOptions[1];

      return {
        menuId: item.menuId,
        menuName: menu.name,
        temperature: temperatureOption?.optionLabel ?? '-',
        size: sizeOption?.optionLabel ?? '-',
        selectedOptions,
        quantity: item.quantity,
        unitPrice: menu.price + optionPrice,
        totalPrice: (menu.price + optionPrice) * item.quantity
      };
    });
    const calculatedTotalPrice = calculatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    if (totalPrice !== calculatedTotalPrice) {
      response.status(400).json({ message: '총 주문 금액이 올바르지 않습니다.' });
      return;
    }

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

    for (const item of calculatedItems) {
      if (orderType === 'admin') {
        await client.query(
          `
            INSERT INTO admin_order_items (
              admin_order_id,
              menu_id,
              menu_name,
              temperature,
              size,
              selected_options,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            order.id,
            item.menuId,
            item.menuName,
            item.temperature,
            item.size,
            JSON.stringify(item.selectedOptions),
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
              selected_options,
              quantity,
              unit_price,
              total_price
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            order.id,
            item.menuId,
            item.menuName,
            item.temperature,
            item.size,
            JSON.stringify(item.selectedOptions),
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
    const result = await pool.query<OrderItemJoinRow>(
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
          oi.selected_options AS "selectedOptions",
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

    const orders = groupOrderRows(result.rows);

    response.json(orders);
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: '주문 내역을 불러오지 못했습니다.' });
  }
}
