"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import SignupModal from "../components/SignupModal";

interface ModalContextType {
  isSignupModalOpen: boolean;
  openSignupModal: () => void;
  closeSignupModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}

interface ModalProviderProps {
  children: ReactNode;
}

export function ModalProvider({ children }: ModalProviderProps) {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const openSignupModal = () => setIsSignupModalOpen(true);
  const closeSignupModal = () => setIsSignupModalOpen(false);

  return (
    <ModalContext.Provider
      value={{
        isSignupModalOpen,
        openSignupModal,
        closeSignupModal,
      }}
    >
      {children}
      <SignupModal isOpen={isSignupModalOpen} onClose={closeSignupModal} />
    </ModalContext.Provider>
  );
}
