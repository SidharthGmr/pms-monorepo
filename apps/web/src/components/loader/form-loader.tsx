

export default function SubmitLoader() {

  return (
    <>
      <div className="absolute top-0 bottom-0 end-0 left-0 z-[60]  flex bg-background/80  items-center justify-center">
        <div className="bg-opacity-80 py-2 px-5 rounded-sm flex items-center flex-col">
          <div className="loader-dots block relative w-20 h-5 mt-2">
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-secondary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-primary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-secondary"></div>
            <div className="absolute top-0 mt-1 w-3 h-3 rounded-full bg-primary"></div>
          </div>
        </div>
      </div>
    </>
  );
}
