import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const navigate = useNavigate();
  const { items, totalPrice, removeItem, clearCart } = useCart();

  return (
    <main className="page">
      <header className="page-title">
        <p>Cart</p>
        <h1>장바구니</h1>
      </header>

      <button className="secondary-button back-button" type="button" onClick={() => navigate(-1)}>
        뒤로가기
      </button>

      {items.length === 0 ? (
        <section className="empty-cart">
          <h2>장바구니가 비어 있습니다</h2>
          <p>메뉴를 선택하고 옵션을 고르면 여기에 담깁니다.</p>
          <Link className="primary-button" to="/">
            메뉴 보러가기
          </Link>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-list">
            {items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div>
                  <h2>{item.menuName}</h2>
                  <p>
                    {item.temperature} / {item.size} / {item.quantity}잔
                  </p>
                  <span>개당 {item.unitPrice.toLocaleString()}원</span>
                </div>
                <div className="cart-item__price">
                  <strong>{item.totalPrice.toLocaleString()}원</strong>
                  <button type="button" onClick={() => removeItem(item.id)}>
                    삭제
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>주문 요약</h2>
            <div>
              <span>총 금액</span>
              <strong>{totalPrice.toLocaleString()}원</strong>
            </div>
            <Link className="primary-button" to="/checkout">
              주문하기
            </Link>
            <button className="secondary-button" type="button" onClick={clearCart}>
              장바구니 비우기
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
