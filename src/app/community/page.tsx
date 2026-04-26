"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import { ChevronLeft, Gamepad2, Loader2, Search, Users } from "lucide-react";

interface PublicGameRow {
  game_id: string;
  game_title: string;
  game_image_url: string | null;
  game_created_at: string;
  platform: "PlayStation" | "Xbox" | "PC";
  owner_user_id: string;
  owner_username: string;
  owner_avatar_url: string | null;
  owner_bio: string | null;
}

interface CommunityProfile {
  userId: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  games: Array<{
    id: string;
    title: string;
    imageUrl?: string;
    platform: "PlayStation" | "Xbox" | "PC";
  }>;
}

export default function CommunityPage() {
  const GAMES_PREVIEW_LIMIT = 5;
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedProfiles, setExpandedProfiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadCommunity = async () => {
      const { data, error } = await supabase
        .from("public_user_games")
        .select("*")
        .order("game_created_at", { ascending: false });

      if (error) {
        console.error("Failed to load community feed:", error);
        setProfiles([]);
        setLoading(false);
        return;
      }

      const grouped = new Map<string, CommunityProfile>();
      for (const row of (data || []) as PublicGameRow[]) {
        const existing = grouped.get(row.owner_user_id);
        if (existing) {
          existing.games.push({
            id: row.game_id,
            title: row.game_title,
            imageUrl: row.game_image_url || undefined,
            platform: row.platform,
          });
          continue;
        }

        grouped.set(row.owner_user_id, {
          userId: row.owner_user_id,
          username: row.owner_username,
          avatarUrl: row.owner_avatar_url || undefined,
          bio: row.owner_bio || undefined,
          games: [
            {
              id: row.game_id,
              title: row.game_title,
              imageUrl: row.game_image_url || undefined,
              platform: row.platform,
            },
          ],
        });
      }

      setProfiles(Array.from(grouped.values()));
      setLoading(false);
    };

    void loadCommunity();
  }, []);

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;

    return profiles.filter((p) => {
      const inUsername = p.username.toLowerCase().includes(q);
      const inGames = p.games.some((g) => g.title.toLowerCase().includes(q));
      return inUsername || inGames;
    });
  }, [profiles, query]);

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.8} amplitude={1.3} speed={0.45} />
        <div className="absolute inset-0 bg-black/45 mix-blend-overlay" />
      </div>

      <nav className="relative z-50 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-all">
            <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-ps-accent-blue/20 group-hover:border-ps-accent-blue/40 transition-all">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-20 max-w-7xl mx-auto px-8 pb-20">
        <div className="mb-10">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white">
            Community <span className="text-transparent bg-clip-text bg-linear-to-r from-ps-accent-blue to-ps-accent-end">Profiles</span>
          </h1>
          <p className="mt-3 text-white/40 text-sm uppercase tracking-[0.25em] font-bold">
            See public profiles and owned games only
          </p>
        </div>

        <div className="mb-10 relative w-full">
          <div className="relative flex items-center gap-3 rounded-[2rem] p-5">
            <Search size={22} className="text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username or game title..."
              className="flex-1 bg-transparent outline-none focus:outline-none focus-visible:outline-none ring-0 text-white font-semibold placeholder:text-white/30 text-2xl"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-32 flex items-center justify-center">
            <Loader2 size={42} className="animate-spin text-ps-accent-blue-light" />
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-24 rounded-3xl border border-white/10 bg-white/5 text-center">
            <Users size={30} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 text-xs font-black uppercase tracking-[0.2em]">No Public Profiles Found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProfiles.map((profile) => (
              <section key={profile.userId} className="rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-2xl p-6">
                {(() => {
                  const isExpanded = Boolean(expandedProfiles[profile.userId]);
                  const visibleGames = isExpanded
                    ? profile.games
                    : profile.games.slice(0, GAMES_PREVIEW_LIMIT);
                  const remainingCount = profile.games.length - GAMES_PREVIEW_LIMIT;

                  return (
                    <>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center text-white/60 font-black">
                      {profile.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatarUrl} alt={profile.username} className="size-full object-cover" />
                      ) : (
                        profile.username.slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">{profile.username}</h2>
                      {profile.bio ? <p className="text-white/50 text-sm">{profile.bio}</p> : null}
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                    {profile.games.length} Games
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {visibleGames.map((game) => (
                    <article key={game.id} className="group rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                      <div className="aspect-3/4 bg-black/40 flex items-center justify-center">
                        {game.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={game.imageUrl} alt={game.title} className="size-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <Gamepad2 size={26} className="text-white/20" />
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-black text-white line-clamp-2">{game.title}</h3>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{game.platform}</p>
                      </div>
                    </article>
                  ))}
                </div>
                {profile.games.length > GAMES_PREVIEW_LIMIT && !isExpanded ? (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                      +{remainingCount} more games
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProfiles((prev) => ({
                          ...prev,
                          [profile.userId]: true,
                        }))
                      }
                      className="text-[10px] font-black uppercase tracking-[0.18em] text-ps-accent-blue-light hover:text-white transition-colors"
                    >
                      See all
                    </button>
                  </div>
                ) : null}
                {isExpanded ? (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProfiles((prev) => ({
                          ...prev,
                          [profile.userId]: false,
                        }))
                      }
                      className="text-[10px] font-black uppercase tracking-[0.18em] text-white/50 hover:text-white transition-colors"
                    >
                      Show less
                    </button>
                  </div>
                ) : null}
                    </>
                  );
                })()}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
