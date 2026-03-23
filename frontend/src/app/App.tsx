import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import CollectionPage from '@/pages/CollectionPage';
import ProductPage from '@/pages/ProductPage';
import ContactPage from '../pages/ContactPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderSuccessPage from '@/pages/OrderSuccessPage';
import OrdersPage from '@/pages/OrdersPage';
import AdminPage from '@/pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* Theme-consistent toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#4A3528',
                color: '#FDFBF7',
                border: '1px solid rgba(197, 160, 89, 0.3)',
                fontFamily: 'Montserrat, sans-serif',
                fontSize: '13px',
                letterSpacing: '0.05em',
              },
              success: {
                iconTheme: { primary: '#C5A059', secondary: '#4A3528' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#4A3528' },
              },
            }}
          />

          <Routes>
            {/* Auth layout – no navbar */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Main layout – with navbar + footer */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/product/:id" element={<ProductPage />} />
              <Route path="/contact" element={<ContactPage />} />

              {/* Protected routes */}
              <Route
                path="/cart"
                element={
                  <ProtectedRoute>
                    <CartPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/order-success"
                element={
                  <ProtectedRoute>
                    <OrderSuccessPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
