import React from 'react';
import { Button } from '../ui/button';
import Image from 'next/image';

interface BannerProps {
  title: string;
  subtitle: string;
  sectionTitle: string;
  buttonText: string;
  onButtonClick?: () => void;
  className?: string;
}

const Banner: React.FC<BannerProps> = ({
  title = "More Than Components, It's Your Frontend Universe",
  subtitle = "U! Layouts isn't just a library, it's a complete toolkit with components, effects, design tools, and ready-to-use blocks, everything you need to build modern interfaces, faster.",
  sectionTitle = 'Unlock Blocks',
  buttonText = 'Browse Components',
  onButtonClick,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black text-white p-8 pb-0 rounded-2xl shadow-2xl ${className}`}>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3 xl:col-span-8 space-y-8 content-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-loose bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-white gradient">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed max-w-3xl">{subtitle}</p>
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <h2 className="text-2xl font-semibold mb-2">{sectionTitle}</h2>
            <p className="text-gray-400">Explore our curated collection of components</p>

            <Button
              onClick={onButtonClick}
              className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 border-none transition-all duration-300"
            >
              {buttonText}
              <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </div>
        </div>
        <div className="col-span-3 xl:col-span-4 space-y-8">
          <Image src="/banner-man.png" width={580} height={500} alt="Banner Image" className="dark:grayscale" />
        </div>
      </div>
    </div>
  );
};

export default Banner;
