"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/useAccounts";
import { useProviders } from "@/hooks/useProviders";
import GameCard from "@/components/GameCard";
import SkeletonCard from "@/components/SkeletonCard";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import SplashCursor from "@/components/SplashCursor";
import SplitText from "@/components/SplitText";
import {
  Gamepad2,
  Crown,
  Search,
  Layers,
  AlertCircle,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type Tab = "all" | "psplus";

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || "Player");
        if (session.user.user_metadata?.role === "admin") {
          setIsAdmin(true);
        }
      }
      setAuthLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name || "Player");
        if (session.user.user_metadata?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const { accounts, loading: accountsLoading, error } = useAccounts();
  const { providers, loading: providersLoading } = useProviders();
  const loading = accountsLoading || providersLoading || authLoading;
  
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

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ps-bg-primary)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-ps-accent-blue)" }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen relative bg-[#050505] overflow-hidden">
      
      {/* ── Global Cinematic Backgrounds ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora 
          colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]}
          blend={0.6}
          amplitude={1.2}
          speed={0.5}
        />
        <SplashCursor BACK_COLOR={{ r: 0, g: 0, b: 0 }} TRANSPARENT={true} />
      </div>
      
      {/* Subtle overlay for contrast */}
      <div className="fixed inset-0 bg-black/50 z-0 mix-blend-overlay pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-0 pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-50 w-full pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 size={24} className="text-[#00d2ff]" />
              <h1 className="text-xl font-black text-white tracking-widest drop-shadow-md uppercase">GameHub</h1>
            </div>
            
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center hover:scale-105 active:scale-95 transition-transform duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#00d2ff] to-[#0044ff] shadow-[0_0_20px_rgba(0,112,209,0.3)] flex items-center justify-center text-sm font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-56 rounded-2xl p-2 shadow-[0_10px_50px_rgba(0,0,0,0.8)] bg-black/80 backdrop-blur-3xl border border-white/5 animate-fadeInUp">
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-xs text-white/50 truncate">{userEmail}</p>
                  </div>
                  
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/5 transition-colors mb-1 group"
                    >
                      <Settings size={16} className="text-[#00d2ff] group-hover:rotate-90 transition-transform duration-500" />
                      Settings
                    </Link>
                  )}
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero / Top Section ── */}
      <div className="relative pt-16 pb-24 overflow-hidden mb-8 z-10">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SplitText
            text="The Ultimate Vault"
            className="text-5xl sm:text-6xl md:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-[0_10px_30px_rgba(0,112,209,0.3)] inline-block"
            delay={40}
            from={{ opacity: 0, transform: 'translate3d(0, 50px, 0)' }}
            to={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
            ease="power4.out"
          />
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-medium drop-shadow-md animate-fadeInUp tracking-wide" style={{ animationDelay: "1s" }}>
            All your credentials. All your platforms. One unified interface.
          </p>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 relative z-20">
        
        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          
          {/* Elegant Pill Tabs */}
          <div className="flex p-1.5 rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/5 shadow-2xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 overflow-hidden ${activeTab === "all" ? "text-white" : "text-white/40 hover:text-white/70"}`}
            >
              {activeTab === "all" && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#0044ff] to-[#00d2ff] rounded-full shadow-[0_0_20px_rgba(0,112,209,0.4)]" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Layers size={18} /> All Games
                <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs ${activeTab === "all" ? "bg-white/20" : "bg-white/10"}`}>
                  {accounts.length}
                </span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab("psplus")}
              className={`relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 overflow-hidden ${activeTab === "psplus" ? "text-[#1a1a00]" : "text-white/40 hover:text-white/70"}`}
            >
              {activeTab === "psplus" && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full shadow-[0_0_20px_rgba(255,215,0,0.4)]" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Crown size={18} /> PS Plus
                <span className={`ml-1 px-2.5 py-0.5 rounded-full text-xs ${activeTab === "psplus" ? "bg-black/20" : "bg-white/10"}`}>
                  {psPlusCount}
                </span>
              </span>
            </button>
          </div>

          {/* Elegant Search Bar */}
          <div className="relative group w-full md:w-80">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#00d2ff] transition-colors"
            />
            <input
              type="text"
              placeholder="Search vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-full text-sm transition-all duration-300 outline-none placeholder:text-white/30 focus:border-[#00d2ff]/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(0,112,209,0.2)] bg-black/40 backdrop-blur-2xl border border-white/5 text-white font-medium shadow-2xl"
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

    </div>
  );
}
