import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrder } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function formatOptions(options: Array<{ groupName: string; optionLabel: string }>) {
  return options.map((option) => `${option.groupName}: ${option.optionLabel}`).join(' / ');
}

type CompletedOrder = {
  orderId: number;
  ownerLabel: string;
  totalQuantity: number;
  totalPrice: number;
};

export function CheckoutPage() {
  const { identifier, role } = useAuth();
  const { items, totalPrice, totalQuantity, clearCart } = useCart();
  const [message, setMessage] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setCompletedOrder(null);

    if (items.length === 0) {
      setMessage('장바구니에 담긴 메뉴가 없습니다.');
      return;
    }

    if (role === 'guest') {
      setMessage('로그인한 뒤 주문할 수 있습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await createOrder({
        phoneNumber: identifier,
        items,
        totalPrice,
        orderType: role === 'admin' ? 'admin' : 'user'
      });

      setCompletedOrder({
        orderId: order.orderId,
        ownerLabel: role === 'admin' ? '관리자 주문' : identifier,
        totalQuantity,
        totalPrice
      });
      setMessage(order.message);
      clearCart();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="page-title">
        <p>Checkout</p>
        <h1>주문 확인</h1>
      </header>

      {items.length === 0 && !completedOrder ? (
        <section className="empty-cart">
          <h2>주문할 메뉴가 없습니다</h2>
          <p>메뉴를 장바구니에 담은 뒤 주문을 진행해주세요.</p>
          <Link className="primary-button" to="/">
            메뉴 보러가기
          </Link>
        </section>
      ) : role === 'guest' ? (
        <section className="empty-cart">
          <h2>로그인이 필요합니다</h2>
          <p>로그인 후 주문할 수 있습니다.</p>
          <Link className="primary-button" to="/login">
            로그인하기
          </Link>
        </section>
      ) : completedOrder ? (
        <section className="complete-panel">
          <div className="complete-badge">완료</div>
          <h2>주문이 완료되었습니다</h2>
          <p>주문 번호를 확인하고, 같은 전화번호로 주문 내역을 다시 조회할 수 있습니다.</p>

          <dl className="complete-details">
            <div>
              <dt>주문 번호</dt>
              <dd>#{completedOrder.orderId}</dd>
            </div>
            <div>
              <dt>주문 구분</dt>
              <dd>{completedOrder.ownerLabel}</dd>
            </div>
            <div>
              <dt>주문 수량</dt>
              <dd>{completedOrder.totalQuantity}잔</dd>
            </div>
            <div>
              <dt>총 금액</dt>
              <dd>{completedOrder.totalPrice.toLocaleString()}원</dd>
            </div>
          </dl>

          <div className="complete-actions">
            <Link className="primary-button" to="/orders">
              주문 내역 보기
            </Link>
            <Link className="secondary-button" to="/">
              메뉴로 돌아가기
            </Link>
          </div>
        </section>
      ) : (
        <form className="checkout-layout" onSubmit={handleSubmit}>
          <section className="checkout-form">
            <section className="order-owner-panel">
              <span>{role === 'admin' ? '주문 구분' : '주문 전화번호'}</span>
              <strong>{role === 'admin' ? '관리자 주문' : identifier}</strong>
            </section>
          </section>

          <section className="checkout-summary">
            <h2>주문 내용</h2>
            <div className="checkout-items">
              {items.map((item) => (
                <article className="checkout-item" key={item.id}>
                  <div>
                    <strong>{item.menuName}</strong>
                    <p>
                      {formatOptions(item.selectedOptions)} / {item.quantity}잔
                    </p>
                  </div>
                  <span>{item.totalPrice.toLocaleString()}원</span>
                </article>
              ))}
            </div>

            <div className="checkout-total">
              <span>총 {totalQuantity}잔</span>
              <strong>{totalPrice.toLocaleString()}원</strong>
            </div>

            <button className="primary-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '주문 저장 중...' : '주문 완료'}
            </button>

            {message && <p className="form-message">{message}</p>}
          </section>
        </form>
      )}
    </main>
  );
}
