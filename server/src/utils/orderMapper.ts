export type OrderItemJoinRow = {
  orderId: number;
  status: string;
  orderTotalPrice: number;
  createdAt: Date;
  itemId: number;
  menuName: string;
  temperature: string;
  size: string;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    optionId: string;
    optionLabel: string;
    priceDelta: number;
  }>;
  quantity: number;
  unitPrice: number;
  itemTotalPrice: number;
};

export type GroupedOrder<Row extends OrderItemJoinRow> = {
  orderId: number;
  status: string;
  totalPrice: number;
  createdAt: Date;
  items: Array<{
    itemId: number;
    menuName: string;
    temperature: string;
    size: string;
    selectedOptions: Array<{
      groupId: string;
      groupName: string;
      optionId: string;
      optionLabel: string;
      priceDelta: number;
    }>;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
} & Pick<Row, Exclude<keyof Row, keyof OrderItemJoinRow>>;

export function groupOrderRows<Row extends OrderItemJoinRow>(rows: Row[]): Array<GroupedOrder<Row>> {
  return rows.reduce<Array<GroupedOrder<Row>>>((orderList, row) => {
    let order = orderList.find((currentOrder) => currentOrder.orderId === row.orderId);

    if (!order) {
      const { orderTotalPrice, itemId, menuName, temperature, size, selectedOptions, quantity, unitPrice, itemTotalPrice, ...orderFields } =
        row;

      order = {
        ...orderFields,
        totalPrice: orderTotalPrice,
        items: []
      } as GroupedOrder<Row>;

      orderList.push(order);
    }

    order.items.push({
      itemId: row.itemId,
      menuName: row.menuName,
      temperature: row.temperature,
      size: row.size,
      selectedOptions: row.selectedOptions,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      totalPrice: row.itemTotalPrice
    });

    return orderList;
  }, []);
}
