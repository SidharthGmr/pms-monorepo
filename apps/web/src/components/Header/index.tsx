'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RiArrowDownSLine, RiArrowRightSLine, RiArrowUpSLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
import HeaderTopBar from './HeaderTopBar';
import { SideBarMenu } from '../../data/sidebarMenu';

const Header: React.FC = () => {
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    window.addEventListener('scroll', () => {
      setScroll(window.scrollY > 50);
    });
  }, []);

  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState(SideBarMenu);
  const [show, setShow] = React.useState(false);
  const [dropdown, setDropdown] = useState<number | null>(null);
  const [subDropdown, setSubDropdown] = useState<number | null>(null);

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);

  useEffect(() => {
    setMenuItems(SideBarMenu);
  }, []);

  const menuShow = () => {
    setShow(!show);
    setSubDropdown(null);
    setDropdown(null);
  };

  const showDropdownHover = (index: number) => {
    setActiveMenuIndex(index);
  };

  const hideDropdownHover = () => {
    setActiveMenuIndex(null);
  };

  const showDropdown = (index: number) => {
    if (dropdown === index) {
      setDropdown(null);
    } else {
      setDropdown(null);
      setDropdown(index);
      setActiveMenuIndex(index);
      setSubDropdown(null);
    }
  };

  const showSubDropdown = (index: number) => {
    if (subDropdown === index) {
      setSubDropdown(null);
    } else {
      setSubDropdown(null);
      setSubDropdown(index);
    }
  };

  const NavlinkCss =
    'p-2 py-3 lg:px-5 lg:py-5 flex items-center justify-between text-md font-medium relative group-text-white text-black/80 hover:text-blue';

  return (
    <div
      className={`${scroll ? 'fixed left-0 right-0 w-full bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60' : ''} z-50 shadow-sm transition-all duration-300`}
    >
      <div className="flex flex-col">
        <HeaderTopBar />
        <div className="container mx-auto px-4 relative flex-1">
          <div className="flex items-center py-1 relative">
            <div className="basis-1/5 lg:basis-4/5">
              <div className="flex lg:justify-end justify-end">
                <Button onClick={menuShow} className="bg-trabsparent p-0 hover:bg-transparent block xl:hidden">
                  <span>
                    {show ? (
                      <RiMenuUnfoldLine className="text-blue text-2xl ease-in-out duration-150" />
                    ) : (
                      <RiMenuFoldLine className="text-blue text-2xl ease-in-out duration-150" />
                    )}
                  </span>
                </Button>

                <div
                  className={`w-[300px]  xl:w-full z-10 ease-in-out duration-150  left-0 top-0 bottom-0 bg-white xl:bg-transparent shadow-xl lg:shadow-none 
                                          fixed xl:static  xl:overflow-y-none  ${show! ? 'pl-0 xl:pl-20 translate-x-0' : '-translate-x-full xl:translate-x-0 xl:transform-none '} `}
                >
                  <div className="flex justify-end items-center flex-col xl:flex-row space-x-0 xl:space-x-3 divide-y divide-blue-200 xl:divide-y-0">
                    {menuItems &&
                      menuItems.map((menuItem, index) => (
                        <React.Fragment key={menuItem.id}>
                          {menuItem.id === 'GetaDemo' ? (
                            <Button variant="default" size="lg">
                              {menuItem.title}
                            </Button>
                          ) : menuItem.id === 'Login' ? (
                            <Link
                              href={menuItem.url || ''}
                              className={`${NavlinkCss} ${dropdown === index ? 'text-white xl:text-blue' : ' '} ${pathname === menuItem.url ? 'active' : ''}`}
                            >
                              {menuItem.title}
                            </Link>
                          ) : (
                            <div onMouseEnter={() => showDropdownHover(index)} onMouseLeave={hideDropdownHover} className="">
                              <Link
                                href={menuItem.url || '#'}
                                onClick={(e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
                                  if (menuItem.submenu) {
                                    e.preventDefault();
                                    showDropdown(index);
                                  }
                                }}
                                className={`${NavlinkCss} ${dropdown === index ? 'items-center text-white xl:text-blue' : ' '} ${pathname === menuItem.url ? 'active' : ''}`}
                              >
                                {menuItem.title}
                                {menuItem.submenu &&
                                  (activeMenuIndex === index || dropdown === index ? (
                                    <RiArrowUpSLine className="ml-2 h-3 w-3" />
                                  ) : (
                                    <RiArrowDownSLine className="ml-2 h-3 w-3" />
                                  ))}
                              </Link>

                              {menuItem.submenu && (activeMenuIndex === index || dropdown === index) && (
                                <div className="relative xl:absolute -translate-x-1/2 left-1/2 inset-auto top-0 xl:top-[60px] shadow-inner p-2 pt-0 lg:pt-2 rounded-sm overflow-hidden flex transition duration-700 ease-in-out space-x-0 xl:space-x-2 space-y-2 xl:space-y-0 flex-col xl:flex-row bg-transparent xl:bg-white">
                                  {menuItem.submenu
                                    .filter((submenuItem) => submenuItem.id !== 'DentalPractice')
                                    .map((submenuItem, subIndex) => (
                                      <div key={subIndex} className="flex-1 bg-grey lg:bg-white rounded-sm">
                                        <Link
                                          onClick={(e: React.MouseEvent<HTMLAnchorElement>, index: number) => {
                                            if (submenuItem.subsubmenu) {
                                              e.preventDefault();
                                              showSubDropdown(subIndex);
                                            }
                                          }}
                                          href={submenuItem.url || ''}
                                          className={`group flex justify-between items-center uppercase rounded-sm px-3 py-4 mb-2 text-sm font-medium text-blue bg-grey ${pathname === submenuItem.url ? 'font-bold' : ''}`}
                                        >
                                          {submenuItem.title}
                                          {submenuItem.subsubmenu && (
                                            <RiArrowRightSLine className="ml-2 h-3 w-3 text-blue group-hover:text-blue transition duration-600 ease-in-out" />
                                          )}
                                        </Link>
                                        {submenuItem.subsubmenu && (window.innerWidth <= 1025 ? subDropdown === subIndex : true) && (
                                          <div className="max-h-56 lg:max-h-auto relative transition-all duration-200 ease-in-out flex flex-col space-x-0 lg:space-x-0 px-0 mb-2 space-y-1 lg:space-y-0 overflow-y-auto">
                                            {submenuItem.subsubmenu.map((item) => (
                                              <Link
                                                key={item.id}
                                                href={item.url || ''}
                                                className={`groups flex items-start px-4 py-3 text-sm text-black transition-all duration-200 ease-in-out hover:text-blue hover:bg-grey ${pathname === item.url ? 'font-bold' : ''}`}
                                              >
                                                <div className="w-4">
                                                  <RiArrowRightSLine className="me-2 h-3 w-3 text-black groups-hover:text-blue" />
                                                </div>
                                                <div className="flex-1">
                                                  <span className="font-medium block">{item.title}</span>
                                                </div>
                                              </Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
