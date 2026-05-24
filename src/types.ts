export type UserRole = 'admin' | 'owner' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  restaurantId?: string; // for owners
  isFirstLogin: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  available: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  isFavorite?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  ownerUid: string;
  menu: MenuItem[];
  shippingFee: number;
  phone: string;
  description?: string;
  imageUrl?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'cooking' | 'delivering' | 'completed' | 'cancelled';
export type TrackingStatus = 'submitted' | 'accepted' | 'preparing' | 'on_the_way' | 'delivered';

export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  trackingStatus: TrackingStatus;
  createdAt: number;
}

export type AppTheme = 'white' | 'black' | 'blue' | 'gold' | 'orange';
