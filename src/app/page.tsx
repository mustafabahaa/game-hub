"use client";

import { useState, useMemo } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { useProviders } from "@/hooks/useProviders";
import GameCard from "@/components/GameCard";
import SkeletonCard from "@/components/SkeletonCard";
import {
  Gamepad2,
  Crown,
  Search,
  Layers,
  AlertCircle,
  Settings,
} from "lucide-react";
import Link from "next/link";

type Tab = "all" | "psplus";

export default function DashboardPage() {
  const { accounts, loading: accountsLoading, error } = useAccounts();
  const { providers, loading: providersLoading } = useProviders();
  const loading = accountsLoading || providersLoading;
  
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAccounts = useMemo(() => {
    let result = accounts;
    if (activeTab === "psplus") {
      result = result.filter((a) => a.isPsPlus);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.gameTitle.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [accounts, activeTab, searchQuery]);

  const psPlusCount = useMemo(
    () => accounts.filter((a) => a.isPsPlus).length,
    [accounts]
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ps-bg-primary)" }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 glass"
        style={{ borderBottom: "1px solid var(--color-ps-border)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, var(--color-ps-accent-start), var(--color-ps-accent-end))",
                }}
              >
                <Gamepad2 size={22} color="#fff" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">GameHub</h1>
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--color-ps-text-muted)" }}
                >
                  Credentials Manager
                </p>
              </div>
            </div>
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "var(--color-ps-bg-elevated)",
                color: "var(--color-ps-text-secondary)",
                border: "1px solid var(--color-ps-border)",
              }}
            >
              <Settings size={16} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: "var(--color-ps-bg-secondary)", border: "1px solid var(--color-ps-border)" }}
          >
            <button
              onClick={() => setActiveTab("all")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer"
              style={{
                background:
                  activeTab === "all"
                    ? "linear-gradient(135deg, var(--color-ps-accent-start), var(--color-ps-accent-end))"
                    : "transparent",
                color: activeTab === "all" ? "#fff" : "var(--color-ps-text-muted)",
              }}
            >
              <Layers size={16} />
              All Games
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: activeTab === "all" ? "rgba(255,255,255,0.2)" : "var(--color-ps-bg-elevated)",
                }}
              >
                {accounts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("psplus")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer"
              style={{
                background:
                  activeTab === "psplus"
                    ? "linear-gradient(135deg, var(--color-ps-plus-gold), var(--color-ps-plus-gold-light))"
                    : "transparent",
                color: activeTab === "psplus" ? "#1a1a00" : "var(--color-ps-text-muted)",
              }}
            >
              <Crown size={16} />
              PS Plus
              <span
                className="ml-1 px-2 py-0.5 rounded-full text-xs"
                style={{
                  background: activeTab === "psplus" ? "rgba(0,0,0,0.2)" : "var(--color-ps-bg-elevated)",
                }}
              >
                {psPlusCount}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--color-ps-text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-300"
              style={{
                background: "var(--color-ps-bg-secondary)",
                border: "1px solid var(--color-ps-border)",
                color: "var(--color-ps-text-primary)",
              }}
            />
          </div>
        </div>

        {error && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl mb-6"
            style={{
              background: "rgba(229,62,62,0.1)",
              border: "1px solid rgba(229,62,62,0.3)",
              color: "var(--color-ps-danger)",
            }}
          >
            <AlertCircle size={20} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && filteredAccounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredAccounts.map((account, i) => (
              <GameCard 
                key={account.id} 
                account={account} 
                index={i} 
                provider={providers.find((p) => p.id === account.providerId)}
              />
            ))}
          </div>
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "var(--color-ps-bg-secondary)", border: "1px solid var(--color-ps-border)" }}
            >
              {activeTab === "psplus" ? (
                <Crown size={36} style={{ color: "var(--color-ps-text-muted)" }} />
              ) : (
                <Gamepad2 size={36} style={{ color: "var(--color-ps-text-muted)" }} />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-ps-text-secondary)" }}>
              {searchQuery ? "No results found" : activeTab === "psplus" ? "No PS Plus accounts" : "No accounts yet"}
            </h3>
            <p className="text-sm" style={{ color: "var(--color-ps-text-muted)" }}>
              {searchQuery ? "Try a different search term." : "Add accounts from the admin panel to get started."}
            </p>
          </div>
        )}
      </main>

      <footer
        className="mt-12 py-6 text-center text-xs"
        style={{ borderTop: "1px solid var(--color-ps-border)", color: "var(--color-ps-text-muted)" }}
      >
        <p>GameHub &copy; {new Date().getFullYear()} &mdash; PS5 Account Manager</p>
      </footer>
    </div>
  );
}
