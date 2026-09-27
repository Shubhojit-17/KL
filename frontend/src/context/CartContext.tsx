import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { AxiosError } from 'axios';
import { cartService, type Cart, type CartItem } from '@/services/cart.service';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart | null;
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

/** Extract error message from backend { success, error: { code, message } } shape */
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.error?.message || fallback;
  }
  return fallback;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const c = await cartService.getCart();
      setCart(c);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const c = await cartService.addToCart(productId, quantity);
      setCart(c);
      toast.success('Added to cart');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to add to cart'));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const c = await cartService.updateCartItem(productId, quantity);
      setCart(c);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to update cart'));
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const c = await cartService.removeFromCart(productId);
      setCart(c);
      toast.success('Removed from cart');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to remove item'));
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCart(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to clear cart'));
    }
  };

  const items = cart?.items ?? [];
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce(
    (sum, i) => sum + (i.product?.price || 0) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        itemCount,
        totalPrice,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
