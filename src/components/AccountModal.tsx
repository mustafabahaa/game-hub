"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useProvidersContext } from "@/context/ProvidersContext";
import { Account, AccountFormData, AccountType, Platform } from "@/types/account";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import {
  Save,
  Image as ImageIcon,
  X,
  Loader2,
  Shield,
  CircleAlert,
  CircleCheckBig,
  Monitor,
  Gamepad,
  Upload,
} from "lucide-react";

const EMPTY_ACCOUNT_FORM: AccountFormData = {
  gameTitle: "",
  email: "",
  password: "",
  otpSecret: "",
  providerId: "",
  accountType: "Primary",
  platform: "PlayStation",
  isPsPlus: false,
  imageFile: null,
  imageUrl: "",
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
  const [form, setForm] = useState<AccountFormData>({ ...EMPTY_ACCOUNT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEditAccount) {
      setEditingId(initialEditAccount.id);
      setForm({
        gameTitle: initialEditAccount.gameTitle,
        email: initialEditAccount.email,
        password: initialEditAccount.password || "",
        otpSecret: initialEditAccount.otpSecret || "",
        providerId: initialEditAccount.providerId || "",
        accountType: initialEditAccount.accountType,
        platform: initialEditAccount.platform,
        isPsPlus: initialEditAccount.isPsPlus,
        imageFile: null,
        imageUrl: initialEditAccount.imageUrl || "",
      });
      setPreview(initialEditAccount.imageUrl || null);
    } else if (initialData) {
      setEditingId(null);
      setForm({ ...EMPTY_ACCOUNT_FORM, ...initialData });
      setPreview(null);
    } else {
      resetForm();
    }
  }, [initialEditAccount, initialData, isOpen]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setForm((f) => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setForm({ ...EMPTY_ACCOUNT_FORM });
    setEditingId(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!form.gameTitle || !form.email) return showToast("Game title and email are required", "error");
    if (!editingId && !form.imageFile) return showToast("Game poster is required", "error");

    setSubmitting(true);
    try {
      let imageUrl = form.imageUrl || "";
      if (form.imageFile) {
        const fileExt = form.imageFile.name.split(".").pop();
        const filePath = `games/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("game-images").upload(filePath, form.imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("game-images").getPublicUrl(filePath).data.publicUrl;
      }

      const payload = {
        game_title: form.gameTitle,
        email: form.email,
        password: form.password || null,
        otp_secret: form.otpSecret || null,
        provider_id: form.providerId || null,
        account_type: form.platform === "PlayStation" ? form.accountType : null,
        platform: form.platform,
        is_ps_plus: form.gameTitle.toLowerCase().includes("plus"),
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = editingId 
        ? await supabase.from("accounts").update(payload).eq("id", editingId)
        : await supabase.from("accounts").insert([{ ...payload, created_at: new Date().toISOString() }]);

      if (error) throw error;
      showToast(editingId ? "Changes saved" : "Game added to vault", "success");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
    } catch (err) {
      showToast("System error. Please try again.", "error");
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-black/40 border border-white/10 rounded-[3rem] shadow-[0_0_120px_rgba(0,112,209,0.25)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-3xl">
        
        {/* Modal Aurora Background */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.8} />
        </div>

        <header className="relative z-10 px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0044ff] to-[#0099ff] flex items-center justify-center shadow-[0_10px_30px_rgba(0,102,255,0.3)] border border-white/20 ring-1 ring-white/10 ring-inset">
              <Gamepad size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {editingId ? "Edit Game" : "New Game"}
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Game Details</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-10">
          {toast && (
            <div className={`fixed top-10 right-10 z-[110] px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 animate-fadeInUp shadow-2xl border ${toast.type === "success" ? "bg-[#00d2ff] border-white/20 text-black" : "bg-red-500 border-white/20 text-white"}`}>
              {toast.type === "success" ? <CircleCheckBig size={20} /> : <CircleAlert size={20} />}
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-8">
              <div>
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-4 ml-1">Game Cover</label>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="aspect-[3/4] rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-[#00d2ff]/50 transition-all cursor-pointer group overflow-hidden relative shadow-2xl"
                >
                  {preview ? (
                    <Image 
                      src={preview} 
                      alt="Preview" 
                      fill
                      unoptimized
                      className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-[#00d2ff]/50 transition-colors">
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center px-8">Upload Game Cover</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-6 py-3 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                      <Upload size={14} /> Upload Poster
                    </div>
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
              </div>

              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-md">
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-5 ml-1">Select Platform</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "PlayStation", icon: Gamepad },
                    { id: "Xbox", icon: Shield },
                    { id: "PC", icon: Monitor }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, platform: p.id as Platform }))}
                      className={`flex flex-col items-center justify-center gap-2 py-5 px-2 rounded-2xl border transition-all duration-500 ${form.platform === p.id ? "bg-gradient-to-br from-[#0044ff] to-[#0099ff] border-white/30 text-white shadow-lg" : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"}`}
                    >
                      <p.icon size={22} />
                      <span className="text-[9px] font-black uppercase tracking-tight text-center">{p.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputField label="Game Name" value={form.gameTitle} onChange={(v) => setForm(f => ({ ...f, gameTitle: v }))} placeholder="e.g. God of War Ragnarök" />
                <InputField label="Email / ID" value={form.email} onChange={(v) => setForm(f => ({ ...f, email: v }))} placeholder="user@email.com" type="email" />
                
                <div className="space-y-1">
                  <InputField 
                    label={form.accountType === "Secondary" ? "Password (Optional)" : "Password"} 
                    value={form.password} 
                    onChange={(v) => setForm(f => ({ ...f, password: v }))} 
                    placeholder={form.accountType === "Secondary" ? "Managed by Provider" : "••••••••"} 
                  />
                  {form.accountType === "Secondary" && (
                    <p className="text-[9px] text-[#0099ff] font-bold uppercase tracking-wider ml-1 animate-pulse">Provider handles login</p>
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

              <div className="space-y-8 pt-8 border-t border-white/10">
                {form.platform === "PlayStation" && (
                  <div className="grid grid-cols-1 gap-8">
                    <div>
                      <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-4 ml-1">Account Type</label>
                      <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                        {["Primary", "Secondary", "Full"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, accountType: t as AccountType }))}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${form.accountType === t ? "bg-white/10 text-white shadow-xl" : "text-white/20 hover:text-white/40"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest ml-1">Account Provider</label>
                  <div className="relative">
                    <select
                      value={form.providerId}
                      onChange={(e) => setForm(f => ({ ...f, providerId: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00d2ff]/50 focus:bg-white/10 transition-all appearance-none cursor-pointer backdrop-blur-md"
                    >
                      <option value="" className="bg-zinc-950 text-white/50">No Provider</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id} className="bg-zinc-950 text-white">{p.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                      <Upload size={16} className="rotate-180" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative px-12 py-5 rounded-[2rem] bg-gradient-to-r from-[#0044ff] to-[#0099ff] text-white font-black text-xs uppercase tracking-[0.4em] overflow-hidden shadow-[0_20px_50px_rgba(0,102,255,0.4)] border border-white/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  <span className="relative z-10 flex items-center gap-3">
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    {editingId ? "Save Changes" : "Add to Vault"}
                  </span>
                </button>
              </div>
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
        className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#00d2ff]/40 focus:bg-white/5 focus:ring-1 focus:ring-[#00d2ff]/20 transition-all placeholder:text-white/10 backdrop-blur-md"
      />
    </div>
  );
}
