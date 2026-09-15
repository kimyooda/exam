import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchMenu } from '../api/menuApi';
import { CartSidebar } from '../components/CartSidebar';
import { useCart } from '../context/CartContext';
import type { Menu, MenuOptionGroup } from '../types/menu';

const defaultOptionGroups: MenuOptionGroup[] = [
  {
    id: 'temperature',
    name: '온도',
    options: [
      { id: 'hot', label: 'HOT', priceDelta: 0 },
      { id: 'ice', label: 'ICE', priceDelta: 0 }
    ]
  },
  {
    id: 'size',
    name: '사이즈',
    options: [
      { id: 'regular', label: 'Regular', priceDelta: 0 },
      { id: 'large', label: 'Large', priceDelta: 500 }
    ]
  }
];

export function MenuDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [menu, setMenu] = useState<Menu | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<Record<string, string>>({});
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
        const optionGroups =
          menuDetail.optionGroups.length > 0 ? menuDetail.optionGroups : defaultOptionGroups;

        setMenu(menuDetail);
        setSelectedOptionIds(
          Object.fromEntries(
            optionGroups.map((group) => [group.id, group.options[0]?.id ?? ''])
          )
        );
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

    const optionGroups = menu.optionGroups.length > 0 ? menu.optionGroups : defaultOptionGroups;
    const optionPrice = optionGroups.reduce((sum, group) => {
      const selectedOption = group.options.find((option) => option.id === selectedOptionIds[group.id]);

      return sum + (selectedOption?.priceDelta ?? 0);
    }, 0);

    return menu.price + optionPrice;
  }, [menu, selectedOptionIds]);

  const totalPrice = unitPrice * quantity;

  function handleAddCart() {
    if (!menu) {
      return;
    }

    const optionGroups = menu.optionGroups.length > 0 ? menu.optionGroups : defaultOptionGroups;
    const selectedOptions = optionGroups.map((group) => {
      const selectedOption =
        group.options.find((option) => option.id === selectedOptionIds[group.id]) ?? group.options[0];

      return {
        groupId: group.id,
        groupName: group.name,
        optionId: selectedOption.id,
        optionLabel: selectedOption.label,
        priceDelta: selectedOption.priceDelta
      };
    });

    addItem({
      menuId: menu.id,
      menuName: menu.name,
      selectedOptions,
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

  const optionGroups = menu.optionGroups.length > 0 ? menu.optionGroups : defaultOptionGroups;

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

            {optionGroups.map((group) => (
              <div className="option-group" key={group.id}>
                <h2>{group.name}</h2>
                <div className="segmented-control">
                  {group.options.map((option) => (
                    <button
                      className={selectedOptionIds[group.id] === option.id ? 'is-selected' : ''}
                      type="button"
                      key={option.id}
                      onClick={() =>
                        setSelectedOptionIds((currentOptions) => ({
                          ...currentOptions,
                          [group.id]: option.id
                        }))
                      }
                    >
                      {option.label}
                      {option.priceDelta > 0 && ` +${option.priceDelta.toLocaleString()}원`}
                    </button>
                  ))}
                </div>
              </div>
            ))}

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
