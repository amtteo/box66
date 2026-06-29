/** Typy zodpovedajúce Ktor Order API (shared/domain). */

export type ApiOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type ApiOrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";

export type ApiPaymentStatus =
  | "UNPAID"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type ApiPaymentMethod = "CARD" | "CASH" | "ONLINE";

export type ApiOrderItemChoice = {
  id: string;
  groupId?: string | null;
  groupLabel: string;
  nameSnapshot: string;
};

export type ApiOrderItem = {
  id: string;
  menuItemId?: string | null;
  productId?: string | null;
  nameSnapshot: string;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  note?: string | null;
  choices?: ApiOrderItemChoice[];
};

export type ApiOrder = {
  id: string;
  orderNumber: number;
  storeId: string;
  type: ApiOrderType;
  status: ApiOrderStatus;
  paymentStatus: ApiPaymentStatus;
  paymentMethod?: ApiPaymentMethod | null;
  subtotal: string;
  taxTotal: string;
  discountTotal: string;
  deliveryFee: string;
  total: string;
  currency: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  deliveryAddress?: string | null;
  placedAt: string;
  items: ApiOrderItem[];
};

export type ApiOrderListResponse = {
  storeId: string;
  status?: ApiOrderStatus | null;
  orders: ApiOrder[];
};

export type ApiErrorResponse = {
  error: string;
  message: string;
};

export type ApiMenuChoiceOption = {
  productId: string;
  menuItemId?: string | null;
  name: string;
  price?: string | null;
  isAvailable: boolean;
};

export type ApiMenuChoiceGroup = {
  id: string;
  label: string;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: ApiMenuChoiceOption[];
};

export type ApiMenuItem = {
  id: string;
  productId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  categoryId: string;
  categoryName: string;
  price: string;
  isAvailable: boolean;
  sortOrder: number;
  choiceGroups?: ApiMenuChoiceGroup[];
};

export type ApiMenuResponse = {
  storeId: string;
  storeName: string;
  currency: string;
  items: ApiMenuItem[];
};

export type ApiOrderItemChoiceRequest = {
  groupId?: string;
  productId?: string;
  menuItemId?: string;
  groupLabel: string;
  nameSnapshot: string;
};

export type ApiOrderItemRequest = {
  menuItemId: string;
  quantity: number;
  note?: string;
  loyaltyRewardId?: string;
  choices?: ApiOrderItemChoiceRequest[];
};

export type ApiCreateOrderRequest = {
  type: ApiOrderType;
  customerId?: string;
  paymentMethod?: ApiPaymentMethod;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  note?: string;
  deliveryAddress?: string;
  deliveryDistanceKm?: string;
  deliveryFee?: string;
  items: ApiOrderItemRequest[];
};
