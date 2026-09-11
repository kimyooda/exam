import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMenus } from '../api/menuApi';
import { MenuCard } from '../components/MenuCard';
import { useCart } from '../context/CartContext';
import type { Menu } from '../types/menu';

export function MenuPage() {
  const { totalQuantity } = useCart();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadMenus() {
      try {
        const menuList = await fetchMenus();
        setMenus(menuList);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMenus();
  }, []);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <p>Drink Kiosk</p>
          <h1>메뉴를 선택해주세요</h1>
        </div>
        <Link to="/cart" className="cart-button">
          장바구니 {totalQuantity > 0 ? totalQuantity : ''}
        </Link>
      </header>

      {isLoading && <p className="notice">메뉴를 불러오는 중입니다.</p>}
      {errorMessage && <p className="notice notice--error">{errorMessage}</p>}

      {!isLoading && !errorMessage && (
        <section className="menu-grid" aria-label="음료 메뉴">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} />
          ))}
        </section>
      )}
    </main>
  );
}
