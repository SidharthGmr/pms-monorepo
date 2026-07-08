'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import config from '@/config';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const logo = '/logo-full.svg';
  const icon = '/logo.svg';

  //const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar();
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props} className="p-2 rounded-lg ">
      <div className="text-end absolute -end-5 top-5 m-1 z-20 block md:hidden">
        <SidebarTrigger className=" bg-primary rounded-full  h-8 w-8  text-white" />
      </div>
      <SidebarHeader className=''>
        <div className="text-center">
          <Link href="/" className="inline-block" title={`${config.appName}`}>
            <Image src={open ? logo : icon} width={180} height={50} alt="ShotMailer" className="dark:grayscale w-[180px] h-[50px]" />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className=''>
        <ScrollArea className="h-svh pe-2 block">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
