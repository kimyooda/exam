import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartSidebar() {
  const { items, totalPrice, removeItem } = useCart();

  return (
    <aside className="cart-sidebar">
      <header>
        <div>
          <p>Cart</p>
          <h2>담긴 음료</h2>
        </div>
        <strong>{totalPrice.toLocaleString()}원</strong>
      </header>

      {items.length === 0 ? (
        <p className="cart-sidebar__empty">담긴 음료가 없습니다.</p>
      ) : (
        <>
          <div className="cart-sidebar__list">
            {items.map((item) => (
              <article className="cart-sidebar__item" key={item.id}>
                <div>
                  <strong>{item.menuName}</strong>
                  <p>
                    {item.temperature} / {item.size} / {item.quantity}잔
                  </p>
                </div>
                <div>
                  <span>{item.totalPrice.toLocaleString()}원</span>
                  <button type="button" onClick={() => removeItem(item.id)}>
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>

          <Link className="primary-button" to="/cart">
            장바구니 확인하기
          </Link>
        </>
      )}
    </aside>
  );
}
