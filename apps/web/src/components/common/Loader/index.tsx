'use client';
import Image from 'next/image';

const Loader = () => {
  return (
    <>
      <div tabIndex={2} className="fixed top-0 left-0 z-[9999] w-screen h-screen flex bg-black bg-opacity-20 items-center justify-center">
        <div className="bg-opacity-80 h-[120px] w-[120px] py-2 px-5 rounded-sm flex items-center flex-col">
          <Image
            src={`${process.env.NEXT_PUBLIC_MAIN_DOMAIN_URL}/images/loadingstoreadmin.gif`}
            alt=""
            width={120}
            height={120}
            style={{ width: 'auto' }}
          />
        </div>
      </div>
    </>
  );
};

export default Loader;
