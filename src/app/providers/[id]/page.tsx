"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Aurora from "@/components/Aurora";
import { supabase } from "@/lib/supabase";
import { ChevronLeft, Loader2, MessageSquare, Star } from "lucide-react";

interface ProviderDetails {
  id: string;
  user_id?: string;
  name: string;
  website?: string;
  whatsapp?: string;
  instagram?: string;
  photo_url?: string;
  notes?: string;
}

interface RatingRow {
  id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

interface ReputationRow {
  id: string;
  provider_id: string;
  user_id: string;
  title: string;
  body?: string;
  proof_link?: string;
  created_at: string;
}

export default function ProviderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const providerId = params?.id;

  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [posts, setPosts] = useState<ReputationRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});

  const [myRating, setMyRating] = useState(5);
  const [myReview, setMyReview] = useState("");
  const [repTitle, setRepTitle] = useState("");
  const [repBody, setRepBody] = useState("");
  const [repLink, setRepLink] = useState("");

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);
    const [{ data: authData }, { data: providerData, error: providerError }, { data: ratingData }, { data: postData }] =
      await Promise.all([
        supabase.auth.getSession(),
        supabase.from("providers").select("*").eq("id", providerId).maybeSingle(),
        supabase.from("provider_ratings").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }),
        supabase.from("provider_reputation_posts").select("*").eq("provider_id", providerId).order("created_at", { ascending: false }),
      ]);

    if (providerError || !providerData) {
      setError("Provider not found");
      setLoading(false);
      return;
    }

    setCurrentUserId(authData.session?.user.id || null);
    setProvider(providerData as ProviderDetails);
    setRatings((ratingData || []) as RatingRow[]);
    setPosts((postData || []) as ReputationRow[]);

    const userIds = Array.from(
      new Set([...(ratingData || []).map((r) => r.user_id), ...(postData || []).map((p) => p.user_id)])
    );
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("user_id,display_name,username")
        .in("user_id", userIds);
      const names: Record<string, string> = {};
      for (const profile of profileData || []) {
        names[profile.user_id] = profile.display_name || profile.username || "Player";
      }
      setAuthorNames(names);
    }

    const mine = (ratingData || []).find((r) => r.user_id === authData.session?.user.id) as RatingRow | undefined;
    if (mine) {
      setMyRating(mine.rating);
      setMyReview(mine.review || "");
    }

    setLoading(false);
  }, [providerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ratingSummary = useMemo(() => {
    if (ratings.length === 0) return { avg: 0, count: 0 };
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return { avg: sum / ratings.length, count: ratings.length };
  }, [ratings]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const saveFeedback = async () => {
    if (!providerId) return;
    setSaving(true);
    setError(null);
    try {
      const { error: ratingError } = await supabase
        .from("provider_ratings")
        .upsert({ provider_id: providerId, rating: myRating, review: myReview.trim() || null }, { onConflict: "provider_id,user_id" });
      if (ratingError) throw ratingError;

      if (repTitle.trim()) {
        const { error: postError } = await supabase.from("provider_reputation_posts").insert({
          provider_id: providerId,
          title: repTitle.trim(),
          body: repBody.trim() || null,
          proof_link: repLink.trim() || null,
        });
        if (postError) throw postError;
      }

      setRepTitle("");
      setRepBody("");
      setRepLink("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <Loader2 size={42} className="animate-spin text-ps-accent-blue-light" />
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <p className="text-white/70">{error || "Not found"}</p>
        <button onClick={() => router.push("/providers")} className="px-4 py-2 rounded-lg border border-white/20 text-white/80">
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.8} amplitude={1.1} speed={0.4} />
        <div className="absolute inset-0 bg-black/45 mix-blend-overlay" />
      </div>

      <nav className="relative z-20 p-8">
        <Link href="/providers" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-all">
          <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-ps-accent-blue/20">
            <ChevronLeft size={16} />
          </div>
          Back to Providers
        </Link>
      </nav>

      <main className="relative z-20 max-w-6xl mx-auto px-8 pb-20 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-3xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center">
              {provider.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={provider.photo_url} alt={provider.name} className="size-full object-cover" />
              ) : (
                <span className="text-xl font-black text-white/50">{provider.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-black">{provider.name}</h1>
              <p className="mt-1 text-sm text-white/60">
                Rating: {ratingSummary.avg.toFixed(1)} / 5 ({ratingSummary.count} reviews)
              </p>
            </div>
          </div>
          {provider.notes ? <p className="mt-4 text-white/70">{provider.notes}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-2xl p-6 space-y-4">
          <h2 className="text-lg font-black uppercase tracking-[0.2em] text-white/70">Rate this provider</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Your rating</label>
              <input type="number" min={1} max={5} value={myRating} onChange={(e) => setMyRating(Math.min(5, Math.max(1, Number(e.target.value) || 1)))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} placeholder="Write review..." className="w-full min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Reputation wall post</label>
              <input value={repTitle} onChange={(e) => setRepTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              <textarea value={repBody} onChange={(e) => setRepBody(e.target.value)} placeholder="Experience details..." className="w-full min-h-24 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
              <input value={repLink} onChange={(e) => setRepLink(e.target.value)} placeholder="Proof link (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveFeedback} disabled={saving || !currentUserId} className="rounded-xl border border-ps-accent-blue-light/40 bg-linear-to-r from-ps-accent-start to-ps-accent-blue-light px-4 py-2 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {error ? <p className="text-red-300 text-sm">{error}</p> : null}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black uppercase tracking-[0.2em] text-white/70">
            <Star size={16} /> Ratings
          </h2>
          <div className="space-y-3">
            {ratings.length === 0 ? (
              <p className="text-white/40 text-sm">No ratings yet.</p>
            ) : (
              ratings.map((r) => (
                <article key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-amber-300">{r.rating}/5</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {authorNames[r.user_id] || "Player"} - {formatDate(r.created_at)}
                    </p>
                  </div>
                  {r.review ? <p className="text-sm text-white/70 mt-1">{r.review}</p> : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/60 backdrop-blur-2xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black uppercase tracking-[0.2em] text-white/70">
            <MessageSquare size={16} /> Reputation Wall
          </h2>
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="text-white/40 text-sm">No reputation posts yet.</p>
            ) : (
              posts.map((p) => (
                <article key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-white">{p.title}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                      {authorNames[p.user_id] || "Player"} - {formatDate(p.created_at)}
                    </p>
                  </div>
                  {p.body ? <p className="text-sm/relaxed text-white/75">{p.body}</p> : null}
                  {p.proof_link ? (
                    <a href={p.proof_link} target="_blank" rel="noreferrer" className="text-xs text-ps-accent-blue-light underline mt-2 inline-block">
                      Open proof link
                    </a>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
