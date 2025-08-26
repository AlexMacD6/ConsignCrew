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

  const value: CartContextType = {
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshCart,
    cartItemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
