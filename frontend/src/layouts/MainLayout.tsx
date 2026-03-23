import { Outlet, useLocation } from 'react-router';
import { SiteNavbar } from '@/components/SiteNavbar';
import { SiteFooter } from '@/components/SiteFooter';

export function MainLayout() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="bg-[#4A3528] min-h-screen text-[#FDFBF7] selection:bg-[#C5A059] selection:text-[#4A3528] overflow-x-hidden w-full">
      <SiteNavbar />
      <main className={isHome ? '' : 'pt-20'}>
        <Outlet />
      </main>
      {!isHome && <SiteFooter />}
    </div>
  );
}
