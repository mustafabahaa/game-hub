"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountsContext } from "@/context/AccountsContext";
import { useProvidersContext } from "@/context/ProvidersContext";
import GameCard from "@/components/GameCard";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import SplashCursor from "@/components/SplashCursor";
import SplitText from "@/components/SplitText";
import AccountModal from "@/components/AccountModal";
import ProviderModal from "@/components/ProviderModal";
import { Account } from "@/types/account";
import {
  Gamepad2,
  Crown,
  Search,
  Layers,
  AlertCircle,
  Settings,
  LogOut,
  Loader2,
  Plus,
  Users,
  Database,
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

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const openAccountModal = (account?: Account) => {
    setEditAccount(account || null);
    setIsAccountModalOpen(true);
    setIsFabMenuOpen(false);
  };

  const openProviderModal = () => {
    setIsProviderModalOpen(true);
    setIsFabMenuOpen(false);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setEditAccount(null);
  };

  const closeProviderModal = () => {
    setIsProviderModalOpen(false);
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to lock and delete this vault entry?")) return;
    try {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      // Optionally use a toast instead of alert
    } catch (err) {
      console.error(err);
      alert("Failed to delete account");
    }
  };

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

  const { accounts, loading: accountsLoading, error: accountsError } = useAccountsContext();
  const { providers, loading: providersLoading } = useProvidersContext();
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
      // Also handle FAB menu close
      const fabMenu = document.getElementById("fab-menu");
      const fabButton = document.getElementById("fab-button");
      if (fabMenu && !fabMenu.contains(event.target as Node) && fabButton && !fabButton.contains(event.target as Node)) {
        setIsFabMenuOpen(false);
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
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Gamepad2 size={24} className="text-[#00d2ff]" />
                <h1 className="text-xl font-black text-white tracking-widest drop-shadow-md uppercase">GameHub</h1>
              </div>

              {isAdmin && (
                <Link 
                  href="/providers"
                  className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Database size={14} className="text-[#0099ff]" />
                  Manage Providers
                </Link>
              )}
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

                  {/* Dialog buttons removed from here as per user request */}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Lock Vault
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

        {/* Tabs + Search + Add Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">

          <div className="flex items-center gap-4">
            {/* Elegant Pill Tabs */}
            <div className="flex p-1.5 rounded-[2rem] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
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
          </div>

          <div className="relative group w-full md:w-96">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0044ff]/20 to-[#00d2ff]/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full overflow-hidden shadow-2xl transition-all duration-300 group-focus-within:border-[#00d2ff]/50 group-focus-within:bg-black/60">
              <Search
                size={20}
                className="ml-5 text-white/40 group-focus-within:text-[#00d2ff] transition-colors"
              />
              <input
                type="text"
                placeholder="Search the vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-6 py-4 bg-transparent outline-none text-white font-medium placeholder:text-white/20 text-base"
              />
            </div>
          </div>
        </div>

        {accountsError && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl mb-6"
            style={{
              background: "rgba(229,62,62,0.1)",
              border: "1px solid rgba(229,62,62,0.3)",
              color: "var(--color-ps-danger)",
            }}
          >
            <AlertCircle size={20} />
            <span className="text-sm">{accountsError}</span>
          </div>
        )}

        {/* ── Main Feed ── */}
        {!loading && filteredAccounts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredAccounts.map((account, i) => (
              <GameCard 
                key={account.id} 
                account={account} 
                index={i} 
                provider={providers.find((p) => p.id === account.providerId)}
                isAdmin={isAdmin}
                onEdit={(acc) => openAccountModal(acc)}
                onDelete={handleDeleteAccount}
              />
            ))}
          </div>
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div className="relative min-h-[400px] flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-zinc-900/10 backdrop-blur-sm p-12 text-center group">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-[#00d2ff] blur-[60px] opacity-5" />
              <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                {activeTab === "psplus" ? (
                  <Crown size={40} className="text-[#FFD700] opacity-50" />
                ) : (
                  <Gamepad2 size={40} className="text-white/20" />
                )}
              </div>
            </div>

            <h3 className="text-2xl font-black text-white/90 mb-3 tracking-tight uppercase">
              {searchQuery ? "No Matches" : "Vault Offline"}
            </h3>
            <p className="text-white/30 max-w-xs mx-auto text-xs font-bold uppercase tracking-[0.2em] leading-relaxed mb-10">
              {searchQuery
                ? `No records found for "${searchQuery}"`
                : "Start adding games to your collection."}
            </p>

            {/* Dialog button removed from empty state */}
          </div>
        )}
      </main>

      {/* ── Fixed FAB for Admin with Menu ── */}
      {isAdmin && (
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col items-end gap-4">
          {isFabMenuOpen && (
            <div 
              id="fab-menu"
              className="absolute bottom-24 right-0 mb-4 bg-black/60 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] flex flex-col gap-2 min-w-[240px] shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-fadeInUp"
            >
              <button
                onClick={() => {
                  openAccountModal();
                  setIsFabMenuOpen(false);
                }}
                className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#0066ff] transition-all duration-300 group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-black/20 shadow-lg border border-white/10 group-hover:border-black/10">
                  <Gamepad2 size={20} className="text-[#0099ff] group-hover:text-white transition-colors" />
                </div>
                <span>New Game</span>
              </button>
              <Link
                href="/providers"
                className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-[#0066ff] transition-all duration-300 group shadow-lg"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-black/20 shadow-lg border border-white/10 group-hover:border-black/10">
                  <Database size={20} className="text-[#0099ff] group-hover:text-white transition-colors" />
                </div>
                <span>Manage Providers</span>
              </Link>
            </div>
          )}
          
          <button
            id="fab-button"
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`group relative w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,102,255,0.4)] hover:scale-110 active:scale-95 ${isFabMenuOpen ? "rotate-[135deg]" : ""}`}
            title="Access Vault Control"
          >
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-[#0044ff] to-[#0099ff] animate-pulse opacity-40 blur-xl" />
            <div className="absolute -inset-[1px] rounded-[1.5rem] bg-gradient-to-br from-[#0044ff] to-[#0099ff] z-0 opacity-90 shadow-[0_0_30px_rgba(0,102,255,0.5)]" />
            <div className="absolute inset-[2.5px] rounded-[1.35rem] bg-[#050505] z-10" />
            <Plus size={32} className="text-white relative z-20 transition-transform duration-500 drop-shadow-[0_0_8px_rgba(0,102,255,0.8)]" />
          </button>
        </div>
      )}

      {isAdmin && (
        <>
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={closeAccountModal}
            initialEditAccount={editAccount}
          />
          <ProviderModal
            isOpen={isProviderModalOpen}
            onClose={closeProviderModal}
          />
        </>
      )}
    </div>
  );
}
