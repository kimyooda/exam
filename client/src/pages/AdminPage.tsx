import { FormEvent, useEffect, useState } from 'react';
import { createAdminMenu, fetchMenus, hideAdminMenu, updateAdminMenu } from '../api/menuApi';
import {
  deleteAdminOrder,
  deleteAllAdminOrders,
  fetchAdminOrders,
  type OrderHistory
} from '../api/orderApi';
import { useAuth } from '../context/AuthContext';
import type { Menu, MenuOptionGroup } from '../types/menu';

const menuCategoryOptions = [
  { value: 'coffee', label: '커피' },
  { value: 'non-coffee', label: '논커피' },
  { value: 'ade', label: '에이드' },
  { value: 'tea', label: '티' }
];

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

const defaultMenuOptionGroups: MenuOptionGroup[] = [];

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

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getMonthDays(value: Date) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

  for (let day = 1; day <= lastDate; day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
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

export function AdminPage() {
  const today = new Date();
  const { identifier, role } = useAuth();
  const [adminCode, setAdminCode] = useState(role === 'admin' ? identifier : '');
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAddingMenu, setIsAddingMenu] = useState(false);
  const [isDailySalesOpen, setIsDailySalesOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrl: '',
    optionGroups: defaultMenuOptionGroups
  });
  const selectedDateKey = getDateKey(selectedDate);
  const todayKey = getDateKey(today);
  const monthDays = getMonthDays(visibleMonth);
  const dailyOrders = orders.filter((order) => getDateKey(new Date(order.createdAt)) === selectedDateKey);
  const dailySalesSummary = dailyOrders.reduce(
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
      const optionGroups = menuForm.optionGroups
        .map((group) => ({
          ...group,
          name: group.name.trim(),
          options: group.options
            .map((option) => ({
              ...option,
              label: option.label.trim(),
              priceDelta: Number(option.priceDelta)
            }))
            .filter((option) => option.label)
        }))
        .filter((group) => group.name && group.options.length > 0);
      const menuPayload = {
        adminCode: adminCode.trim(),
        name: menuForm.name,
        description: menuForm.description,
        category: menuForm.category,
        price: Number(menuForm.price),
        imageUrl: menuForm.imageUrl,
        optionGroups
      };

      if (editingMenuId) {
        await updateAdminMenu(editingMenuId, menuPayload);
      } else {
        await createAdminMenu(menuPayload);
      }

      setMenuForm({
        name: '',
        description: '',
        category: '',
        price: '',
        imageUrl: '',
        optionGroups: defaultMenuOptionGroups
      });
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
      imageUrl: menu.imageUrl ?? '',
      optionGroups: menu.optionGroups.length > 0 ? menu.optionGroups : defaultMenuOptionGroups
    });
  }

  function handleCloseMenuForm() {
    setEditingMenuId(null);
    setIsAddingMenu(false);
    setMenuForm({
      name: '',
      description: '',
      category: '',
      price: '',
      imageUrl: '',
      optionGroups: defaultMenuOptionGroups
    });
  }

  function handleAddOptionGroup() {
    setMenuForm((currentForm) => ({
      ...currentForm,
      optionGroups: [
        ...currentForm.optionGroups,
        {
          id: crypto.randomUUID(),
          name: '',
          options: [{ id: crypto.randomUUID(), label: '', priceDelta: 0 }]
        }
      ]
    }));
  }

  function handleUpdateOptionGroup(groupId: string, name: string) {
    setMenuForm((currentForm) => ({
      ...currentForm,
      optionGroups: currentForm.optionGroups.map((group) =>
        group.id === groupId ? { ...group, name } : group
      )
    }));
  }

  function handleAddOption(groupId: string) {
    setMenuForm((currentForm) => ({
      ...currentForm,
      optionGroups: currentForm.optionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: [...group.options, { id: crypto.randomUUID(), label: '', priceDelta: 0 }]
            }
          : group
      )
    }));
  }

  function handleUpdateOption(
    groupId: string,
    optionId: string,
    field: 'label' | 'priceDelta',
    value: string
  ) {
    setMenuForm((currentForm) => ({
      ...currentForm,
      optionGroups: currentForm.optionGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId
                  ? {
                      ...option,
                      [field]: field === 'priceDelta' ? Number(value) : value
                    }
                  : option
              )
            }
          : group
      )
    }));
  }

  function handleMonthChange(monthOffset: number) {
    setVisibleMonth(
      (currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, 1)
    );
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
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
                  <select
                    aria-label="카테고리"
                    value={menuForm.category}
                    onChange={(event) => setMenuForm({ ...menuForm, category: event.target.value })}
                  >
                    <option value="">카테고리 선택</option>
                    {menuCategoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
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
                  <section className="admin-option-editor">
                    <div className="admin-option-editor__header">
                      <strong>옵션</strong>
                      <button className="secondary-button" type="button" onClick={handleAddOptionGroup}>
                        + 옵션 그룹 추가
                      </button>
                    </div>

                    {menuForm.optionGroups.map((group) => (
                      <div className="admin-option-group" key={group.id}>
                        <input
                          placeholder="옵션 이름 예: 온도, 당도"
                          value={group.name}
                          onChange={(event) => handleUpdateOptionGroup(group.id, event.target.value)}
                        />
                        {group.options.map((option) => (
                          <div className="admin-option-row" key={option.id}>
                            <input
                              placeholder="선택지 예: ICE, 달게"
                              value={option.label}
                              onChange={(event) =>
                                handleUpdateOption(group.id, option.id, 'label', event.target.value)
                              }
                            />
                            <input
                              aria-label="추가 금액"
                              type="number"
                              value={option.priceDelta}
                              onChange={(event) =>
                                handleUpdateOption(
                                  group.id,
                                  option.id,
                                  'priceDelta',
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        ))}
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => handleAddOption(group.id)}
                        >
                          + 선택지 추가
                        </button>
                      </div>
                    ))}
                  </section>
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
          {isUnlocked && (
            <section className="admin-calendar">
              <header>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleMonthChange(-1)}
                >
                  이전
                </button>
                <strong>
                  {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
                </strong>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => handleMonthChange(1)}
                >
                  다음
                </button>
              </header>

              <div className="admin-calendar__weekdays">
                {weekdays.map((weekday) => (
                  <span key={weekday}>{weekday}</span>
                ))}
              </div>

              <div className="admin-calendar__days">
                {monthDays.map((date, index) =>
                  date ? (
                    <button
                      className={[
                        getDateKey(date) === selectedDateKey ? 'is-selected' : '',
                        getDateKey(date) === todayKey ? 'is-today' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      type="button"
                      key={getDateKey(date)}
                      onClick={() => handleSelectDate(date)}
                    >
                      {date.getDate()}
                    </button>
                  ) : (
                    <span key={`blank-${index}`} />
                  )
                )}
              </div>
            </section>
          )}

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

          {isUnlocked && orders.length > 0 && (
            <section className="daily-sales-panel">
              <button
                className="daily-sales-toggle"
                type="button"
                onClick={() => setIsDailySalesOpen((isOpen) => !isOpen)}
              >
                <span>{isDailySalesOpen ? '당일 판매내역 접기' : '당일 판매내역 펼치기'}</span>
                <strong>{isDailySalesOpen ? '-' : '+'}</strong>
              </button>

              <div className="sales-summary">
                <div>
                  <span>선택 날짜</span>
                  <strong>{selectedDateKey}</strong>
                </div>
                <div>
                  <span>판매 주문</span>
                  <strong>{dailySalesSummary.orderCount}건</strong>
                </div>
                <div>
                  <span>판매 수량</span>
                  <strong>{dailySalesSummary.itemQuantity}잔</strong>
                </div>
                <div>
                  <span>총 판매 금액</span>
                  <strong>{dailySalesSummary.totalSales.toLocaleString()}원</strong>
                </div>
              </div>

              {isDailySalesOpen && (
                <div className="daily-sales-list">
                  {dailyOrders.length === 0 ? (
                    <section className="empty-cart">
                      <h2>선택한 날짜의 판매내역이 없습니다</h2>
                      <p>달력에서 다른 날짜를 선택해보세요.</p>
                    </section>
                  ) : (
                    dailyOrders.map((order) => (
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

                        <button
                          className="danger-button"
                          type="button"
                          onClick={() => handleDelete(order.orderId)}
                        >
                          주문 삭제
                        </button>
                      </article>
                    ))
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
