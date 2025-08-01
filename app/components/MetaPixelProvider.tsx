"use client";

import { useEffect, createContext, useContext, ReactNode } from "react";
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
  useEffect(() => {
    // Initialize Meta Pixel on client side
    if (pixelId) {
      initMetaPixel(pixelId);
    }
  }, [pixelId]);

  // Predefined tracking functions
  const trackLead = (email?: string, value?: number) => {
    trackEvent("Lead", {
      content_name: "TreasureHub Lead",
      content_category: "consignment_service",
      value: value,
      currency: "USD",
      status: "new_lead",
      email: email,
    });
  };

  const trackViewContent = (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    trackEvent("ViewContent", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
    });
  };

  const trackAddToCart = (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    trackEvent("AddToCart", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
      num_items: 1,
    });
  };

  const trackInitiateCheckout = (
    contentName: string,
    contentIds?: string[],
    value?: number
  ) => {
    trackEvent("InitiateCheckout", {
      content_name: contentName,
      content_category: "consignment_service",
      content_ids: contentIds,
      content_type: "product",
      value: value,
      currency: "USD",
      num_items: 1,
    });
  };

  const trackPurchase = (
    contentName: string,
    contentIds?: string[],
    value: number,
    currency: string = "USD"
  ) => {
    trackEvent("Purchase", {
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

  const trackContact = (email?: string, value?: number) => {
    trackEvent("Contact", {
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
  };

  return (
    <MetaPixelContext.Provider value={contextValue}>
      {children}
    </MetaPixelContext.Provider>
  );
}
