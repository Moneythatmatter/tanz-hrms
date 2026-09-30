"use client";

import { createContext, useContext, useState } from "react";

interface MobileNavContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  enabled: boolean;
}

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function MobileNavProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MobileNavContext.Provider
      value={{
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        enabled,
      }}
    >
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  return useContext(MobileNavContext);
}
