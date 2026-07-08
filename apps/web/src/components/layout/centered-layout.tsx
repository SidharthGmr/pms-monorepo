 import Logo from '../common/Logo';

export default function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="w-full flex flex-col items-center px-4 py-8">
        <main className="flex flex-col items-center">
          <div className="w-full ">
            <div className="text-center mb-8">
              <Logo className="inline-block w-[150px] md:w-[180px] h-auto" />
            </div>
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
