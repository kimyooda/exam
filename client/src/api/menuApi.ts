import type { Menu } from '../types/menu';

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
