import type { CartItem } from '../types/cart';

type CreateOrderRequest = {
  phoneNumber: string;
  items: CartItem[];
  totalPrice: number;
  orderType?: 'user' | 'admin';
};

type CreateOrderResponse = {
  orderId: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  message: string;
};

export type OrderHistoryItem = {
  itemId: number;
  menuName: string;
  temperature: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type OrderHistory = {
  orderId: number;
  phoneNumber?: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  items: OrderHistoryItem[];
};

export async function createOrder({
  phoneNumber,
  items,
  totalPrice,
  orderType = 'user'
}: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber,
      orderType,
      totalPrice,
      items: items.map((item) => ({
        menuId: item.menuId,
        menuName: item.menuName,
        temperature: item.temperature,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '주문을 저장하지 못했습니다.');
  }

  return data;
}

export async function fetchAdminOrders(adminCode: string): Promise<OrderHistory[]> {
  const searchParams = new URLSearchParams({ adminCode });
  const response = await fetch(`/api/admin/orders?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '관리자 주문 내역을 불러오지 못했습니다.');
  }

  return data;
}

export async function deleteAdminOrder(orderId: number, adminCode: string) {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ adminCode })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '주문을 삭제하지 못했습니다.');
  }

  return data;
}

export async function deleteAllAdminOrders(adminCode: string) {
  const response = await fetch('/api/admin/orders', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ adminCode })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '전체 주문을 삭제하지 못했습니다.');
  }

  return data;
}

export async function fetchOrdersByPhoneNumber(phoneNumber: string): Promise<OrderHistory[]> {
  const searchParams = new URLSearchParams({ phoneNumber });
  const response = await fetch(`/api/orders?${searchParams.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '주문 내역을 불러오지 못했습니다.');
  }

  return data;
}
