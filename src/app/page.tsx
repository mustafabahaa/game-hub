"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAccountsContext } from "@/context/AccountsContext";
import { useProvidersContext } from "@/context/ProvidersContext";
import AccountCard from "@/components/AccountCard";
import AccountDetailModal from "@/components/AccountDetailModal";
import { supabase } from "@/lib/supabase";
import { getStoragePathFromPublicUrl } from "@/lib/storage";
import Aurora from "@/components/Aurora";
import SplashCursor from "@/components/SplashCursor";
import SplitText from "@/components/SplitText";
import AccountModal from "@/components/AccountModal";
import ProviderModal from "@/components/ProviderModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Account } from "@/types/account";
import {
  Gamepad2,
  Crown,
  Search,
  CircleAlert,
  LogOut,
  Loader2,
  Plus,
  Database,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";

// Types for filtering and state management
// Moved inline to activeFilter state if needed or kept if useful elsewhere

export default function DashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("User");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [initialAccountData, setInitialAccountData] = useState<Partial<Account> | null>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteErrorToast, setDeleteErrorToast] = useState<string | null>(null);

  const openAccountModal = (account?: Account, data?: Partial<Account>) => {
    setEditingAccount(account || null);
    setInitialAccountData(data || null);
    setIsAccountModalOpen(true);
    setIsFabMenuOpen(false);
  };

  const openDetailModal = (account: Account) => {
    setSelectedAccount(account);
    setDetailModalOpen(true);
  };

  const closeAccountModal = () => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setInitialAccountData(null);
  };

  const closeProviderModal = () => {
    setIsProviderModalOpen(false);
  };

  const ensurePublicProfile = async (userId: string, fallbackName: string) => {
    const normalized = (fallbackName || "player").toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 24) || "player";
    const suffix = userId.replace(/-/g, "").slice(0, 6);
    const username = `${normalized}_${suffix}`;
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: userId,
        username,
        display_name: fallbackName || "Player",
      },
      { onConflict: "user_id" }
    );
    if (error) {
      console.warn("Unable to upsert public profile:", error.message);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccountToDeleteId(id);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDeleteId) return;
    setDeletingAccount(true);
    try {
      const accountToDelete = accounts.find((a) => a.id === accountToDeleteId);
      const gameImagePaths = (accountToDelete?.games || [])
        .map((g) => getStoragePathFromPublicUrl(g.imageUrl, "game-images"))
        .filter((path): path is string => Boolean(path));

      if (gameImagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("game-images")
          .remove(gameImagePaths);
        if (storageError) {
          console.warn("Failed to remove some game images from storage:", storageError.message);
        }
      }

      const { error } = await supabase.from("accounts").delete().eq("id", accountToDeleteId);
      if (error) throw error;
      await refetch();
      setAccountToDeleteId(null);
    } catch (err) {
      console.error(err);
      setDeleteErrorToast("Failed to delete account");
      setTimeout(() => setDeleteErrorToast(null), 3000);
    } finally {
      setDeletingAccount(false);
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
        const resolvedName = session.user.user_metadata?.full_name || "Player";
        setUserName(resolvedName);
        await ensurePublicProfile(session.user.id, resolvedName);
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
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const { accounts, loading: accountsLoading, error: accountsError, refetch } = useAccountsContext();
  const { providers, loading: providersLoading } = useProvidersContext();
  const loading = accountsLoading || providersLoading || authLoading;
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const filteredAccounts = useMemo(() => {
    let result = accounts;
    if (activeFilter !== "all") {
      result = result.filter((a) => a.platform === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.accountName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.games && a.games.some(g => g.title.toLowerCase().includes(q)))
      );
    }

    return [...result].sort((a, b) =>
      sortOrder === "newest"
        ? b.createdAt - a.createdAt
        : a.createdAt - b.createdAt
    );
  }, [accounts, activeFilter, searchQuery, sortOrder]);



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
      <div className="fixed inset-0 bg-linear-to-b from-black/20 via-transparent to-black/80 z-0 pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-50 w-full pt-8 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Gamepad2 size={24} className="text-ps-accent-end" />
                <h1 className="text-xl font-black text-white tracking-widest drop-shadow-md uppercase">GameHub</h1>
              </div>
                <Link
                  href="/community"
                  className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Gamepad2 size={14} className="text-ps-accent-blue-light" />
                  Community
                </Link>
                <Link
                  href="/providers"
                  className="hidden md:flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Database size={14} className="text-ps-accent-blue-light" />
                  Providers
                </Link>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center hover:scale-105 active:scale-95 transition-transform duration-300"
              >
                <div className="size-10 rounded-full bg-linear-to-tr from-ps-accent-end to-ps-accent-start shadow-[0_0_20px_rgba(0,112,209,0.3)] flex items-center justify-center text-sm font-bold text-white">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-4 w-56 rounded-2xl p-2 shadow-[0_10px_50px_rgba(0,0,0,0.8)] bg-black/80 backdrop-blur-3xl border border-white/5 animate-fadeInUp">
                  <div className="px-4 py-3 border-b border-white/5 mb-2">
                    <p className="text-sm font-bold text-white truncate">{userName}</p>
                    <p className="text-xs text-white/50 truncate">{userEmail}</p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Logout
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
            text="The Account Hub"
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

        {/* Search + Filters */}
        <div className="flex flex-col gap-6 mb-12">
          <div className="relative w-full">
            <div className="relative flex items-center gap-3 rounded-[2rem] p-5">
              <Search
                size={22}
                className="text-white/40"
              />
              <input
                type="text"
                placeholder="Search accounts, email, or games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none focus:outline-none focus-visible:outline-none ring-0 text-white font-semibold placeholder:text-white/30 text-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex flex-wrap items-center gap-3 bg-black/30 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              {[
                { id: "all", label: "All" },
                { id: "PlayStation", label: "PS" },
                { id: "Xbox", label: "Xbox" },
                { id: "PC", label: "PC" }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveFilter(p.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.22em] transition-all duration-500 ${activeFilter === p.id ? "bg-white/10 text-white shadow-xl scale-105" : "text-white/30 hover:text-white/70 hover:bg-white/5"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-full bg-black/40 border border-white/10 px-3 py-2 shadow-2xl text-white/60">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sort</span>
              <button
                type="button"
                onClick={() => setSortOrder("newest")}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase transition-all duration-300 ${sortOrder === "newest" ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white hover:bg-white/5"}`}
              >
                <ArrowDown size={14} />
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSortOrder("oldest")}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold uppercase transition-all duration-300 ${sortOrder === "oldest" ? "bg-white/10 text-white shadow-xl" : "text-white/30 hover:text-white hover:bg-white/5"}`}
              >
                <ArrowUp size={14} />
                Oldest
              </button>
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
            <CircleAlert size={20} />
            <span className="text-sm">{accountsError}</span>
          </div>
        )}

        {/* ── Main Feed ── */}
        {!loading && filteredAccounts.length > 0 && (
          <div className="grid auto-rows-min grid-cols-2 items-start gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5">
            {filteredAccounts.map((account, i) => (
              <AccountCard
                key={account.id}
                account={account}
                index={i}
                provider={providers.find((p) => p.id === account.providerId)}
                onEdit={(acc) => openAccountModal(acc)}
                onDelete={handleDeleteAccount}
                onViewDetails={openDetailModal}
              />
            ))}
          </div>
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div className="relative min-h-[400px] flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-zinc-900/10 backdrop-blur-sm p-12 text-center group">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-ps-accent-end blur-[60px] opacity-5" />
              <div className="size-24 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                {activeFilter === "psplus" ? (
                  <Crown size={40} className="text-[#FFD700] opacity-50" />
                ) : (
                  <Gamepad2 size={40} className="text-white/20" />
                )}
              </div>
            </div>

            <h3 className="text-2xl font-black text-white/90 mb-3 tracking-tight uppercase">
              {searchQuery ? "No Matches" : "Account Hub Empty"}
            </h3>
            <p className="text-white/30 max-w-xs mx-auto text-xs/relaxed font-bold uppercase tracking-[0.2em] mb-10">
              {searchQuery
                ? `No records found for "${searchQuery}"`
                : "Start adding accounts to your collection."}
            </p>
          </div>
        )}
        <AccountDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        account={selectedAccount}
      />
    </main>

      {/* ── Fixed FAB with Menu ── */}
      <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-90 flex flex-col items-end gap-4">
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
                className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-ps-accent-end/20 shadow-lg border border-white/10 transition-all">
                  <Gamepad2 size={20} className="text-ps-accent-blue-light group-hover:text-ps-accent-end" />
                </div>
                <span>New Account</span>
              </button>
              
              <Link
                href="/providers"
                className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-ps-accent-blue transition-all duration-300 group shadow-lg"
              >
                <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-black/20 shadow-lg border border-white/10 group-hover:border-black/10">
                  <Database size={20} className="text-ps-accent-blue-light group-hover:text-white transition-colors" />
                </div>
                <span>Providers</span>
              </Link>
            </div>
          )}

          <button
            id="fab-button"
            onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className={`group relative size-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(0,102,255,0.4)] hover:scale-110 active:scale-95 ${isFabMenuOpen ? "rotate-135" : ""}`}
            title="Access Vault Control"
          >
            <div className="absolute inset-0 rounded-[1.5rem] bg-linear-to-br from-ps-accent-start to-ps-accent-blue-light animate-pulse opacity-40 blur-xl" />
            <div className="absolute -inset-px rounded-[1.5rem] bg-linear-to-br from-ps-accent-start to-ps-accent-blue-light z-0 opacity-90 shadow-[0_0_30px_rgba(0,102,255,0.5)]" />
            <div className="absolute inset-[2.5px] rounded-[1.35rem] bg-[#050505] z-10" />
            <Plus size={24} className={`relative z-20 text-white transition-transform duration-500 ${isFabMenuOpen ? "rotate-45" : ""}`} />
          </button>
        </div>

      <>
          <AccountModal
            isOpen={isAccountModalOpen}
            onClose={closeAccountModal}
            initialEditAccount={editingAccount}
            initialData={initialAccountData}
          />
          <ProviderModal
            isOpen={isProviderModalOpen}
            onClose={closeProviderModal}
          />
        </>
      {deleteErrorToast && (
        <div className="fixed bottom-6 left-1/2 z-110 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/20 bg-linear-to-r from-red-600 to-red-800 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeInUp">
          <CircleAlert size={16} className="drop-shadow-md" />
          {deleteErrorToast}
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(accountToDeleteId)}
        title="Delete Vault Entry?"
        message="This account will be locked and permanently removed."
        confirmLabel="Delete"
        loading={deletingAccount}
        onCancel={() => !deletingAccount && setAccountToDeleteId(null)}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  );
}
