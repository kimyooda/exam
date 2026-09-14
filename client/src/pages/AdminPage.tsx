import { FormEvent, useEffect, useState } from 'react';
import { createAdminMenu, fetchMenus, hideAdminMenu, updateAdminMenu } from '../api/menuApi';
import {
  deleteAdminOrder,
  deleteAllAdminOrders,
  fetchAdminOrders,
  type OrderHistory
} from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import type { Menu } from '../types/menu';

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

export function AdminPage() {
  const { identifier, role } = useAuth();
  const [adminCode, setAdminCode] = useState(role === 'admin' ? identifier : '');
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrl: ''
  });
  const salesSummary = orders.reduce(
    (summary, order) => {
      const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        orderCount: summary.orderCount + 1,
        itemQuantity: summary.itemQuantity + quantity,
        totalSales: summary.totalSales + order.totalPrice
      };
    },
    { orderCount: 0, itemQuantity: 0, totalSales: 0 }
  );

  async function loadOrders(code: string) {
    const orderList = await fetchAdminOrders(code);
    setOrders(orderList);
  }

  async function loadMenus() {
    const menuList = await fetchMenus();
    setMenus(menuList);
  }

  async function loadAdminData(code: string) {
    await Promise.all([loadOrders(code), loadMenus()]);
    setIsUnlocked(true);
  }

  useEffect(() => {
    if (role !== 'admin' || isUnlocked) {
      return;
    }

    async function loadInitialAdminData() {
      try {
        setIsLoading(true);
        await loadAdminData(identifier);
      } catch (error) {
        setOrders([]);
        setIsUnlocked(false);
        setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialAdminData();
  }, [identifier, isUnlocked, role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!adminCode.trim()) {
      setMessage('관리자 코드를 입력해주세요.');
      return;
    }

    try {
      setIsLoading(true);
      await loadAdminData(adminCode.trim());
    } catch (error) {
      setOrders([]);
      setIsUnlocked(false);
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(orderId: number) {
    const shouldDelete = window.confirm(`주문 #${orderId}을 삭제할까요?`);

    if (!shouldDelete) {
      return;
    }

    try {
      setMessage('');
      await deleteAdminOrder(orderId, adminCode.trim());
      await loadOrders(adminCode.trim());
      setMessage(`주문 #${orderId}이 삭제되었습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  async function handleDeleteAllOrders() {
    const shouldDelete = window.confirm('전체 주문을 삭제할까요? 이 작업은 되돌릴 수 없습니다.');

    if (!shouldDelete) {
      return;
    }

    try {
      setMessage('');
      await deleteAllAdminOrders(adminCode.trim());
      await loadOrders(adminCode.trim());
      setMessage('전체 주문이 삭제되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  async function handleAddMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setMessage('');
      const menuPayload = {
        adminCode: adminCode.trim(),
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: Number(menuForm.price),
        imageUrl: menuForm.imageUrl
      };

      if (editingMenuId) {
        await updateAdminMenu(editingMenuId, menuPayload);
      } else {
        await createAdminMenu(menuPayload);
      }

      setMenuForm({ name: '', description: '', category: '', price: '', imageUrl: '' });
      setEditingMenuId(null);
      setIsAddingMenu(false);
      await loadMenus();
      setMessage(editingMenuId ? '메뉴가 수정되었습니다.' : '메뉴가 추가되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  function handleEditMenu(menu: Menu) {
    setEditingMenuId(menu.id);
    setIsAddingMenu(true);
    setMenuForm({
      name: menu.name,
      description: menu.description,
      category: menu.category,
      price: String(menu.price),
      imageUrl: menu.imageUrl ?? ''
    });
  }

  function handleCloseMenuForm() {
    setEditingMenuId(null);
    setIsAddingMenu(false);
    setMenuForm({ name: '', description: '', category: '', price: '', imageUrl: '' });
  }

  async function handleHideMenu(menuId: number) {
    const shouldHide = window.confirm('이 메뉴를 화면에서 숨길까요?');

    if (!shouldHide) {
      return;
    }

    try {
      setMessage('');
      await hideAdminMenu(menuId, adminCode.trim());
      await loadMenus();
      setMessage('메뉴가 숨김 처리되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  }

  return (
    <main className="page">
      <header className="page-title">
        <p>Admin</p>
        <h1>관리자 주문 관리</h1>
      </header>

      <section className="history-layout">
        <div className="admin-sidebar">
          {role !== 'admin' ? (
            <form className="checkout-form" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="adminCode">관리자 코드</label>
                <input
                  id="adminCode"
                  name="adminCode"
                  placeholder="관리자 코드를 입력하세요"
                  type="password"
                  value={adminCode}
                  onChange={(event) => setAdminCode(event.target.value)}
                />
                <p>학습용 임시 관리자 코드입니다. 현재 코드는 knda123입니다.</p>
              </div>

              <button className="primary-button" type="submit" disabled={isLoading}>
                {isLoading ? '확인 중...' : '관리자 주문 보기'}
              </button>

              {message && <p className="form-message">{message}</p>}
            </form>
          ) : (
            <section className="admin-session-panel">
              <span>관리자 로그인</span>
              <strong>{identifier}</strong>
              {message && <p className="form-message">{message}</p>}
            </section>
          )}

          {isUnlocked && (
            <section className="admin-section">
              <div className="admin-section__header">
                <div>
                  <p>Menu</p>
                  <h2>메뉴 관리</h2>
                </div>
                <button
                  className="primary-button admin-icon-button"
                  type="button"
                  onClick={() => {
                    if (isAddingMenu) {
                      handleCloseMenuForm();
                      return;
                    }
                    setIsAddingMenu(true);
                  }}
                  aria-label={isAddingMenu ? '메뉴 추가 닫기' : '메뉴 추가'}
                >
                  {isAddingMenu ? '-' : '+'}
                </button>
              </div>

              {isAddingMenu && (
                <form className="admin-menu-form" onSubmit={handleAddMenu}>
                  <strong>{editingMenuId ? '메뉴 수정' : '새 메뉴 추가'}</strong>
                  <input
                    placeholder="메뉴 이름"
                    value={menuForm.name}
                    onChange={(event) => setMenuForm({ ...menuForm, name: event.target.value })}
                  />
                  <input
                    placeholder="설명"
                    value={menuForm.description}
                    onChange={(event) =>
                      setMenuForm({ ...menuForm, description: event.target.value })
                    }
                  />
                  <input
                    placeholder="카테고리"
                    value={menuForm.category}
                    onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value })}
                  />
                  <input
                    placeholder="가격"
                    type="number"
                    value={menuForm.price}
                    onChange={(event) => setMenuForm({ ...menuForm, price: event.target.value })}
                  />
                  <input
                    placeholder="이미지 URL 선택"
                    value={menuForm.imageUrl}
                    onChange={(event) => setMenuForm({ ...menuForm, imageUrl: event.target.value })}
                  />
                  <button className="primary-button" type="submit">
                    {editingMenuId ? '수정 저장' : '메뉴 저장'}
                  </button>
                </form>
              )}

              <div className="admin-menu-list">
                {menus.map((menu) => (
                  <article className="admin-menu-item" key={menu.id}>
                    <div>
                      <strong>{menu.name}</strong>
                      <p>
                        {menu.category} / {menu.price.toLocaleString()}원
                      </p>
                    </div>
                    <div className="admin-menu-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleEditMenu(menu)}
                      >
                        수정
                      </button>
                      <button
                        className="danger-button"
                        type="button"
                        onClick={() => handleHideMenu(menu.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="history-results">
          {isUnlocked && orders.length > 0 && (
            <button className="danger-button" type="button" onClick={handleDeleteAllOrders}>
              전체 주문 삭제
            </button>
          )}

          {isUnlocked && orders.length === 0 && (
            <section className="empty-cart">
              <h2>주문 내역이 없습니다</h2>
              <p>아직 저장된 주문이 없습니다.</p>
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

              <div className="admin-order-meta">
                <span>전화번호</span>
                <strong>{order.phoneNumber}</strong>
              </div>

              <div className="checkout-items">
                {order.items.map((item) => (
                  <div className="checkout-item" key={item.itemId}>
                    <div>
                      <strong>{item.menuName}</strong>
                      <p>
                        {item.temperature} / {item.size} / {item.quantity}잔
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

              <button
                className="danger-button"
                type="button"
                onClick={() => handleDelete(order.orderId)}
              >
                주문 삭제
              </button>
            </article>
          ))}

          {isUnlocked && orders.length > 0 && (
            <section className="sales-summary">
              <div>
                <span>판매 주문</span>
                <strong>{salesSummary.orderCount}건</strong>
              </div>
              <div>
                <span>판매 수량</span>
                <strong>{salesSummary.itemQuantity}잔</strong>
              </div>
              <div>
                <span>총 판매 금액</span>
                <strong>{salesSummary.totalSales.toLocaleString()}원</strong>
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
