"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Account } from "@/types/account";

interface AccountsContextType {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined);

interface AccountRow {
  id: string | number;
  game_title: string;
  image_url: string;
  email: string;
  password?: string;
  otp_secret?: string;
  provider_id?: string;
  account_type?: "Primary" | "Secondary" | "Full";
  platform: string;
  is_ps_plus: boolean;
  created_at: string;
  updated_at: string;
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRow = useCallback((row: AccountRow): Account => ({
    id: String(row.id),
    gameTitle: row.game_title,
    imageUrl: row.image_url,
    email: row.email,
    password: row.password || undefined,
    otpSecret: row.otp_secret || undefined,
    providerId: row.provider_id || undefined,
    accountType: row.account_type,
    platform: (row.platform as Account["platform"]) || "PlayStation",
    isPsPlus: row.is_ps_plus,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }), []);

  const fetchAccounts = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      setError("Failed to load accounts.");
    } else {
      setAccounts(((data as AccountRow[]) || []).map(mapRow));
    }
    setLoading(false);
  }, [mapRow]);

  useEffect(() => {
    void (async () => {
      await fetchAccounts();
    })();

    const channel = supabase
      .channel("global-accounts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAccounts]);

  return (
    <AccountsContext.Provider value={{ accounts, loading, error, refetch: fetchAccounts }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccountsContext() {
  const context = useContext(AccountsContext);
  if (context === undefined) {
    throw new Error("useAccountsContext must be used within a AccountsProvider");
  }
  return context;
}
