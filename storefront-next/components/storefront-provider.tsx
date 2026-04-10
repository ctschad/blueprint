"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import { isSubscriptionEligible } from "@/lib/subscription-eligibility";
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
  toggleSubscription: (lineId: string) => void;
  clearCart: () => void;
};

type AccountContextValue = {
  profile: AccountProfile;
  signIn: (name: string, email: string) => void;
  signOut: () => void;
};

const CART_STORAGE_KEY = "blueprint-next-cart";
const ACCOUNT_STORAGE_KEY = "blueprint-next-account";
const STORAGE_VERSION = 2;
const STORAGE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type StoredEnvelope<T> = {
  data: T;
  updatedAt: number;
  version: number;
};

const DEFAULT_PACK_LABELS: Record<string, string> = {
  "advanced-antioxidants": "1 Bottle",
  "ashwagandha-rhodiola-120mg": "1 Bottle",
  "nac-ginger-capsules": "1 Bottle",
  "omega-3": "1 Bottle",
  "essentials-capsules": "1 Bottle",
  "creatine": "1 Pouch",
  "collagen": "1 Pouch",
  "ceremonial-matcha": "1 Pouch",
  "cocoa-powder": "1 Pouch",
  "nutty-pudding-fruit-and-nut-mix": "1 Pouch",
  "raw-macadamias": "1 Pouch",
  "super-shrooms": "1 Pouch",
  "facial-cleanser": "1 Bottle",
  "facial-moisturizer": "1 Bottle",
  "facial-serum": "1 Bottle",
  "hair-peptide-serum": "1 Bottle",
  "hair-peptide-shampoo": "1 Bottle",
  "blueprint-hat": "1 Hat",
  "spout": "1 Spout",
  "laser-cap": "1 Device",
  "advanced-panel": "1 Kit",
  "basic-panel": "1 Kit",
  "microplastics-test": "1 Test",
  "speed-of-aging": "1 Test",
  "haircare-stack": "1 Set",
  "skincare-stack": "1 Set"
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const AccountContext = createContext<AccountContextValue | undefined>(undefined);

function isStoredEnvelope<T>(value: unknown): value is StoredEnvelope<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "updatedAt" in value &&
    "version" in value &&
    typeof (value as StoredEnvelope<T>).updatedAt === "number" &&
    typeof (value as StoredEnvelope<T>).version === "number"
  );
}

function isCartLine(value: unknown): value is CartLine {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as CartLine).id === "string" &&
    typeof (value as CartLine).productHandle === "string" &&
    typeof (value as CartLine).productTitle === "string" &&
    typeof (value as CartLine).variantId === "number" &&
    typeof (value as CartLine).variantTitle === "string" &&
    typeof (value as CartLine).price === "number" &&
    typeof (value as CartLine).quantity === "number"
  );
}

function isAccountProfile(value: unknown): value is AccountProfile {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as AccountProfile).signedIn === "boolean" &&
    typeof (value as AccountProfile).name === "string" &&
    typeof (value as AccountProfile).email === "string"
  );
}

function readStoredValue<T>(key: string, fallback: T, validate: (value: unknown) => value is T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredEnvelope<T>(parsed)) {
      window.localStorage.removeItem(key);
      return fallback;
    }

    if (
      parsed.version !== STORAGE_VERSION ||
      Date.now() - parsed.updatedAt > STORAGE_TTL_MS ||
      !validate(parsed.data)
    ) {
      window.localStorage.removeItem(key);
      return fallback;
    }

    return parsed.data;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeStoredValue<T>(key: string, data: T) {
  if (typeof window === "undefined") {
    return;
  }

  const payload: StoredEnvelope<T> = {
    data,
    updatedAt: Date.now(),
    version: STORAGE_VERSION
  };

  window.localStorage.setItem(key, JSON.stringify(payload));
}

function readStoredCart() {
  return readStoredValue(
    CART_STORAGE_KEY,
    [] as CartLine[],
    (value): value is CartLine[] => Array.isArray(value) && value.every(isCartLine)
  ).map(normalizeCartLine);
}

function isSubscriptionTitle(variantTitle: string) {
  return variantTitle === "Subscription" || /\s· Subscription$/.test(variantTitle);
}

function getBaseVariantTitle(variantTitle: string) {
  if (!variantTitle || variantTitle === "Subscription") {
    return "";
  }

  return variantTitle.replace(/\s· Subscription$/, "").trim();
}

function hasMeaningfulVariantTitle(variantTitle: string, productTitle: string) {
  return Boolean(variantTitle && variantTitle !== "Default Title" && variantTitle !== productTitle);
}

function getFallbackVariantTitle(productHandle: string) {
  return DEFAULT_PACK_LABELS[productHandle] ?? "";
}

function getDisplayVariantTitle(baseVariantTitle: string, isSubscription: boolean) {
  if (!baseVariantTitle) {
    return isSubscription ? "Subscription" : "";
  }

  return isSubscription ? `${baseVariantTitle} · Subscription` : baseVariantTitle;
}

function normalizeCartLine(line: CartLine): CartLine {
  const rawBaseVariantTitle = line.baseVariantTitle ?? getBaseVariantTitle(line.variantTitle);
  const baseVariantTitle = hasMeaningfulVariantTitle(rawBaseVariantTitle, line.productTitle)
    ? rawBaseVariantTitle
    : getFallbackVariantTitle(line.productHandle);
  const isSubscription = isSubscriptionEligible(line.productHandle)
    ? line.isSubscription ?? isSubscriptionTitle(line.variantTitle)
    : false;
  const basePrice = line.basePrice ?? (isSubscription ? Math.round(line.price / 0.95) : line.price);

  return {
    ...line,
    baseVariantTitle,
    basePrice,
    isSubscription,
    variantTitle: getDisplayVariantTitle(baseVariantTitle, isSubscription),
    price: isSubscription ? Math.round(basePrice * 0.95) : basePrice
  };
}

function readStoredAccount(): AccountProfile {
  return readStoredValue(
    ACCOUNT_STORAGE_KEY,
    { signedIn: false, name: "", email: "" },
    isAccountProfile
  );
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
    writeStoredValue(CART_STORAGE_KEY, lines);
  }, [lines]);

  useEffect(() => {
    writeStoredValue(ACCOUNT_STORAGE_KEY, profile);
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
      const normalizedLine = normalizeCartLine({
        ...line,
        id,
        quantity: safeQuantity
      });

      setLines((current) => {
        const existing = current.find((item) => item.id === id);
        if (!existing) {
          return [...current, normalizedLine];
        }

        const mergedIsSubscription = isSubscriptionEligible(existing.productHandle)
          ? Boolean(existing.isSubscription || normalizedLine.isSubscription)
          : false;
        const basePrice = existing.basePrice ?? normalizedLine.basePrice ?? existing.price;
        const existingBaseVariantTitle = existing.baseVariantTitle ?? getBaseVariantTitle(existing.variantTitle);
        const baseVariantTitle = hasMeaningfulVariantTitle(existingBaseVariantTitle, existing.productTitle)
          ? existingBaseVariantTitle
          : normalizedLine.baseVariantTitle ?? getFallbackVariantTitle(existing.productHandle);

        return current.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity + safeQuantity,
                basePrice,
                baseVariantTitle,
                isSubscription: mergedIsSubscription,
                price: mergedIsSubscription ? Math.round(basePrice * 0.95) : basePrice,
                variantTitle: getDisplayVariantTitle(baseVariantTitle, mergedIsSubscription)
              }
            : item
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
    toggleSubscription: (lineId) => {
      setLines((current) =>
        current.map((line) => {
          if (line.id !== lineId) {
            return line;
          }

          if (!isSubscriptionEligible(line.productHandle)) {
            return line;
          }

          const basePrice = line.basePrice ?? line.price;
          const rawBaseVariantTitle = line.baseVariantTitle ?? getBaseVariantTitle(line.variantTitle);
          const baseVariantTitle = hasMeaningfulVariantTitle(rawBaseVariantTitle, line.productTitle)
            ? rawBaseVariantTitle
            : getFallbackVariantTitle(line.productHandle);
          const isSubscription = !line.isSubscription;

          return {
            ...line,
            basePrice,
            baseVariantTitle,
            isSubscription,
            price: isSubscription ? Math.round(basePrice * 0.95) : basePrice,
            variantTitle: getDisplayVariantTitle(baseVariantTitle, isSubscription)
          };
        })
      );
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
