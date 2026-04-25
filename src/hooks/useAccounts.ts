"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Account } from "@/types/account";

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchAccounts = async () => {
      const { data, error: fetchError } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Supabase fetch error:", fetchError);
        setError("Failed to load accounts.");
      } else {
        setAccounts(mapRows(data || []));
      }
      setLoading(false);
    };

    fetchAccounts();

    // Real-time subscription
    const channel = supabase
      .channel(`accounts-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setAccounts((prev) => [mapRow(payload.new), ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setAccounts((prev) =>
              prev.map((a) =>
                a.id === String(payload.new.id) ? mapRow(payload.new) : a
              )
            );
          } else if (payload.eventType === "DELETE") {
            setAccounts((prev) =>
              prev.filter((a) => a.id !== String(payload.old.id))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { accounts, loading, error };
}

/* ── Map Supabase snake_case rows to our camelCase Account type ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(row: any): Account {
  return {
    id: String(row.id),
    accountName: row.account_name,
    email: row.email,
    password: row.password || undefined,
    otpSecret: row.otp_secret || undefined,
    providerId: row.provider_id || undefined,
    accountType: row.account_type,
    platform: row.platform || "PlayStation",
    isPsPlus: row.is_ps_plus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    games: row.games ? row.games.map((g: any) => ({
      id: String(g.id),
      title: g.title,
      imageUrl: g.image_url,
    })) : [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRows(rows: any[]): Account[] {
  return rows.map(mapRow);
}
