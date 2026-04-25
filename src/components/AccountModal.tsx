"use client";

import { useState, useEffect } from "react";
import { useProvidersContext } from "@/context/ProvidersContext";
import { useAccountsContext } from "@/context/AccountsContext";
import { Account, AccountFormData, AccountType, Platform } from "@/types/account";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import {
  Save,
  X,
  Loader2,
  Shield,
  CircleAlert,
  CircleCheckBig,
  Monitor,
  Gamepad2,
  Crown,
} from "lucide-react";

const EMPTY_ACCOUNT_FORM: AccountFormData = {
  accountName: "",
  email: "",
  password: "",
  otpSecret: "",
  providerId: "",
  accountType: "Primary",
  platform: "PlayStation",
  isPsPlus: false,
};

export default function AccountModal({ 
  isOpen, 
  onClose,
  initialEditAccount,
  initialData
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialEditAccount?: Account | null;
  initialData?: Partial<AccountFormData> | null;
}) {
  const { providers } = useProvidersContext();
  const { refetch: refetchAccounts } = useAccountsContext();
  const [form, setForm] = useState<AccountFormData>({ ...EMPTY_ACCOUNT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (initialEditAccount) {
      setEditingId(initialEditAccount.id);
      setForm({
        accountName: initialEditAccount.accountName,
        email: initialEditAccount.email,
        password: initialEditAccount.password || "",
        otpSecret: initialEditAccount.otpSecret || "",
        providerId: initialEditAccount.providerId || "",
        accountType: initialEditAccount.accountType,
        platform: initialEditAccount.platform,
        isPsPlus: initialEditAccount.isPsPlus,
      });
    } else if (initialData) {
      setEditingId(null);
      setForm({ ...EMPTY_ACCOUNT_FORM, ...initialData });
    } else {
      resetForm();
    }
  }, [initialEditAccount, initialData, isOpen]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  function resetForm() {
    setForm({ ...EMPTY_ACCOUNT_FORM });
    setEditingId(null);
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.accountName || !form.email) return showToast("Account name and email are required", "error");

    setSubmitting(true);
    try {

      const payload = {
        account_name: form.accountName,
        email: form.email,
        password: form.password || null,
        otp_secret: form.otpSecret || null,
        provider_id: form.providerId || null,
        account_type: form.platform === "PlayStation" ? form.accountType : null,
        platform: form.platform,
        is_ps_plus: form.platform === "PlayStation" ? form.isPsPlus : false,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingId 
        ? await supabase.from("accounts").update(payload).eq("id", editingId)
        : await supabase.from("accounts").insert([{ ...payload, created_at: new Date().toISOString() }]);

      if (error) throw error;
      
      // Update local context to show new item immediately
      await refetchAccounts();
      
      showToast(editingId ? "Vault Entry Updated" : "Account Secured in Vault", "success");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
    } catch {
      showToast("Access Denied. System Error.", "error");
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-black/40 border border-white/10 rounded-[3rem] shadow-[0_0_120px_rgba(0,112,209,0.25)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-3xl">
        
        {/* Modal Aurora Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.8} />
        </div>

        <header className="relative z-10 px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-white/20 bg-linear-to-br from-ps-accent-start to-ps-accent-blue-light shadow-[0_10px_30px_rgba(0,102,255,0.3)] ring-1 ring-inset ring-white/10">
              <Gamepad2 size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingId ? "Edit Account" : "New Account"}
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Vault Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10">
          {toast && (
            <div className={`fixed top-10 right-10 z-110 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 animate-fadeInUp shadow-[0_20px_50px_rgba(0,0,0,0.5)] border ${toast.type === "success" ? "bg-linear-to-r from-ps-accent-end to-ps-accent-start border-white/20 text-white" : "bg-linear-to-r from-red-600 to-red-800 border-white/20 text-white"}`}>
              {toast.type === "success" ? <CircleCheckBig size={16} className="drop-shadow-md" /> : <CircleAlert size={16} className="drop-shadow-md" />}
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <InputField label="Account Name" value={form.accountName} onChange={(v) => setForm(f => ({ ...f, accountName: v }))} placeholder="e.g. My PS Account" />
              <InputField label="Email / ID" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} placeholder="user@email.com" type="email" />
              
              <div className="space-y-1">
                <InputField 
                  label={form.accountType === "Secondary" ? "Password (Optional)" : "Password"} 
                  value={form.password} 
                  onChange={(v) => setForm(f => ({ ...f, password: v }))} 
                  placeholder={form.accountType === "Secondary" ? "Managed by Provider" : "••••••••"} 
                />
                {form.accountType === "Secondary" && (
                  <p className="text-[9px] text-ps-accent-blue-light font-bold uppercase tracking-wider ml-1 animate-pulse">Provider handles login</p>
                )}
              </div>

              <div className="space-y-1">
                <InputField 
                  label={form.accountType === "Secondary" ? "MFA Code (Optional)" : "MFA / Backup Codes"} 
                  value={form.otpSecret} 
                  onChange={(v) => setForm(f => ({ ...f, otpSecret: v }))} 
                  placeholder={form.accountType === "Secondary" ? "Not required" : "MFA Secret or 2FA Code"} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-5 ml-1">Select Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "PlayStation", icon: Gamepad2 },
                    { id: "Xbox", icon: Shield },
                    { id: "PC", icon: Monitor }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, platform: p.id as Platform }))}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-5 transition-all duration-500 ${form.platform === p.id ? "border-white/30 bg-linear-to-br from-ps-accent-start to-ps-accent-blue-light text-white shadow-lg" : "border-white/5 bg-white/5 text-white/20 hover:border-white/10"}`}
                    >
                      <p.icon size={22} />
                      <span className="text-[9px] font-black uppercase tracking-tight text-center">{p.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8 pt-4">
                {form.platform === "PlayStation" && (
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-4 ml-1">Account Type</label>
                      <div className="flex rounded-2xl border border-white/5 bg-white/5 p-1.5 backdrop-blur-md">
                        {["Primary", "Secondary", "Full"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, accountType: t as AccountType }))}
                            className={`flex-1 rounded-xl py-3 text-[10px] font-black tracking-widest uppercase transition-all ${form.accountType === t ? "bg-white/10 text-white shadow-xl" : "text-white/20 hover:text-white/40"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-4 ml-1">PS Plus Status</label>
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isPsPlus: !f.isPsPlus }))}
                        className={`flex w-full items-center justify-between rounded-2xl border px-6 py-3 transition-all duration-500 ${form.isPsPlus ? "border-[#FFD700]/30 bg-linear-to-br from-[#FFD700]/20 to-[#FFA500]/20 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.15)]" : "border-white/5 bg-white/5 text-white/20 hover:border-white/10"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Crown size={18} className={form.isPsPlus ? "text-[#FFD700]" : "text-white/10"} />
                          <span className="text-[10px] font-black uppercase tracking-widest">PS Plus Subscription</span>
                        </div>
                        <div className={`relative h-5 w-10 rounded-full transition-colors duration-500 ${form.isPsPlus ? "bg-[#FFD700]" : "bg-white/10"}`}>
                          <div className={`absolute top-1 size-3 rounded-full bg-white transition-all duration-500 ${form.isPsPlus ? "left-6" : "left-1"}`} />
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest ml-1">Account Provider</label>
                  <div className="relative">
                    <select
                      value={form.providerId}
                      onChange={(e) => setForm(f => ({ ...f, providerId: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-ps-accent-end/50 focus:bg-white/10 transition-all appearance-none cursor-pointer backdrop-blur-md"
                    >
                      <option value="" className="bg-zinc-950 text-white/50">No Provider</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id} className="bg-zinc-950 text-white">{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-r from-ps-accent-start to-ps-accent-blue-light px-12 py-5 text-xs font-black tracking-[0.4em] text-white uppercase shadow-[0_20px_50px_rgba(0,102,255,0.4)] transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-white/30 to-transparent" />
                <span className="relative z-10 flex items-center gap-3">
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                  {editingId ? "Save Changes" : "Create Account"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-black text-white/40 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-ps-accent-end/40 focus:bg-white/5 focus:ring-1 focus:ring-ps-accent-end/20 transition-all placeholder:text-white/10 backdrop-blur-md"
      />
    </div>
  );
}
