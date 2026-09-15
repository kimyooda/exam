import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrdersByPhoneNumber, type OrderHistory } from '../api/orderApi';
import { useAuth } from '../context/AuthContext';

function formatOptions(options: Array<{ groupName: string; optionLabel: string }>) {
  return options.map((option) => `${option.groupName}: ${option.optionLabel}`).join(' / ');
}

function formatOrderItemOptions(item: {
  selectedOptions: Array<{ groupName: string; optionLabel: string }>;
  temperature: string;
  size: string;
}) {
  return item.selectedOptions.length > 0 ? formatOptions(item.selectedOptions) : `${item.temperature} / ${item.size}`;
}

function formatOrderStatus(status: string) {
  if (status === 'completed') {
    return '주문 완료';
  }

  return status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function OrderHistoryPage() {
  const { identifier, role } = useAuth();
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      if (role !== 'user') {
        return;
      }

      try {
        setIsLoading(true);
        setMessage('');
        const orderList = await fetchOrdersByPhoneNumber(identifier);
        setOrders(orderList);
      } catch (error) {
        setOrders([]);
        setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [identifier, role]);

  if (role === 'guest') {
    return (
      <main className="page">
        <header className="page-title">
          <p>Orders</p>
          <h1>주문 내역 조회</h1>
        </header>

        <section className="empty-cart">
          <h2>로그인이 필요합니다</h2>
          <p>전화번호로 로그인하면 주문 내역을 확인할 수 있습니다.</p>
          <Link className="primary-button" to="/login">
            로그인하기
          </Link>
        </section>
      </main>
    );
  }

  if (role === 'admin') {
    return (
      <main className="page">
        <header className="page-title">
          <p>Orders</p>
          <h1>주문 내역 조회</h1>
        </header>

        <section className="empty-cart">
          <h2>관리자 계정입니다</h2>
          <p>전체 주문 내역과 메뉴 관리는 관리자 페이지에서 확인할 수 있습니다.</p>
          <Link className="primary-button" to="/admin">
            관리자 페이지로
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-title">
        <p>Orders</p>
        <h1>주문 내역 조회</h1>
      </header>

      <section className="history-results">
        <section className="order-owner-panel">
          <span>로그인 전화번호</span>
          <strong>{identifier}</strong>
        </section>

        {isLoading && <p className="notice">주문 내역을 불러오는 중입니다.</p>}
        {message && <p className="notice notice--error">{message}</p>}

        <div className="history-results">
          {!isLoading && !message && orders.length === 0 && (
            <section className="empty-cart">
              <h2>주문 내역이 없습니다</h2>
              <p>현재 로그인한 전화번호로 저장된 주문을 찾지 못했습니다.</p>
            </section>
          )}

          {orders.map((order) => (
            <article className="history-card" key={order.orderId}>
              <header>
                <div>
                  <p>주문 번호 #{order.orderId}</p>
                  <h2>{formatOrderStatus(order.status)}</h2>
                </div>
                <span>{formatDate(order.createdAt)}</span>
              </header>

              <div className="checkout-items">
                {order.items.map((item) => (
                  <div className="checkout-item" key={item.itemId}>
                    <div>
                      <strong>{item.menuName}</strong>
                      <p>
                        {formatOrderItemOptions(item)} / {item.quantity}잔
                      </p>
                    </div>
                    <span>{item.totalPrice.toLocaleString()}원</span>
                  </div>
                ))}
              </div>

              <div className="checkout-total">
                <span>총 금액</span>
                <strong>{order.totalPrice.toLocaleString()}원</strong>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
