import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function formatOptions(options: Array<{ groupName: string; optionLabel: string }>) {
  return options.map((option) => `${option.groupName}: ${option.optionLabel}`).join(' / ');
}

export function CartSidebar() {
  const { items, totalPrice, totalQuantity, removeItem } = useCart();

  return (
    <>
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
                      {formatOptions(item.selectedOptions)} / {item.quantity}잔
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

      {items.length > 0 && (
        <Link className="mobile-cart-bar" to="/cart">
          <span>장바구니 {totalQuantity}잔</span>
          <strong>{totalPrice.toLocaleString()}원</strong>
          <em>확인하기</em>
        </Link>
      )}
    </>
  );
}
