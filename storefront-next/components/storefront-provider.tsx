"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import type { AccountProfile, CartLine } from "@/lib/types";

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (line: Omit<CartLine, "id" | "quantity">, quantity?: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
};

type AccountContextValue = {
  profile: AccountProfile;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
};

const CART_STORAGE_KEY = "blueprint-next-cart";
const ACCOUNT_STORAGE_KEY = "blueprint-next-account";

const CartContext = createContext<CartContextValue | undefined>(undefined);
const AccountContext = createContext<AccountContextValue | undefined>(undefined);

function readStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as CartLine[];
  } catch {
    return [];
  }
}

function readStoredAccount(): AccountProfile {
  if (typeof window === "undefined") {
    return { signedIn: false, name: "", email: "" };
  }

  const raw = window.localStorage.getItem(ACCOUNT_STORAGE_KEY);
  if (!raw) {
    return { signedIn: false, name: "", email: "" };
  }

  try {
    return JSON.parse(raw) as AccountProfile;
  } catch {
    return { signedIn: false, name: "", email: "" };
  }
}

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<AccountProfile>({
    signedIn: false,
    name: "",
    email: ""
  });

  useEffect(() => {
    setLines(readStoredCart());
    setProfile(readStoredAccount());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    window.localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const cartValue: CartContextValue = {
    lines,
    isOpen,
    itemCount,
    subtotal,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem: (line, quantity = 1) => {
      const safeQuantity = Math.max(1, quantity);
      const id = `${line.productHandle}:${line.variantId}`;

      setLines((current) => {
        const existing = current.find((item) => item.id === id);
        if (!existing) {
          return [...current, { ...line, id, quantity: safeQuantity }];
        }

        return current.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + safeQuantity } : item
        );
      });

      setIsOpen(true);
    },
    updateQuantity: (lineId, quantity) => {
      setLines((current) =>
        current
          .map((line) => (line.id === lineId ? { ...line, quantity } : line))
          .filter((line) => line.quantity > 0)
      );
    },
    removeLine: (lineId) => {
      setLines((current) => current.filter((line) => line.id !== lineId));
    },
    clearCart: () => setLines([])
  };

  const accountValue: AccountContextValue = {
    profile,
    signIn: (name, email) =>
      setProfile({
        signedIn: true,
        name: name.trim() || "Blueprint Explorer",
        email: email.trim()
      }),
    signOut: () =>
      setProfile({
        signedIn: false,
        name: "",
        email: ""
      })
  };

  return (
    <AccountContext.Provider value={accountValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </AccountContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside StorefrontProvider");
  }
  return context;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used inside StorefrontProvider");
  }
  return context;
}
