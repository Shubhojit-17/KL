import { Outlet } from 'react-router';

/** Minimal layout for auth pages – no navbar/footer */
export function AuthLayout() {
  return (
    <div className="min-h-screen selection:bg-[#C5A059] selection:text-[#4A3528]">
      <Outlet />
    </div>
  );
}
