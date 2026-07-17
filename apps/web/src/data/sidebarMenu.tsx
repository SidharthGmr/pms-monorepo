import { Roles } from '@/enums/roles.enum';
import { FolderTree, LayoutDashboard, List, Package, Receipt, ShoppingBag, Sliders, Store, Tags, Truck, User, Users } from 'lucide-react';

export interface SideBarMenuDto {
  id: string;
  title: string;
  icon: any; // React component
  url: string;
  class?: string;
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
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    isActive: false,
    role: [Roles.USER],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/admin',
    isActive: false,
    role: [Roles.ADMIN],
  },
  {
    id: 'addproducts',
    title: 'Add Products',
    icon: User,
    url: '',
    role: [Roles.ADMIN],
    isActive: true,
    submenu: [
      {
        id: 'brand-names',
        title: 'Brand Names',
        icon: Tags,
        url: '/admin/brand-names/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'attributes',
        title: 'Attributes',
        icon: Sliders,
        url: '/admin/attributes/',
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
        // subsubmenu: [
        //   {
        //     id: "SendNewsletter2",
        //     title: "Send Newsletter",
        //     icon: FolderTree,
        //     url: "/send-newsletter",
        //     role: [Roles.ADMIN],
        //     isActive: false,
        //   }
        // ]
      },
      {
        id: 'products',
        title: 'Products',
        icon: Package,
        url: '/admin/products/',
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
    id: 'orders',
    title: 'Orders',
    icon: ShoppingBag,
    url: '/admin/orders/',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'products',
    title: 'Products',
    icon: Package,
    url: '/dashboard/products/',
    role: [Roles.STAFF],
    isActive: false,
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ShoppingBag,
    url: '/dashboard/orders/',
    role: [Roles.STAFF],
    isActive: false,
  },
  {
    id: 'purchase',
    title: 'POS (Sell)',
    icon: Receipt,
    url: '/admin/purchase/',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'stock',
    title: 'Stock',
    icon: Receipt,
    url: '',
    role: [Roles.ADMIN],
    isActive: true,
    submenu: [
      {
        id: 'add-stock',
        title: 'Add Stock',
        icon: User,
        url: '/admin/stock-purchase/',
        role: [Roles.ADMIN],
        isActive: false,
      },
      {
        id: 'purchases-history',
        title: 'Purchase History',
        icon: List,
        url: '/admin/stock-purchase/history',
        role: [Roles.ADMIN],
        isActive: false,
      },
    ],
  },

  {
    id: 'staff',
    title: 'Staff',
    icon: Users,
    url: '/admin/staff/',
    role: [Roles.ADMIN],
    isActive: false,
  },
  {
    id: 'customer',
    title: 'Customer',
    icon: Users,
    url: '/admin/customer/',
    role: [Roles.ADMIN],
    isActive: false,
  },

  {
    id: 'stores',
    title: 'Stores',
    icon: Store,
    url: '/admin/stores/',
    role: [Roles.SUPER_ADMIN],
    isActive: false,
  },
  {
    id: 'users',
    title: 'Users',
    icon: User,
    url: '/admin/users/',
    role: [Roles.SUPER_ADMIN, Roles.ADMIN],
    isActive: false,
  },

  // {
  //     id: "newsletter",
  //     title: "Newsletter",
  //     icon: User,
  //     url: "",
  //     role: [Roles.ADMIN],
  //     isActive: true,
  //     submenu: [
  //         {
  //             id: "email-sent",
  //             title: "Email Sent",
  //             icon: User,
  //             url: "/admin/email-sent",
  //             role: [Roles.ADMIN],
  //             isActive: false,
  //             subsubmenu: [
  //                 {
  //                     id: "SendNewsletter2",
  //                     title: "Send Newsletter",
  //                     icon: FolderTree,
  //                     url: "/send-newsletter",
  //                     role: [Roles.ADMIN],
  //                     isActive: false,
  //                 }
  //             ]
  //         },
  //     ]
  // },
  {
    id: 'user',
    title: 'Sidharth Kumar',
    icon: User,
    url: '',
    role: [Roles.USER],
    isActive: true,
    submenu: [
      {
        id: 'profile',
        title: 'Profile',
        icon: List,
        url: '/dashboard/edit-profile',
        role: [Roles.USER],
        isActive: false,
      },
    ],
  },
];
