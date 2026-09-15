import type { Menu, MenuOptionGroup } from '../types/menu';

export async function fetchMenus(): Promise<Menu[]> {
  const response = await fetch('/api/menus');

  if (!response.ok) {
    throw new Error('메뉴 목록을 불러오지 못했습니다.');
  }

  return response.json();
}

export async function fetchMenu(menuId: string): Promise<Menu> {
  const response = await fetch(`/api/menus/${menuId}`);

  if (!response.ok) {
    throw new Error('메뉴 정보를 불러오지 못했습니다.');
  }

  return response.json();
}

type CreateAdminMenuRequest = {
  adminCode: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  optionGroups: MenuOptionGroup[];
};

export async function createAdminMenu(menu: CreateAdminMenuRequest): Promise<Menu> {
  const response = await fetch('/api/admin/menus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menu)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '메뉴를 추가하지 못했습니다.');
  }

  return data;
}

export async function updateAdminMenu(
  menuId: number,
  menu: CreateAdminMenuRequest
): Promise<Menu> {
  const response = await fetch(`/api/admin/menus/${menuId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(menu)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '메뉴를 수정하지 못했습니다.');
  }

  return data;
}

export async function hideAdminMenu(menuId: number, adminCode: string) {
  const response = await fetch(`/api/admin/menus/${menuId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ adminCode })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? '메뉴를 숨기지 못했습니다.');
  }

  return data;
}
