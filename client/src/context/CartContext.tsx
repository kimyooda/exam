import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AddCartItemInput, CartItem } from '../types/cart';

type CartContextValue = {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type CartProviderProps = {
  children: ReactNode;
};

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  function addItem(item: AddCartItemInput) {
    setItems((currentItems) => {
      const sameOptionItem = currentItems.find(
        (currentItem) =>
          currentItem.menuId === item.menuId &&
          currentItem.temperature === item.temperature &&
          currentItem.size === item.size &&
          currentItem.unitPrice === item.unitPrice
      );

      if (sameOptionItem) {
        return currentItems.map((currentItem) => {
          if (currentItem.id !== sameOptionItem.id) {
            return currentItem;
          }

          const nextQuantity = currentItem.quantity + item.quantity;

          return {
            ...currentItem,
            quantity: nextQuantity,
            totalPrice: currentItem.unitPrice * nextQuantity
          };
        });
      }

      return [
        ...currentItems,
        {
          ...item,
          id: crypto.randomUUID(),
          totalPrice: item.unitPrice * item.quantity
        }
      ];
    });
  }

  function removeItem(itemId: string) {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  function clearCart() {
    setItems([]);
  }

  const value = useMemo<CartContextValue>(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
      items,
      totalQuantity,
      totalPrice,
      addItem,
      removeItem,
      clearCart
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart는 CartProvider 안에서 사용해야 합니다.');
  }

  return context;
}
