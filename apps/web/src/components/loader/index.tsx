import config from "@/config";
import Image from "next/image";

export default function Loader() {

  return (
    <>
      <div className="fixed top-0 left-0 z-[60] w-screen h-screen flex bg-background bg-opacity-90 items-center justify-center">
        <div className="bg-opacity-80 py-2 px-5 rounded-sm flex items-center flex-col">
          {/* <div className="loader-dots block relative w-20 h-5 mt-2">
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-secondary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-primary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-secondary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-primary"></div>
          </div> */}
          <Image src={`${config.cdnUrl}/images/web/tci-loader.gif`} alt="Loading..." width={100} height={100} className="object-contain w-20 h-20" />
        </div>
      </div>
    </>
  );
}
