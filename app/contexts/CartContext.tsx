"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authClient } from "../lib/auth-client";

interface CartItem {
  id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  addedAt: string;
  listing: {
    id: string;
    itemId: string;
    title: string;
    price: number;
    photos: any;
    status: string;
    deliveryCategory: "NORMAL" | "BULK";
    user: {
      id: string;
      name: string;
    };
  };
}

interface PromoCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
}

interface PromoDiscount {
  amount: number;
  type: string;
  description: string;
}

interface Cart {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  hasBulkItems: boolean;
  hasNormalItems: boolean;
  promoCode?: PromoCode;
  promoDiscount?: PromoDiscount;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  addToCart: (listingId: string, quantity?: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
  cartItemCount: number;
  applyPromoCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  removePromoCode: () => Promise<boolean>;
  validatePromoCode: (code: string) => Promise<{ valid: boolean; error?: string; discount?: PromoDiscount }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  // Calculate cart item count
  const cartItemCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  // Fetch cart data
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);
      const response = await fetch("/api/cart", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
        setHasError(false);
      } else {
        console.error(
          "Failed to fetch cart",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.error("Cart API error response:", errorText);
        setCart(null);
        setHasError(true);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          "Network error - cart API might be unavailable or not responding"
        );
      }
      setCart(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Add item to cart
  const addToCart = useCallback(
    async (listingId: string, quantity: number = 1): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }

      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ listingId, quantity }),
        });

        if (response.ok) {
          await refreshCart();
          return true;
        } else {
          const errorData = await response.json();
          console.error("Failed to add to cart:", errorData.error);
          return false;
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        return false;
      }
    },
    [isAuthenticated, refreshCart]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!isAuthenticated) {
        return false;
      }

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          await refreshCart();
          return true;
        } else {
          console.error("Failed to remove from cart");
          return false;
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        return false;
      }
    },
    [isAuthenticated, refreshCart]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number): Promise<boolean> => {
      if (!isAuthenticated || quantity < 1) {
        return false;
      }

      try {
        const response = await fetch(`/api/cart/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ quantity }),
        });

        if (response.ok) {
          await refreshCart();
          return true;
        } else {
          console.error("Failed to update quantity");
          return false;
        }
      } catch (error) {
        console.error("Error updating quantity:", error);
        return false;
      }
    },
    [isAuthenticated, refreshCart]
  );

  // Clear cart
  const clearCart = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      const response = await fetch("/api/cart/clear", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        await refreshCart();
        return true;
      } else {
        console.error("Failed to clear cart");
        return false;
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }, [isAuthenticated, refreshCart]);

  // Load cart when user logs in/out
  useEffect(() => {
    // Only try to fetch cart if user is authenticated
    if (isAuthenticated) {
      refreshCart();
    } else {
      // Clear cart state when user logs out
      setCart(null);
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Validate promo code
  const validatePromoCode = useCallback(async (code: string) => {
    if (!isAuthenticated || !cart) {
      return { valid: false, error: "Cart not available" };
    }

    try {
      const response = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          orderTotal: cart.subtotal
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        return {
          valid: true,
          discount: data.discount
        };
      } else {
        return {
          valid: false,
          error: data.error || "Invalid promo code"
        };
      }
    } catch (error) {
      console.error("Error validating promo code:", error);
      return {
        valid: false,
        error: "Failed to validate promo code"
      };
    }
  }, [isAuthenticated, cart]);

  // Apply promo code
  const applyPromoCode = useCallback(async (code: string) => {
    if (!isAuthenticated || !cart) {
      return { success: false, error: "Cart not available" };
    }

    try {
      // First validate the promo code
      const validation = await validatePromoCode(code);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Apply the promo code to the cart state
      const promoCodeData = {
        id: 'temp-id', // This would come from the API response
        code: code.toUpperCase(),
        name: validation.discount?.description || code,
        type: validation.discount?.type as any || 'percentage',
        value: 0 // This would come from the API response
      };

      setCart(prevCart => {
        if (!prevCart) return prevCart;
        return {
          ...prevCart,
          promoCode: promoCodeData,
          promoDiscount: validation.discount
        };
      });

      return { success: true };
    } catch (error) {
      console.error("Error applying promo code:", error);
      return { success: false, error: "Failed to apply promo code" };
    }
  }, [isAuthenticated, cart, validatePromoCode]);

  // Remove promo code
  const removePromoCode = useCallback(async () => {
    if (!isAuthenticated || !cart) {
      return false;
    }

    try {
      setCart(prevCart => {
        if (!prevCart) return prevCart;
        return {
          ...prevCart,
          promoCode: undefined,
          promoDiscount: undefined
        };
      });

      return true;
    } catch (error) {
      console.error("Error removing promo code:", error);
      return false;
    }
  }, [isAuthenticated, cart]);

  const value: CartContextType = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    cartItemCount,
    applyPromoCode,
    removePromoCode,
    validatePromoCode,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
