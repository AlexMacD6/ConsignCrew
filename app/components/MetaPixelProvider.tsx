"use client";

import {
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useState,
} from "react";
import { initMetaPixel, trackEvent } from "@/lib/meta-pixel";

// Meta Pixel context
interface MetaPixelContextType {
  trackEvent: (eventName: string, parameters?: any) => void;
  trackLead: (email?: string, value?: number) => void;
  trackViewContent: (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => void;
  trackAddToCart: (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => void;
  trackInitiateCheckout: (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => void;
  trackPurchase: (
    contentName: string,
    contentIds?: string[],
    value: number,
    currency?: string
  ) => void;
  trackContact: (email?: string, value?: number) => void;
  isReady: boolean;
}

const MetaPixelContext = createContext<MetaPixelContextType | null>(null);

// Hook to use Meta Pixel
export const useMetaPixel = () => {
  const context = useContext(MetaPixelContext);
  if (!context) {
    throw new Error("useMetaPixel must be used within a MetaPixelProvider");
  }
  return context;
};

interface MetaPixelProviderProps {
  children: ReactNode;
  pixelId: string;
}

export default function MetaPixelProvider({
  children,
  pixelId,
}: MetaPixelProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Meta Pixel on client side
    if (pixelId) {
      initMetaPixel(pixelId)
        .then(() => {
          setIsReady(true);
        })
        .catch((error) => {
          console.error("Failed to initialize Meta Pixel:", error);
          // Still set as ready to prevent blocking the app
          setIsReady(true);
        });
    } else {
      // If no pixel ID, still set as ready
      setIsReady(true);
    }
  }, [pixelId]);

  // Predefined tracking functions with async handling
  const trackLead = async (email?: string, value?: number) => {
    await trackEvent("Lead", {
      content_name: "TreasureHub Lead",
      content_category: "consignment_service",
      value: value,
      currency: "USD",
      status: "new_lead",
      email: email,
    });
  };

  const trackViewContent = async (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    await trackEvent("ViewContent", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
    });
  };

  const trackAddToCart = async (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    await trackEvent("AddToCart", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
      num_items: 1,
    });
  };

  const trackInitiateCheckout = async (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    await trackEvent("InitiateCheckout", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
      num_items: 1,
    });
  };

  const trackPurchase = async (
    contentName: string,
    contentIds?: string[],
    value: number,
    currency: string = "USD"
  ) => {
    await trackEvent("Purchase", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: currency,
      num_items: 1,
      status: "completed",
    });
  };

  const trackContact = async (email?: string, value?: number) => {
    await trackEvent("Contact", {
      content_name: "TreasureHub Contact",
      content_category: "consignment_service",
      value: value,
      currency: "USD",
      status: "contact_form_submitted",
      email: email,
    });
  };

  const contextValue: MetaPixelContextType = {
    trackEvent,
    trackLead,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
    trackContact,
    isReady,
  };

  return (
    <MetaPixelContext.Provider value={contextValue}>
      {children}
    </MetaPixelContext.Provider>
  );
}
