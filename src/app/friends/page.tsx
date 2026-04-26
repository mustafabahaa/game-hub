"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import { ChevronLeft, Clock3, Search, UserPlus, Users } from "lucide-react";

interface ProfileRow {
  user_id: string;
  username: string;
  display_name: string | null;
}

interface RequestRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  created_at: string;
}

export default function FriendsPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [incoming, setIncoming] = useState<RequestRow[]>([]);
  const [outgoing, setOutgoing] = useState<RequestRow[]>([]);
  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const load = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id || null;
    setCurrentUserId(userId);
    if (!userId) return;

    const [{ data: inReq }, { data: outReq }, { data: rels }] = await Promise.all([
      supabase.from("friend_requests").select("*").eq("receiver_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("friend_requests").select("*").eq("sender_id", userId).eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("friendships").select("friend_id").eq("user_id", userId),
    ]);

    setIncoming((inReq || []) as RequestRow[]);
    setOutgoing((outReq || []) as RequestRow[]);

    const friendIds = (rels || []).map((r) => r.friend_id as string);
    const senderIds = (inReq || []).map((r) => r.sender_id as string);
    const receiverIds = (outReq || []).map((r) => r.receiver_id as string);
    const allIds = Array.from(new Set([...friendIds, ...senderIds, ...receiverIds]));
    if (allIds.length > 0) {
      const { data: allProfiles } = await supabase
        .from("user_profiles")
        .select("user_id,username,display_name")
        .in("user_id", allIds);
      const map: Record<string, string> = {};
      for (const p of allProfiles || []) {
        map[p.user_id as string] = ((p.display_name as string) || (p.username as string) || "Player");
      }
      setNameMap(map);
    } else {
      setNameMap({});
    }

    if (friendIds.length > 0) {
      const { data: friendProfiles } = await supabase
        .from("user_profiles")
        .select("user_id,username,display_name")
        .in("user_id", friendIds);
      setFriends((friendProfiles || []) as ProfileRow[]);
    } else {
      setFriends([]);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      const q = query.trim();
      if (!q || !currentUserId) {
        setProfiles([]);
        return;
      }
      const { data } = await supabase
        .from("user_profiles")
        .select("user_id,username,display_name")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .neq("user_id", currentUserId)
        .limit(10);
      setProfiles((data || []) as ProfileRow[]);
    };
    void searchUsers();
  }, [query, currentUserId]);

  const outgoingIds = useMemo(() => new Set(outgoing.map((r) => r.receiver_id)), [outgoing]);
  const friendIds = useMemo(() => new Set(friends.map((f) => f.user_id)), [friends]);

  const sendRequest = async (receiverId: string) => {
    const { error } = await supabase.from("friend_requests").insert({ receiver_id: receiverId });
    if (!error) await load();
  };

  const respondRequest = async (request: RequestRow, accept: boolean) => {
    const status = accept ? "accepted" : "rejected";
    const { error } = await supabase
      .from("friend_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) return;

    if (accept) {
      await supabase.from("friendships").upsert(
        [
          { user_id: request.receiver_id, friend_id: request.sender_id },
          { user_id: request.sender_id, friend_id: request.receiver_id },
        ],
        { onConflict: "user_id,friend_id" }
      );
    }
    await load();
  };

  const cancelRequest = async (request: RequestRow) => {
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "canceled", responded_at: new Date().toISOString() })
      .eq("id", request.id);
    if (!error) await load();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.8} amplitude={1.2} speed={0.45} />
      </div>

      <nav className="relative z-20 p-8">
        <Link href="/" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white">
          <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <ChevronLeft size={16} />
          </div>
          Back to Home
        </Link>
      </nav>

      <main className="relative z-20 max-w-5xl mx-auto px-8 pb-20 space-y-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight">Friends</h1>
          <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-white/40">
            Requests, connections, and sharing network
          </p>
        </div>

        <section className="rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-2xl p-5">
          <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            <UserPlus size={14} />
            Add Friends
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <Search size={20} className="text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name..."
              className="flex-1 bg-transparent outline-none text-white font-semibold placeholder:text-white/30"
            />
          </div>
          <div className="mt-3 space-y-2">
            {profiles.map((p) => (
              <div key={p.user_id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                <p className="text-sm">{p.display_name || p.username}</p>
                {friendIds.has(p.user_id) ? (
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Friend</span>
                ) : outgoingIds.has(p.user_id) ? (
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Pending</span>
                ) : (
                  <button
                    onClick={() => sendRequest(p.user_id)}
                    className="text-[10px] font-black uppercase tracking-[0.16em] rounded-lg border border-white/20 px-2.5 py-1.5 hover:bg-white/10 transition-colors"
                  >
                    Add Friend
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-2xl p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-3">Incoming Requests</h2>
          <div className="space-y-2">
            {incoming.length === 0 ? (
              <p className="text-xs text-white/40">No incoming requests.</p>
            ) : (
              incoming.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-xs text-white/70">{nameMap[r.sender_id] || `${r.sender_id.slice(0, 8)}...`}</span>
                  <div className="flex gap-2">
                    <button onClick={() => respondRequest(r, true)} className="text-[10px] font-black uppercase tracking-[0.16em] rounded-lg border border-emerald-400/40 px-2.5 py-1.5 text-emerald-300 hover:bg-emerald-500/10 transition-colors">Accept</button>
                    <button onClick={() => respondRequest(r, false)} className="text-[10px] font-black uppercase tracking-[0.16em] rounded-lg border border-red-400/40 px-2.5 py-1.5 text-red-300 hover:bg-red-500/10 transition-colors">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-2xl p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-3 flex items-center gap-2">
            <Clock3 size={14} />
            Outgoing Requests
          </h2>
          <div className="space-y-2">
            {outgoing.length === 0 ? (
              <p className="text-xs text-white/40">No outgoing requests.</p>
            ) : (
              outgoing.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="text-xs text-white/70">{nameMap[r.receiver_id] || `${r.receiver_id.slice(0, 8)}...`}</span>
                  <button
                    onClick={() => cancelRequest(r)}
                    className="text-[10px] font-black uppercase tracking-[0.16em] rounded-lg border border-red-400/40 px-2.5 py-1.5 text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-black/50 backdrop-blur-2xl p-5">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white/50 mb-3">My Friends</h2>
          <div className="space-y-2">
            {friends.length === 0 ? (
              <p className="text-xs text-white/40">No friends yet.</p>
            ) : (
              friends.map((f) => (
                <div key={f.user_id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <Users size={14} className="text-white/40" />
                  <span className="text-sm">{f.display_name || f.username}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
