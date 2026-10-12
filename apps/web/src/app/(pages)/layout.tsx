import Footer from '@/components/Header/Footer';
import Header from '@/components/Header/Header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
