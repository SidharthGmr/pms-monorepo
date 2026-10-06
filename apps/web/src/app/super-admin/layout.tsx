import HeaderDashboard from '@/components/Header/dashboard/page';
import { AppSidebar } from '@/components/Header/dashboard/sidebar/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <HeaderDashboard />
        <div className="flex-1 p-3 sm:p-4 lg:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
