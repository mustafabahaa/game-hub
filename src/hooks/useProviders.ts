"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Provider } from "@/types/provider";

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Supabase fetch error:", error);
        setError("Failed to load providers.");
      } else {
        setProviders(
          data.map((row) => ({
            id: String(row.id),
            name: row.name,
            website: row.website || undefined,
            whatsapp: row.whatsapp || undefined,
            facebook: row.facebook || undefined,
            createdAt: new Date(row.created_at).getTime(),
          }))
        );
      }
      setLoading(false);
    };

    fetchProviders();

    const channel = supabase
      .channel(`providers-realtime-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "providers" },
        () => {
          fetchProviders(); // Simple refetch on change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { providers, loading, error };
}
