export type SelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
};

export type CartItem = {
  id: string;
  menuId: number;
  menuName: string;
  selectedOptions: SelectedOption[];
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type AddCartItemInput = Omit<CartItem, 'id' | 'totalPrice'>;
