import {
  Bell,
  Boxes,
  Images,
  Inbox,
  ScanBarcode,
  MailPlus,
  FolderTree,
  Heart,
  History,
  LayoutDashboard,
  List,
  ListChecks,
  Package,
  PackagePlus,
  Settings2,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Truck,
  User,
  UserCircle,
  UserCog,
  Undo2,
  Users,
} from 'lucide-react';
import { Roles } from '@pms/types';

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
    // A customer's home is their account overview; the shop itself lives on its own page.
    id: 'customer-dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    group: 'Shop',
    isActive: false,
    role: [Roles.USER],
  },
  {
    id: 'shop',
    title: 'Shop',
    icon: ShoppingBag,
    url: '/dashboard/shop',
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
        id: 'master-attributes',
        title: 'Master Attributes',
        icon: List,
        url: '/admin/master-attributes/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      // {
      //   id: 'master-entries',
      //   title: 'Option Values',
      //   icon: ListChecks,
      //   url: '/admin/master-entries/',
      //   role: [Roles.ADMIN],
      //   isActive: false,
      // },
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
    id: 'products',
    title: 'Products',
    icon: Package,
    group: 'Catalog',
    url: '/admin/products/',
    role: [Roles.ADMIN],
    isActive: false,
  },
  // {
  //   id: 'products-group',
  //   title: 'Products',
  //   icon: Package,
  //   url: '',
  //   group: 'Catalogs',
  //   role: [Roles.ADMIN],
  //   isActive: true,
  //   submenu: [
  //     {
  //       id: 'Add-Product',
  //       title: 'Add Product',
  //       icon: PackagePlus,
  //       url: '/admin/products/add/',
  //       role: [Roles.ADMIN],
  //       isActive: false,
  //     },
  //     {
  //       id: 'product-variants',
  //       title: 'Variants',
  //       icon: Layers,
  //       url: '/admin/products/variants/',
  //       role: [Roles.ADMIN],
  //       isActive: false,
  //     },
  //     {
  //       id: 'price-histories',
  //       title: 'Price History',
  //       icon: TrendingUp,
  //       url: '/admin/price-histories/',
  //       role: [Roles.ADMIN],
  //       isActive: false,
  //     },
  //   ],
  // },
  {
    id: 'orders',
    title: 'Invoice',
    icon: ShoppingBag,
    url: '/admin/orders/',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'pos',
    title: 'POS',
    icon: ScanBarcode,
    url: '/admin/pos/',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'returns',
    title: 'Returns',
    icon: Undo2,
    url: '/admin/returns/',
    group: 'Sales',
    role: [Roles.ADMIN],
    isActive: false,
  },
  // {
  //   id: 'cart',
  //   title: 'Cart',
  //   icon: ShoppingCart,
  //   url: '/admin/cart',
  //   group: 'Sales',
  //   role: [Roles.ADMIN],
  //   isActive: false,
  // },
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
  // {
  //   id: 'pages',
  //   title: 'Pages',
  //   icon: FileText,
  //   url: '/admin/pages/',
  //   group: 'Content',
  //   role: [Roles.ADMIN],
  //   isActive: false,
  // },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    url: '/admin/notifications/',
    group: 'Overview',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'contact-messages',
    title: 'Contact Messages',
    icon: Inbox,
    url: '/admin/contact-messages/',
    group: 'Customers',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'subscribers',
    title: 'Subscribers',
    icon: MailPlus,
    url: '/admin/subscribers/',
    group: 'Customers',
    role: [Roles.ADMIN],
    isActive: false,
  },
  // {
  //   id: 'reviews',
  //   title: 'Reviews',
  //   icon: Star,
  //   url: '/admin/reviews/',
  //   group: 'Customers',
  //   role: [Roles.ADMIN],
  //   isActive: false,
  // },
  // {
  //   id: 'wishlists',
  //   title: 'Customer Wishlists',
  //   icon: Heart,
  //   url: '/admin/wishlist/',
  //   group: 'Customers',
  //   role: [Roles.ADMIN],
  //   isActive: false,
  // },
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
    url: '/superadmin/stores/',
    group: 'Administration',
    role: [Roles.SUPER_ADMIN],
    isActive: false,
  },
  {
    id: 'all-users',
    title: 'All Users',
    icon: UserCog,
    url: '/superadmin/users/',
    group: 'Administration',
    role: [Roles.SUPER_ADMIN],
    isActive: false,
  },
  {
    id: 'media',
    title: 'Media',
    icon: Images,
    url: '/admin/media/',
    group: 'Administration',
    role: [Roles.SUPER_ADMIN, Roles.ADMIN],
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
  // {
  //   id: 'settings',
  //   title: 'Settings',
  //   icon: Settings2,
  //   url: '/admin/settings/',
  //   group: 'Administration',
  //   role: [Roles.SUPER_ADMIN, Roles.ADMIN],
  //   isActive: false,
  // },
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
