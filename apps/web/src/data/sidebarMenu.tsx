import { Roles } from '@/enums/roles.enum';
import {
  Boxes,
  CreditCard,
  FolderTree,
  Heart,
  History,
  LayoutDashboard,
  Layers,
  List,
  ListChecks,
  Package,
  PackagePlus,
  Receipt,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Star,
  Store,
  Tags,
  TrendingUp,
  Truck,
  User,
  UserCircle,
  Users,
} from 'lucide-react';

export interface SideBarMenuDto {
  id: string;
  title: string;
  icon: any; // React component
  url: string;
  class?: string;
  /** Section heading the item is listed under; items without one go into a trailing unlabelled section. */
  group?: string;
  submenu?: SideBarSubMenuDto[];
  isActive?: boolean;
  role: string[];
}
export interface SideBarSubMenuDto {
  id: string;
  title: string;
  icon: any;
  url: string;
  class?: string;
  subsubmenu?: SideBarSubSubMenuDto[];
  role: string[];
  isActive?: boolean;
}

export interface SideBarSubSubMenuDto {
  id: string;
  title: string;
  icon: any;
  url: string;
  class?: string;
  role: string[];
  isActive?: boolean;
}

export const SideBarMenu: SideBarMenuDto[] = [
  {
    // A customer's home is the shop, so the label says what the page actually is.
    id: 'shop',
    title: 'Shop',
    icon: ShoppingBag,
    url: '/dashboard',
    group: 'Shop',
    isActive: false,
    role: [Roles.USER],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/admin',
    group: 'Overview',
    isActive: false,
    role: [Roles.ADMIN],
  },
  {
    id: 'catalog-setup',
    title: 'Catalog Setup',
    icon: Settings2,
    url: '',
    group: 'Catalog',
    role: [Roles.ADMIN],
    isActive: true,
    submenu: [
      {
        id: 'brand-names',
        title: 'Brands',
        icon: Tags,
        url: '/admin/brand-names/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'categories',
        title: 'Categories',
        icon: FolderTree,
        url: '/admin/categories/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'attributes',
        title: 'Product Attributes',
        icon: Sliders,
        url: '/admin/attributes/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'master-attributes',
        title: 'Variant Options',
        icon: List,
        url: '/admin/master-attributes/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'master-entries',
        title: 'Option Values',
        icon: ListChecks,
        url: '/admin/master-entries/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'suppliers',
        title: 'Suppliers',
        icon: Truck,
        url: '/admin/suppliers/',
        role: [Roles.ADMIN],
        isActive: false,
      },
    ],
  },
  {
    id: 'products-group',
    title: 'Products',
    icon: Package,
    url: '',
    group: 'Catalog',
    role: [Roles.ADMIN],
    isActive: true,
    submenu: [
      {
        id: 'Add-Product',
        title: 'Add Product',
        icon: PackagePlus,
        url: '/admin/products/add/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'products',
        title: 'All Products',
        icon: Package,
        url: '/admin/products/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'product-variants',
        title: 'Variants',
        icon: Layers,
        url: '/admin/product-variants/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'price-histories',
        title: 'Price History',
        icon: TrendingUp,
        url: '/admin/price-histories/',
        role: [Roles.ADMIN],
        isActive: false,
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ShoppingBag,
    url: '/admin/orders/',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'purchase',
    title: 'POS (Sell)',
    icon: Receipt,
    url: '/admin/purchase/',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'cart',
    title: 'Cart',
    icon: ShoppingCart,
    url: '/admin/cart',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  // {
  //   id: 'checkout',
  //   title: 'Checkout',
  //   icon: CreditCard,
  //   url: '/admin/checkout',
  //   group: 'Sales',
  //   role: [Roles.ADMIN],
  //   isActive: false,
  // },
  {
    id: 'stock',
    title: 'Stock',
    icon: Boxes,
    url: '',
    group: 'Inventory',
    role: [Roles.ADMIN],
    isActive: true,
    submenu: [
      {
        id: 'add-stock',
        title: 'Add Stock',
        icon: PackagePlus,
        url: '/admin/stock-purchase/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'purchases-history',
        title: 'Purchase History',
        icon: History,
        url: '/admin/stock-purchase/history',
        role: [Roles.ADMIN],
        isActive: false,
      },
    ],
  },
  {
    id: 'reviews',
    title: 'Reviews',
    icon: Star,
    url: '/admin/reviews/',
    group: 'Customers',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'wishlists',
    title: 'Customer Wishlists',
    icon: Heart,
    url: '/admin/wishlist/',
    group: 'Customers',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    url: '/dashboard/products/',
    group: 'Shop',
    role: [Roles.STAFF],
    isActive: false,
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ShoppingBag,
    url: '/dashboard/orders/',
    group: 'Shop',
    role: [Roles.STAFF],
    isActive: false,
  },
  {
    id: 'cart-dashboard',
    title: 'Cart',
    icon: ShoppingCart,
    url: '/dashboard/cart',
    group: 'Shop',
    role: [Roles.USER, Roles.STAFF],
    isActive: false,
  },
  {
    id: 'checkout-dashboard',
    title: 'Checkout',
    icon: CreditCard,
    url: '/dashboard/checkout',
    group: 'Shop',
    role: [Roles.USER, Roles.STAFF],
    isActive: false,
  },
  {
    id: 'wishlist-dashboard',
    title: 'My Wishlist',
    icon: Heart,
    url: '/dashboard/wishlist',
    group: 'My Account',
    role: [Roles.USER, Roles.STAFF],
    isActive: false,
  },
  {
    id: 'reviews-dashboard',
    title: 'My Reviews',
    icon: Star,
    url: '/dashboard/reviews',
    group: 'My Account',
    role: [Roles.USER, Roles.STAFF],
    isActive: false,
  },
  {
    id: 'stores',
    title: 'Stores',
    icon: Store,
    url: '/super-admin/stores/',
    group: 'Administration',
    role: [Roles.SUPER_ADMIN],
    isActive: false,
  },
  {
    id: 'users',
    title: 'Users',
    icon: Users,
    url: '/admin/users/',
    group: 'Administration',
    role: [Roles.SUPER_ADMIN, Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'user',
    title: 'Profile',
    icon: UserCircle,
    url: '',
    group: 'My Account',
    role: [Roles.USER],
    isActive: true,
    submenu: [
      {
        id: 'profile',
        title: 'Edit Profile',
        icon: User,
        url: '/dashboard/edit-profile',
        role: [Roles.USER],
        isActive: false,
      },
    ],
  },
];
