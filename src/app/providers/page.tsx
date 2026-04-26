"use client";

import { useEffect, useMemo, useState } from "react";
import { useProvidersContext } from "@/context/ProvidersContext";
import { Provider } from "@/types/provider";
import ProviderModal from "@/components/ProviderModal";
import Aurora from "@/components/Aurora";
import {
  Search,
  Plus,
  Users,
  Globe,
  MessageCircle,
  Share2,
  Edit3,
  Trash2,
  ChevronLeft,
  Loader2,
  Database,
  ArrowRight,
  Calendar,
  Star,
  MessageSquare,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getStoragePathFromPublicUrl } from "@/lib/storage";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ProvidersPage() {
  const { providers, loading, refetch } = useProvidersContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);
  const [providerToDeleteId, setProviderToDeleteId] = useState<string | null>(null);
  const [deletingProvider, setDeletingProvider] = useState(false);
  const [deleteErrorToast, setDeleteErrorToast] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratingsSummary, setRatingsSummary] = useState<Record<string, { avg: number; count: number }>>({});
  const [reputationCount, setReputationCount] = useState<Record<string, number>>({});
  const [deleteBlockers, setDeleteBlockers] = useState<Record<string, { blocked: boolean; reason?: string }>>({});
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [myRating, setMyRating] = useState(5);
  const [myReview, setMyReview] = useState("");
  const [repTitle, setRepTitle] = useState("");
  const [repBody, setRepBody] = useState("");
  const [repLink, setRepLink] = useState("");
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [communityError, setCommunityError] = useState<string | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user.id || null);
    };
    void loadSession();
  }, []);

  const loadCommunityStats = async () => {
    const [{ data: ratings }, { data: posts }, { data: linkedAccounts }] = await Promise.all([
      supabase.from("provider_ratings").select("provider_id,rating,user_id"),
      supabase.from("provider_reputation_posts").select("provider_id,user_id"),
      supabase.from("accounts").select("provider_id,user_id").not("provider_id", "is", null),
    ]);

    const ratingMap: Record<string, { sum: number; count: number }> = {};
    for (const row of ratings || []) {
      const id = row.provider_id as string;
      ratingMap[id] = ratingMap[id] || { sum: 0, count: 0 };
      ratingMap[id].sum += Number(row.rating);
      ratingMap[id].count += 1;
    }
    const summary: Record<string, { avg: number; count: number }> = {};
    for (const [id, agg] of Object.entries(ratingMap)) {
      summary[id] = { avg: agg.sum / agg.count, count: agg.count };
    }
    setRatingsSummary(summary);

    const postsCount: Record<string, number> = {};
    for (const row of posts || []) {
      const id = row.provider_id as string;
      postsCount[id] = (postsCount[id] || 0) + 1;
    }
    setReputationCount(postsCount);

    const nextBlockers: Record<string, { blocked: boolean; reason?: string }> = {};
    for (const provider of providers) {
      const isOwner = currentUserId && provider.userId === currentUserId;
      if (!isOwner) continue;

      const hasLinkedAccounts = (linkedAccounts || []).some((a) => a.provider_id === provider.id);
      const hasRatingsFromOthers = (ratings || []).some(
        (r) => r.provider_id === provider.id && r.user_id !== currentUserId
      );
      const hasPostsFromOthers = (posts || []).some(
        (p) => p.provider_id === provider.id && p.user_id !== currentUserId
      );

      if (hasLinkedAccounts) {
        nextBlockers[provider.id] = { blocked: true, reason: "Linked to one or more accounts" };
      } else if (hasRatingsFromOthers) {
        nextBlockers[provider.id] = { blocked: true, reason: "Rated by other users" };
      } else if (hasPostsFromOthers) {
        nextBlockers[provider.id] = { blocked: true, reason: "Has reputation posts from other users" };
      } else {
        nextBlockers[provider.id] = { blocked: false };
      }
    }
    setDeleteBlockers(nextBlockers);
  };

  useEffect(() => {
    void loadCommunityStats();
  }, [providers.length, currentUserId]);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [providers, searchQuery]);

  const handleEdit = (provider: Provider) => {
    setEditProvider(provider);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditProvider(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setProviderToDeleteId(id);
  };

  const confirmDeleteProvider = async () => {
    if (!providerToDeleteId) return;
    setDeletingProvider(true);
    try {
      const providerToDelete = providers.find((p) => p.id === providerToDeleteId);
      const photoPath = getStoragePathFromPublicUrl(providerToDelete?.photoUrl, "game-images");
      if (photoPath) {
        const { error: storageError } = await supabase.storage.from("game-images").remove([photoPath]);
        if (storageError) {
          console.warn("Failed to remove provider photo from storage:", storageError.message);
        }
      }

      const { error } = await supabase.from("providers").delete().eq("id", providerToDeleteId);
      if (error) throw error;
      await refetch();
      setProviderToDeleteId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setDeleteErrorToast(message);
      setTimeout(() => setDeleteErrorToast(null), 3000);
    } finally {
      setDeletingProvider(false);
    }
  };

  const openCommunityModal = (provider: Provider) => {
    setSelectedProvider(provider);
    setCommunityError(null);
    setMyRating(5);
    setMyReview("");
    setRepTitle("");
    setRepBody("");
    setRepLink("");
  };

  const saveCommunityFeedback = async () => {
    if (!selectedProvider) return;
    setSavingCommunity(true);
    setCommunityError(null);
    try {
      const ratingPayload = {
        provider_id: selectedProvider.id,
        rating: myRating,
        review: myReview.trim() || null,
      };
      const { error: ratingError } = await supabase
        .from("provider_ratings")
        .upsert(ratingPayload, { onConflict: "provider_id,user_id" });
      if (ratingError) throw ratingError;

      if (repTitle.trim()) {
        const { error: repError } = await supabase.from("provider_reputation_posts").insert({
          provider_id: selectedProvider.id,
          title: repTitle.trim(),
          body: repBody.trim() || null,
          proof_link: repLink.trim() || null,
        });
        if (repError) throw repError;
      }

      await loadCommunityStats();
      setSelectedProvider(null);
    } catch (error) {
      setCommunityError(error instanceof Error ? error.message : "Failed to save feedback");
    } finally {
      setSavingCommunity(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col font-sans selection:bg-ps-accent-blue/30">
      <title>Providers | GameHub</title>
      {/* ── Cinematic Backgrounds ── */}
      <div className="fixed inset-0 z-0">
        <Aurora 
          colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} 
          blend={0.8} 
          amplitude={1.4} 
          speed={0.4} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-[#050505]" />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-50 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-all"
          >
            <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-ps-accent-blue/20 group-hover:border-ps-accent-blue/40 transition-all">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="relative z-20 px-8 pt-4 pb-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ps-accent-blue/10 border border-ps-accent-blue/20 text-ps-accent-blue-light text-[10px] font-black uppercase tracking-[0.3em]">
              <Database size={12} />
              Providers
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">Providers</h1>
              <p className="text-lg text-white/30 font-medium tracking-wide max-w-xl">
                Shared provider directory with ratings and reputation.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="group relative px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] overflow-hidden shadow-[0_20px_60px_rgba(255,255,255,0.2)] hover:scale-[1.05] active:scale-[0.95] transition-all"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-black/5 to-transparent" />
            <span className="relative z-10 flex items-center gap-3">
              <Plus size={20} />
              Add New Provider
            </span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-20 flex-1 px-8 pb-32 max-w-7xl mx-auto w-full flex flex-col">
        {/* Search Bar */}
        <div className="mb-16 relative group">
          <div className="absolute inset-0 bg-linear-to-r from-ps-accent-blue/20 to-ps-accent-end/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-white/20 group-focus-within:text-ps-accent-blue-light transition-colors">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder="Search for a provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] pl-20 pr-8 py-8 text-2xl font-bold outline-none focus:border-ps-accent-blue-light/50 focus:bg-white/10 focus:ring-1 focus:ring-ps-accent-blue-light/20 transition-all shadow-2xl placeholder:text-white/10 tracking-tight"
            />
          </div>
        </div>

        {/* Providers List */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-ps-accent-blue blur-3xl opacity-20 animate-pulse" />
                <Loader2 className="animate-spin text-ps-accent-blue-light relative z-10" size={64} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Loading Providers</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-40 text-center space-y-8 bg-white/5 rounded-[4rem] border border-white/10 border-dashed backdrop-blur-sm">
              <div className="size-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                <Users size={40} className="text-white/10" />
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-black text-white/20 tracking-tighter uppercase">No Providers Found</p>
                <p className="text-xs text-white/10 uppercase tracking-[0.3em] font-bold">Try searching for something else</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                <div className="col-span-4">Provider</div>
                <div className="col-span-2">Rating</div>
                <div className="col-span-2">Reputation</div>
                <div className="col-span-2">Links</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y divide-white/10">
                {filteredProviders.map((p) => (
                  <div key={p.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-white/5 transition-colors">
                    <div className="md:col-span-4 flex items-center gap-4 min-w-0">
                      <div className="size-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <Users size={20} className="text-white/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white truncate">{p.name}</p>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 truncate">
                          Shared Provider
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
                        <Star size={12} />
                        {ratingsSummary[p.id]?.avg ? ratingsSummary[p.id].avg.toFixed(1) : "0.0"} ({ratingsSummary[p.id]?.count || 0})
                      </span>
                    </div>

                    <div className="md:col-span-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-300">
                        <MessageSquare size={12} />
                        {reputationCount[p.id] || 0} posts
                      </span>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                      <SocialButton href={p.website} icon={Globe} label="Web" compact />
                      <SocialButton href={p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}` : ""} icon={MessageCircle} label="WhatsApp" compact />
                      <SocialButton href={p.instagram ? `https://instagram.com/${p.instagram.replace("@", "")}` : ""} icon={Share2} label="Insta" compact />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => openCommunityModal(p)}
                        className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-amber-500/20 hover:border-amber-500/40 transition-all"
                        title="Rate & Reputation"
                      >
                        <Star size={15} />
                      </button>
                      <Link
                        href={`/providers/${p.id}`}
                        className="h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-1.5 px-3 text-[10px] font-black uppercase tracking-[0.16em] text-ps-accent-blue-light hover:text-white hover:bg-ps-accent-blue/30 transition-all"
                        title="Open Reputation Wall"
                      >
                        <MessageSquare size={13} />
                        Wall
                      </Link>
                      {currentUserId && p.userId === currentUserId && (
                        <>
                          <button
                            onClick={() => handleEdit(p)}
                            className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-ps-accent-blue transition-all"
                            title="Edit Provider"
                          >
                            <Edit3 size={15} />
                          </button>
                          {deleteBlockers[p.id]?.blocked ? (
                            <button
                              type="button"
                              disabled
                              className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 cursor-not-allowed"
                              title={`Cannot delete: ${deleteBlockers[p.id]?.reason || "In use"}`}
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="size-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:bg-red-500 transition-all"
                              title="Delete Provider"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {currentUserId && p.userId === currentUserId && deleteBlockers[p.id]?.blocked ? (
                      <p className="md:col-span-12 text-[10px] uppercase tracking-[0.16em] text-amber-300/80">
                        Delete disabled: {deleteBlockers[p.id]?.reason}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProvider(null);
        }}
        initialEditProvider={editProvider}
        onSuccess={refetch}
      />
      {deleteErrorToast && (
        <div className="fixed bottom-6 left-1/2 z-110 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/20 bg-linear-to-r from-red-600 to-red-800 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fadeInUp">
          <span>{deleteErrorToast}</span>
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(providerToDeleteId)}
        title="Delete Provider?"
        message="This provider will be permanently removed from your registry."
        confirmLabel="Delete"
        loading={deletingProvider}
        onCancel={() => !deletingProvider && setProviderToDeleteId(null)}
        onConfirm={confirmDeleteProvider}
      />
      {selectedProvider && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setSelectedProvider(null)} />
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-black/70 backdrop-blur-2xl p-6 space-y-5">
            <h3 className="text-xl font-black text-white">Rate & Reputation: {selectedProvider.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Rating (1-5)</label>
                <input type="number" min={1} max={5} value={myRating} onChange={(e) => setMyRating(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} placeholder="Optional review..." className="w-full min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Reputation Post</label>
                <input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} placeholder="Title (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                <textarea value={repBody} onChange={(e) => setRepBody(e.target.value)} placeholder="Share your experience..." className="w-full min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
                <div className="relative">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={repLink} onChange={(e) => setRepLink(e.target.value)} placeholder="Proof link (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 py-3 text-white" />
                </div>
              </div>
            </div>
            {communityError && <p className="text-red-300 text-sm">{communityError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedProvider(null)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-widest text-white/70">
                Cancel
              </button>
              <button onClick={saveCommunityFeedback} disabled={savingCommunity} className="rounded-xl border border-ps-accent-blue-light/40 bg-linear-to-r from-ps-accent-start to-ps-accent-blue-light px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                {savingCommunity ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialButton({ href, icon: Icon, label, compact = false }: { href?: string | null; icon: React.ElementType; label: string; compact?: boolean }) {
  if (!href) return (
    <div className={compact ? "opacity-25 cursor-not-allowed" : "flex flex-col items-center gap-2 opacity-10 cursor-not-allowed group/btn"}>
      <div className={compact ? "size-8 rounded-xl bg-white/5 flex items-center justify-center" : "size-12 rounded-2xl bg-white/5 flex items-center justify-center"}>
        <Icon size={compact ? 14 : 20} />
      </div>
      {!compact ? <span className="text-[8px] font-black uppercase tracking-widest">{label}</span> : null}
    </div>
  );

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={compact ? "size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-ps-accent-blue/20 hover:border-ps-accent-blue/40 transition-all" : "flex flex-col items-center gap-2 group/btn hover:scale-110 transition-all duration-300"}
      title={label}
    >
      {compact ? (
        <Icon size={14} />
      ) : (
        <>
          <div className="size-12 rounded-2xl bg-white/5 group-hover/btn:bg-ps-accent-blue/20 border border-white/5 group-hover/btn:border-ps-accent-blue/40 flex items-center justify-center text-white/40 group-hover/btn:text-ps-accent-blue-light transition-all">
            <Icon size={20} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover/btn:text-white transition-colors">{label}</span>
        </>
      )}
    </a>
  );
}
