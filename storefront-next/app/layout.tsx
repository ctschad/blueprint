import type { Metadata } from "next";
import { CartDrawer } from "@/components/cart-drawer";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { StorefrontProvider } from "@/components/storefront-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Blueprint",
    template: "%s | Blueprint"
  },
  description: "Science-backed longevity products, protocols, and journal content from Blueprint."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StorefrontProvider>
          <div className="site-shell">
            <Header />
            <CartDrawer />
            <main className="site-main">{children}</main>
            <Footer />
          </div>
        </StorefrontProvider>
      </body>
    </html>
  );
}
