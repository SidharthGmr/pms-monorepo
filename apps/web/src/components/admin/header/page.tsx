// 'use client';
// import Image from 'next/image';
// import userlogo from '@/images/sidharth.jpg';
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
// import useLogout from '@/hooks/use-logout';
// import { Card, CardDescription, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
// import { useState } from 'react';
// import { SidebarTrigger } from '@/components/ui/sidebar';
// import useGetCurrentUser from '@/hooks/useGetCurrentUser';
// import { FaHandsClapping } from 'react-icons/fa6';
// import Logo from '@/components/common-components/Logo';
// import { Separator } from '@/components/ui/separator';
// import { BreadCrumb } from '@/components/Header/BreadCrumb';



// interface TopbarProps {
//   show?: string;
// }

// export default function Topbar({ show = "true" }: TopbarProps) {
//   const logout = useLogout();
//   const { currentUser, isAuthenticated } = useGetCurrentUser();

//   return (
//     <>
//       <Card className="w-full !p-0 bg-transparent shadow-none">
//         <div className="flex justify-between items-center px-4 py-2"> 
//           <div className="hidden xl:block ">
//             <BreadCrumb />
//           </div> 
//           <div className="flex items-center gap-4">
//             <div className="d">
//               <CardTitle className='flex items-center gap-2 text-md text-background'>Hi, {isAuthenticated && currentUser?.name} <FaHandsClapping className="text-primary text-lg" /></CardTitle>
//             </div>
//             <Separator orientation="vertical" />
//             <DropdownMenu>
//               <DropdownMenuTrigger className={` flex justify-center  overflow-hidden items-center relative bg-blue size-12 rounded-full`}>
//                 <Image src={userlogo} className="img-fluid rounded-full object-cover" alt="Sidharth Kumar" />
//               </DropdownMenuTrigger>
//               <DropdownMenuContent>
//                 <DropdownMenuLabel>Dashboard</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>Profile</DropdownMenuItem>
//                 <DropdownMenuItem>Notifications</DropdownMenuItem>
//                 <DropdownMenuItem onClick={async () => {
//                   await logout();
//                 }}>Logout</DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//             <Separator orientation="vertical" />
//             <div className="block xl:hidden">
//               <Logo width={100} height={50} className="dark:grayscale w-[100px] h-[50px]" />
//             </div>
//             <Separator orientation="vertical" />
//             <div className="block xl:hidden">
//               <SidebarTrigger className="" />
//             </div>

//           </div>

//         </div>
//       </Card>
//     </>
//   );
// }
