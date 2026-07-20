'use client';

import Link from 'next/link';
import { cn } from '@/components/ui/utils';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FaAngleRight, FaChevronDown } from 'react-icons/fa';
import HeaderTopBar from './HeaderTopBar';
import { SideBarMenu, SideBarMenuDto } from '@/data/sidebarMenu';

const StepDownMenu: React.FC = () => {
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', () => {
      setScroll(window.scrollY > 50);
    });
  }, []);

  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<SideBarMenuDto[]>(SideBarMenu);

  useEffect(() => {
    setMenuItems(SideBarMenu);
  }, []);

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  const [activeSubMenuIndex, setActiveSubMenuIndex] = useState<{ [key: number]: number | null }>({});

  const handleMenuHover = (index: number) => {
    setActiveMenuIndex(index);
  };

  const handleMenuLeave = () => {
    setActiveMenuIndex(null);
  };

  const handleSubMenuHover = (menuIndex: number, subMenuIndex: number) => {
    setActiveSubMenuIndex((prev) => ({ ...prev, [menuIndex]: subMenuIndex }));
  };

  const handleSubMenuLeave = (menuIndex: number) => {
    setActiveSubMenuIndex((prev) => ({ ...prev, [menuIndex]: null }));
  };

  const NavItems = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('navItem relative', className)} {...props} />
  ));
  NavItems.displayName = 'NavItems';

  const NavLinks = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('navLink w-full flex justify-between ms-2', className)} {...props} />
  ));
  NavLinks.displayName = 'NavLinks';

  const isSubmenuActive = (submenuItems: SideBarMenuDto[]) => {
    return submenuItems.some((submenu) => submenu.url === pathname || submenu.url === pathname);
  };

  return (
    <>
      <div className={`${scroll ? 'fixed left-0 right-0 w-full bg-white' : ''} z-50 shadow-sm`}>
        <div className="flex flex-col">
          <HeaderTopBar cssClassNames="" />
          <div className="container mx-auto px-4">
            <div className="flex flex-row items-center">
              <div className="basis-4/5 lg:basis-1/5">
                <div className="logoarea lg:text-start md:text-start py-4">
                  <Link href="/" className="inline-block" title={`GMR`}>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_CDN_MAIN_DOMAIN_URL}/repugen-color-logo.svg`}
                      width={180}
                      height={50}
                      alt={`GMR`}
                      className="dark:grayscale"
                    />
                  </Link>
                </div>
              </div>
              <div className="basis-1/5 lg:basis-4/5">
                <div className="flex space-x-1 justify-end relative">
                  {menuItems.map((menudata, index) => {
                    const parentActive = pathname === menudata.url || (menudata.submenu && isSubmenuActive(menudata.submenu));
                    return (
                      <NavItems
                        key={menudata.id}
                        className={`rounded-sm ${parentActive ? 'active' : ''}`}
                        onMouseEnter={() => handleMenuHover(index)}
                        onMouseLeave={handleMenuLeave}
                      >
                        <Link
                          href={menudata.url || ''}
                          className={`p-5 text-black/80 flex items-center text-md relative ms-[10px] font-medium ${parentActive ? 'active' : 'Noactive'} transition duration-200`}
                        >
                          {menudata.title}
                          {menudata.submenu && <FaChevronDown className="h-3 w-3 text-[10px] font-medium ms-1 ease-in-out duration-150" />}
                        </Link>
                        {menudata.submenu && (
                          <div
                            className={`absolute left-0 right-0 bg-white w-[250px] top-[60px] shadow-2xl drop-shadow-xl  ${activeMenuIndex === index ? 'block' : 'hidden'}`}
                          >
                            {menudata.submenu.map((submenu, subIndex) => {
                              const isSubmenuActiveItem = pathname === submenu.url || pathname === submenu.url;
                              const hasNestedSubmenu = submenu.subsubmenu && submenu.subsubmenu.length > 0;

                              return (
                                <div
                                  key={submenu.id}
                                  className="relative group"
                                  onMouseEnter={() => handleSubMenuHover(index, subIndex)}
                                  onMouseLeave={() => handleSubMenuLeave(index)}
                                >
                                  <Link
                                    href={submenu.url || '#'}
                                    className={`p-3 flex items-center justify-between text-black/80 text-[14px] hover:text-blue hover:bg-blue/10 font-medium ${isSubmenuActiveItem ? 'active text-blue' : 'text-black/80'}`}
                                  >
                                    <span className="ms-2">{submenu.title}</span>
                                    {hasNestedSubmenu && (
                                      <FaChevronDown className="h-3 w-3 text-[10px] font-medium ms-1 ease-in-out duration-150 ml-auto" />
                                    )}
                                  </Link>
                                  {hasNestedSubmenu && (
                                    <div
                                      className={`absolute left-full top-0 bg-white w-[250px] shadow-lg drop-shadow-lg ${activeSubMenuIndex[index] === subIndex ? 'block' : 'hidden'}`}
                                    >
                                      {submenu.subsubmenu!.map((nestedSubmenu) => {
                                        const isNestedActive = pathname === nestedSubmenu.url || pathname === nestedSubmenu.url;
                                        return (
                                          <Link
                                            href={nestedSubmenu.url || '#'}
                                            key={nestedSubmenu.id}
                                            className={`p-3 flex items-center justify-between text-black/80 text-[14px]  hover:text-blue hover:bg-blue/10 hover:font-medium ${isNestedActive ? 'active text-blue' : 'text-black/80'}`}
                                          >
                                            <span className="ms-2">{nestedSubmenu.title}</span>
                                            <FaAngleRight className="h-3 w-3 text-[10px] font-medium ms-1 ease-in-out duration-150 ml-auto" />
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </NavItems>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StepDownMenu;
