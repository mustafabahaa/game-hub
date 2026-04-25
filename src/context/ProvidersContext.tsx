"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { Provider } from "@/types/provider";

interface ProvidersContextType {
  providers: Provider[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ProvidersContext = createContext<ProvidersContextType | undefined>(undefined);

export function ProvidersProvider({ children }: { children: ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = async () => {
    const { data, error: fetchError } = await supabase
      .from("providers")
      .select("*")
      .order("name", { ascending: true });

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      setError("Failed to load providers.");
    } else {
      setProviders(
        (data || []).map((row) => ({
          id: String(row.id),
          name: row.name,
          website: row.website || undefined,
          whatsapp: row.whatsapp || undefined,
          facebook: row.facebook || undefined,
          instagram: row.instagram || undefined,
          notes: row.notes || undefined,
          photoUrl: row.photo_url || undefined,
          createdAt: new Date(row.created_at).getTime(),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();

    const channel = supabase
      .channel("global-providers-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "providers" },
        () => {
          fetchProviders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ProvidersContext.Provider value={{ providers, loading, error, refetch: fetchProviders }}>
      {children}
    </ProvidersContext.Provider>
  );
}

export function useProvidersContext() {
  const context = useContext(ProvidersContext);
  if (context === undefined) {
    throw new Error("useProvidersContext must be used within a ProvidersProvider");
  }
  return context;
}
