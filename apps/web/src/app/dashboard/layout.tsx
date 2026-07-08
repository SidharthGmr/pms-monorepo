import HeaderDashboard from "@/components/Header/dashboard/page";
import { AppSidebar } from "@/components/Header/dashboard/sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
       <SidebarProvider >
          <AppSidebar />
          <SidebarInset>
            <HeaderDashboard />
            <div className="h-full bg-accent  w-full p-3 md:p-3 xl:p-7">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
    </>
  );
}
