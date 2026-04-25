import type { Metadata } from "next";
import { Outfit, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AccountsProvider } from "@/context/AccountsContext";
import { ProvidersProvider } from "@/context/ProvidersContext";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GameHub - PS5 Account Manager",
  description: "Manage your PS5 game accounts and credentials with a sleek, modern interface. View purchased games, PS Plus subscriptions, and account details.",
  keywords: ["PS5", "PlayStation", "account manager", "game hub", "credentials"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", outfit.variable)}>
      <body className="font-outfit antialiased bg-[#050505] text-white">
        <ProvidersProvider>
          <AccountsProvider>
            {children}
          </AccountsProvider>
        </ProvidersProvider>
      </body>
    </html>
  );
}
