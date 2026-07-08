import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
interface BackgroundImageProps {
  children?: ReactNode;
  className?: string;
  overlay?: boolean;
}

const BackgroundImageWrapper: React.FC<BackgroundImageProps> = ({ children, className = '', overlay = false }) => {
  return (
    <div
      className={cn(
        `relative bg-cover bg-center bg-no-repeat py-8 xl:py-16 z-10   ${overlay ? `after:content-[''] after:absolute after:inset-0 after:w-full after:h-full after:bg-gradient-to-r after:from-white after:via-white/90 after:to-white/50 xl:after:to-white/0 after:-z-10` : ''}`,
        className
      )}
    >
      {children}
    </div>
  );
};

export default BackgroundImageWrapper;
