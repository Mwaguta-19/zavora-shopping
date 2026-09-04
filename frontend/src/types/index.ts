export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar: string | null;
  is_verified: boolean;
  is_staff: boolean;      
  is_superuser: boolean;
  created_at: string;
  
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  parent: number | null;
  children: Category[];
}

export interface ProductImage {
  id: number;
  image: string;
  alt_text: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  discount_price: string | null;
  effective_price: string;
  discount_percentage: number;
  in_stock: boolean;
  stock: number;
  brand: string;
  sku: string;
  category: Category;
  images: ProductImage[];
  reviews: any[];
  avg_rating: number | null;
  review_count: number;
  is_featured: boolean;
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total_items: number;
  subtotal: string;
}

export interface Address {
  id: number;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  is_default: boolean;
}

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  shipping_full_name: string;
  shipping_address_line1: string;
  shipping_city: string;
  shipping_country: string;
  subtotal: string;
  shipping_cost: string;
  total: string;
  items: OrderItem[];
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}