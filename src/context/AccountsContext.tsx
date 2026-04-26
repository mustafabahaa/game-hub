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

interface GameRow {
  id: string;
  account_id: string;
  title: string;
  image_url: string;
  created_at: string;
}

interface AccountRow {
  id: string | number;
  account_name: string;
  email: string;
  password?: string;
  otp_secret?: string;
  provider_id?: string;
  account_type?: "Primary" | "Secondary" | "Full";
  platform: string;
  is_ps_plus: boolean;
  lifecycle_type?: "lifetime" | "expires_on";
  expires_on?: string | null;
  created_at: string;
  updated_at: string;
  games: GameRow[];
}

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapRow = useCallback((row: AccountRow): Account => ({
    id: String(row.id),
    accountName: row.account_name,
    email: row.email,
    password: row.password || undefined,
    otpSecret: row.otp_secret || undefined,
    providerId: row.provider_id || undefined,
    accountType: row.account_type,
    platform: (row.platform as Account["platform"]) || "PlayStation",
    isPsPlus: row.is_ps_plus,
    lifecycleType: row.lifecycle_type || "lifetime",
    expiresOn: row.expires_on || undefined,
    games: row.games?.map(g => ({
      id: String(g.id),
      accountId: String(g.account_id),
      title: g.title,
      imageUrl: g.image_url,
      createdAt: new Date(g.created_at).getTime(),
    })) || [],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }), []);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setAccounts([]);
      setError(null);
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("accounts")
      .select("*, games(*)")
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
    const clearStateForAuthSwitch = () => {
      setAccounts([]);
      setError(null);
      setLoading(true);
    };

    void (async () => {
      await fetchAccounts();
    })();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      clearStateForAuthSwitch();
      void fetchAccounts();
    });

    const channel = supabase
      .channel("global-accounts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accounts" },
        () => {
          fetchAccounts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => {
          fetchAccounts();
        }
      )
      .subscribe();

    return () => {
      authSubscription.unsubscribe();
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
