export type MenuOption = {
  id: string;
  label: string;
  priceDelta: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  options: MenuOption[];
};

export type Menu = {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string | null;
  optionGroups: MenuOptionGroup[];
  isAvailable: boolean;
};
