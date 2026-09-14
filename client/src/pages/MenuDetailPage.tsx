import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchMenu } from '../api/menuApi';
import { CartSidebar } from '../components/CartSidebar';
import { useCart } from '../context/CartContext';
import type { DrinkSize, Temperature } from '../types/cart';
import type { Menu } from '../types/menu';

const largeSizeExtraPrice = 500;

export function MenuDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [temperature, setTemperature] = useState<Temperature>('ICE');
  const [size, setSize] = useState<DrinkSize>('REGULAR');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadMenu() {
      if (!id) {
        setErrorMessage('메뉴 ID가 없습니다.');
        setIsLoading(false);
        return;
      }

      try {
        const menuDetail = await fetchMenu(id);
        setMenu(menuDetail);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadMenu();
  }, [id]);

  const unitPrice = useMemo(() => {
    if (!menu) {
      return 0;
    }

    return menu.price + (size === 'LARGE' ? largeSizeExtraPrice : 0);
  }, [menu, size]);

  const totalPrice = unitPrice * quantity;

  function handleAddCart() {
    if (!menu) {
      return;
    }

    addItem({
      menuId: menu.id,
      menuName: menu.name,
      temperature,
      size,
      quantity,
      unitPrice
    });
  }

  if (isLoading) {
    return (
      <main className="page">
        <p className="notice">메뉴 정보를 불러오는 중입니다.</p>
      </main>
    );
  }

  if (errorMessage || !menu) {
    return (
      <main className="page">
        <p className="notice notice--error">{errorMessage || '메뉴를 찾을 수 없습니다.'}</p>
        <Link className="text-link" to="/">
          메뉴로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <Link className="text-link" to="/">
        메뉴로 돌아가기
      </Link>

      <div className="menu-shell">
        <section className="detail-layout">
          <div className="detail-image">
            {menu.imageUrl ? <img src={menu.imageUrl} alt={menu.name} /> : <span>Drink</span>}
          </div>

          <div className="detail-panel">
            <p className="menu-card__category">{menu.category}</p>
            <h1>{menu.name}</h1>
            <p>{menu.description}</p>
            <strong className="base-price">기본 가격 {menu.price.toLocaleString()}원</strong>

            <div className="option-group">
              <h2>온도</h2>
              <div className="segmented-control">
                <button
                  className={temperature === 'HOT' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setTemperature('HOT')}
                >
                  HOT
                </button>
                <button
                  className={temperature === 'ICE' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setTemperature('ICE')}
                >
                  ICE
                </button>
              </div>
            </div>

            <div className="option-group">
              <h2>사이즈</h2>
              <div className="segmented-control">
                <button
                  className={size === 'REGULAR' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setSize('REGULAR')}
                >
                  Regular
                </button>
                <button
                  className={size === 'LARGE' ? 'is-selected' : ''}
                  type="button"
                  onClick={() => setSize('LARGE')}
                >
                  Large +{largeSizeExtraPrice.toLocaleString()}원
                </button>
              </div>
            </div>

            <div className="option-group">
              <h2>수량</h2>
              <div className="quantity-control">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
                  -
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => value + 1)}>
                  +
                </button>
              </div>
            </div>

            <div className="order-summary">
              <span>총 금액</span>
              <strong>{totalPrice.toLocaleString()}원</strong>
            </div>

            <button className="primary-button" type="button" onClick={handleAddCart}>
              장바구니 담기
            </button>
          </div>
        </section>

        <CartSidebar />
      </div>
    </main>
  );
}
