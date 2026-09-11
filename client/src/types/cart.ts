export type Temperature = 'HOT' | 'ICE';

export type DrinkSize = 'REGULAR' | 'LARGE';

export type CartItem = {
  id: string;
  menuId: number;
  menuName: string;
  temperature: Temperature;
  size: DrinkSize;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type AddCartItemInput = Omit<CartItem, 'id' | 'totalPrice'>;
