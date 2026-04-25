import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AccountsProvider } from "@/context/AccountsContext";
import { ProvidersProvider } from "@/context/ProvidersContext";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "GameHub - Multi-Platform Account Manager",
    template: "%s | GameHub",
  },
  description: "Manage your PlayStation, Xbox, and Steam game accounts and credentials with a sleek, modern interface. View purchased games, subscriptions, and account details.",
  keywords: ["PlayStation", "Xbox", "Steam", "account manager", "game hub", "credentials", "multi-platform"],
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%230099ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gamepad-2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="15.5" cy="15.5" r=".5" fill="currentColor"/><circle cx="18.5" cy="12.5" r=".5" fill="currentColor"/><circle cx="15.5" cy="9.5" r=".5" fill="currentColor"/><circle cx="12.5" cy="12.5" r=".5" fill="currentColor"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark")} data-scroll-behavior="smooth">
      <body className={cn(outfit.className, "antialiased bg-[#050505] text-white")}>
        <ProvidersProvider>
          <AccountsProvider>
            {children}
          </AccountsProvider>
        </ProvidersProvider>
      </body>
    </html>
  );
}
