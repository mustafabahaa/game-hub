"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/useAccounts";
import { useProviders } from "@/hooks/useProviders";
import { Account, AccountFormData, AccountType } from "@/types/account";
import { ProviderFormData } from "@/types/provider";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Pencil,
  Image as ImageIcon,
  X,
  Loader2,
  Gamepad2,
  Crown,
  Shield,
  Upload,
  AlertCircle,
  CheckCircle,
  Users,
  LogOut,
} from "lucide-react";
import Link from "next/link";

const EMPTY_ACCOUNT_FORM: AccountFormData = {
  gameTitle: "",
  email: "",
  password: "",
  otpSecret: "",
  providerId: "",
  accountType: "Primary",
  isPsPlus: false,
  imageFile: null,
  imageUrl: "",
};

const EMPTY_PROVIDER_FORM: ProviderFormData = {
  name: "",
  website: "",
  whatsapp: "",
  facebook: "",
};

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) router.replace("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const { accounts, loading: accountsLoading } = useAccounts();
  const { providers, loading: providersLoading } = useProviders();
  
  const [form, setForm] = useState<AccountFormData>({ ...EMPTY_ACCOUNT_FORM });
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [providerForm, setProviderForm] = useState<ProviderFormData>({ ...EMPTY_PROVIDER_FORM });
  const [addingProvider, setAddingProvider] = useState(false);
  const [submittingProvider, setSubmittingProvider] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setForm({
      gameTitle: account.gameTitle,
      email: account.email,
      password: account.password || "",
      otpSecret: account.otpSecret || "",
      providerId: account.providerId || "",
      accountType: account.accountType,
      isPsPlus: account.isPsPlus,
      imageFile: null,
      imageUrl: account.imageUrl,
    });
    setPreview(account.imageUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
      
      showToast("Account deleted successfully", "success");
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete account", "error");
    }
    setDeletingId(null);
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider? This may affect linked accounts.")) return;
    try {
      const { error } = await supabase.from("providers").delete().eq("id", id);
      if (error) throw error;
      showToast("Provider deleted successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete provider", "error");
    }
  };

  const handleProviderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!providerForm.name) {
      showToast("Provider name is required", "error");
      return;
    }

    setSubmittingProvider(true);
    try {
      const { error } = await supabase.from("providers").insert([
        {
          name: providerForm.name,
          website: providerForm.website || null,
          whatsapp: providerForm.whatsapp || null,
          facebook: providerForm.facebook || null,
          created_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      
      showToast("Provider added successfully", "success");
      setProviderForm({ ...EMPTY_PROVIDER_FORM });
      setAddingProvider(false);
    } catch (err) {
      console.error(err);
      showToast("Failed to add provider", "error");
    }
    setSubmittingProvider(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.gameTitle || !form.email) {
      showToast("Title and Email are required", "error");
      return;
    }
    if (!editingId && !form.imageFile) {
      showToast("Please select a game image", "error");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = form.imageUrl || "";

      if (form.imageFile) {
        const fileExt = form.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `games/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from("game-images")
          .upload(filePath, form.imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from("game-images")
          .getPublicUrl(filePath);
          
        imageUrl = data.publicUrl;
      }

      const payload = {
        game_title: form.gameTitle,
        email: form.email,
        password: form.password || null,
        otp_secret: form.otpSecret || null,
        provider_id: form.providerId || null,
        account_type: form.accountType,
        is_ps_plus: form.isPsPlus,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase
          .from("accounts")
          .update(payload)
          .eq("id", editingId);
          
        if (error) throw error;
        showToast("Account updated successfully", "success");
      } else {
        const { error } = await supabase
          .from("accounts")
          .insert([
            {
              ...payload,
              created_at: new Date().toISOString(),
            },
          ]);
          
        if (error) throw error;
        showToast("Account added successfully", "success");
      }

      resetForm();
    } catch (err) {
      console.error(err);
      showToast("Something went wrong. Check console.", "error");
    }
    setSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-ps-bg-primary)" }}>
        <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-ps-accent-blue)" }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ps-bg-primary)" }}>
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium animate-fadeInUp shadow-2xl"
          style={{
            background: toast.type === "success" ? "rgba(56,161,105,0.15)" : "rgba(229,62,62,0.15)",
            border: `1px solid ${toast.type === "success" ? "rgba(56,161,105,0.4)" : "rgba(229,62,62,0.4)"}`,
            color: toast.type === "success" ? "#68d391" : "#fc8181",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 glass" style={{ borderBottom: "1px solid var(--color-ps-border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: "var(--color-ps-bg-elevated)", border: "1px solid var(--color-ps-border)" }}
              >
                <ArrowLeft size={18} style={{ color: "var(--color-ps-text-secondary)" }} />
              </Link>
              <div>
                <h1 className="text-lg font-bold gradient-text">Admin Panel</h1>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--color-ps-text-muted)" }}>
                  Manage Accounts & Providers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <Shield size={18} style={{ color: "var(--color-ps-accent-blue)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--color-ps-text-secondary)" }}>
                  Admin Mode
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10 hover:text-red-400"
                style={{ color: "var(--color-ps-text-muted)" }}
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* ── Providers Section ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-ps-text-primary)" }}>
              <Users size={22} />
              Providers
              <span
                className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "var(--color-ps-bg-elevated)", color: "var(--color-ps-text-muted)" }}
              >
                {providers.length}
              </span>
            </h2>
            <button
              onClick={() => setAddingProvider(!addingProvider)}
              className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-ps-accent-blue-light)" }}
            >
              {addingProvider ? <X size={16} /> : <Plus size={16} />}
              {addingProvider ? "Cancel" : "Add Provider"}
            </button>
          </div>

          {addingProvider && (
            <form onSubmit={handleProviderSubmit} className="mb-6 rounded-2xl p-6" style={{ background: "var(--color-ps-bg-card)", border: "1px solid var(--color-ps-border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <InputField label="Name *" value={providerForm.name} onChange={(v) => setProviderForm({ ...providerForm, name: v })} placeholder="Provider Name" />
                <InputField label="Website" value={providerForm.website} onChange={(v) => setProviderForm({ ...providerForm, website: v })} placeholder="https://..." type="url" />
                <InputField label="WhatsApp" value={providerForm.whatsapp} onChange={(v) => setProviderForm({ ...providerForm, whatsapp: v })} placeholder="+1234567890" />
                <InputField label="Facebook" value={providerForm.facebook} onChange={(v) => setProviderForm({ ...providerForm, facebook: v })} placeholder="https://facebook.com/..." type="url" />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingProvider}
                  className="px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  style={{ background: "var(--color-ps-bg-elevated)", color: "var(--color-ps-text-primary)", border: "1px solid var(--color-ps-border)" }}
                >
                  {submittingProvider ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Provider
                </button>
              </div>
            </form>
          )}

          <div className="flex flex-wrap gap-3">
            {providersLoading && <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-ps-accent-blue)" }} />}
            {!providersLoading && providers.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-ps-text-muted)" }}>No providers found. Add one to use in accounts.</p>
            )}
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm" style={{ background: "var(--color-ps-bg-elevated)", border: "1px solid var(--color-ps-border)" }}>
                <span style={{ color: "var(--color-ps-text-primary)" }} className="font-semibold">{p.name}</span>
                <button onClick={() => handleDeleteProvider(p.id)} className="text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Form Section ── */}
        <section>
          <form onSubmit={handleSubmit}>
            <div
              className="rounded-2xl p-6 sm:p-8 mb-10"
              style={{ background: "var(--color-ps-bg-card)", border: "1px solid var(--color-ps-border)" }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--color-ps-text-primary)" }}>
                  {editingId ? "Edit Account" : "Add New Account"}
                </h2>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-1 text-sm cursor-pointer"
                    style={{ color: "var(--color-ps-text-muted)" }}
                  >
                    <X size={16} /> Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ps-text-muted)" }}>
                      Game Photo *
                    </label>
                    <div
                      className="relative aspect-[3/4] max-w-[200px] rounded-xl overflow-hidden cursor-pointer group"
                      style={{ background: "var(--color-ps-bg-elevated)", border: "2px dashed var(--color-ps-border)" }}
                      onClick={() => fileRef.current?.click()}
                    >
                      {preview ? (
                        <>
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={24} color="#fff" />
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={32} style={{ color: "var(--color-ps-text-muted)" }} />
                          <span className="text-xs" style={{ color: "var(--color-ps-text-muted)" }}>
                            Click to upload
                          </span>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    />
                  </div>

                  {/* PS Plus Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown size={16} style={{ color: "var(--color-ps-plus-gold)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--color-ps-text-primary)" }}>
                        PS Plus Account
                      </span>
                    </div>
                    <div
                      className={`toggle-switch ${form.isPsPlus ? "active" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, isPsPlus: !f.isPsPlus }))}
                      style={form.isPsPlus ? { background: "var(--color-ps-plus-gold)" } : {}}
                    />
                  </div>
                </div>

                {/* Right Column — Text Inputs */}
                <div className="space-y-4">
                  <InputField
                    label="Game Title *"
                    value={form.gameTitle}
                    onChange={(v) => setForm((f) => ({ ...f, gameTitle: v }))}
                    placeholder="e.g. God of War Ragnarök"
                  />
                  <InputField
                    label="Email *"
                    value={form.email}
                    onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    placeholder="account@example.com"
                    type="email"
                  />
                  <InputField
                    label="Password"
                    value={form.password}
                    onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                    placeholder="Optional for OTA Secondary"
                  />
                  <InputField
                    label="OTP Secret"
                    value={form.otpSecret}
                    onChange={(v) => setForm((f) => ({ ...f, otpSecret: v }))}
                    placeholder="Optional"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Account Type */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ps-text-muted)" }}>
                        Account Type
                      </label>
                      <select
                        value={form.accountType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            accountType: e.target.value as AccountType,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
                        style={{
                          background: "var(--color-ps-bg-elevated)",
                          border: "1px solid var(--color-ps-border)",
                          color: "var(--color-ps-text-primary)",
                        }}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="Full">Full</option>
                      </select>
                    </div>

                    {/* Provider Selection */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-ps-text-muted)" }}>
                        Provider
                      </label>
                      <select
                        value={form.providerId}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            providerId: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2.5 rounded-xl text-sm appearance-none cursor-pointer"
                        style={{
                          background: "var(--color-ps-bg-elevated)",
                          border: "1px solid var(--color-ps-border)",
                          color: "var(--color-ps-text-primary)",
                        }}
                      >
                        <option value="">None</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-300 disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, var(--color-ps-accent-start), var(--color-ps-accent-end))",
                    color: "#fff",
                  }}
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : editingId ? (
                    <Save size={18} />
                  ) : (
                    <Plus size={18} />
                  )}
                  {submitting ? "Saving..." : editingId ? "Update Account" : "Add Account"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* ── Existing Accounts ── */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--color-ps-text-primary)" }}>
            <Gamepad2 size={22} />
            Existing Accounts
            <span
              className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: "var(--color-ps-bg-elevated)", color: "var(--color-ps-text-muted)" }}
            >
              {accounts.length}
            </span>
          </h2>

          {accountsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-ps-accent-blue)" }} />
            </div>
          )}

          {!accountsLoading && accounts.length === 0 && (
            <div
              className="text-center py-16 rounded-2xl"
              style={{ background: "var(--color-ps-bg-card)", border: "1px solid var(--color-ps-border)" }}
            >
              <Gamepad2 size={48} className="mx-auto mb-4" style={{ color: "var(--color-ps-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-ps-text-muted)" }}>
                No accounts yet. Add your first one above!
              </p>
            </div>
          )}

          <div className="space-y-3">
            {accounts.map((account) => {
              const provider = providers.find(p => p.id === account.providerId);
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:brightness-110"
                  style={{
                    background: "var(--color-ps-bg-card)",
                    border: `1px solid ${editingId === account.id ? "var(--color-ps-accent-blue)" : "var(--color-ps-border)"}`,
                  }}
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <img src={account.imageUrl} alt={account.gameTitle} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm truncate" style={{ color: "var(--color-ps-text-primary)" }}>
                        {account.gameTitle}
                      </h4>
                      {account.isPsPlus && (
                        <Crown size={14} style={{ color: "var(--color-ps-plus-gold)" }} />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs truncate" style={{ color: "var(--color-ps-text-muted)" }}>
                      <span>{account.email}</span>
                      {provider && (
                        <>
                          <span>•</span>
                          <span style={{ color: "var(--color-ps-accent-blue-light)" }}>{provider.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Type Badge */}
                  <span
                    className={`hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      account.accountType === "Primary"
                        ? "badge-primary"
                        : account.accountType === "Secondary"
                        ? "badge-secondary"
                        : "badge-full"
                    }`}
                  >
                    {account.accountType}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(account)}
                      className="p-2 rounded-lg transition-colors hover:bg-white/5 cursor-pointer"
                      title="Edit"
                    >
                      <Pencil size={16} style={{ color: "var(--color-ps-accent-blue-light)" }} />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      disabled={deletingId === account.id}
                      className="p-2 rounded-lg transition-colors hover:bg-white/5 cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === account.id ? (
                        <Loader2 size={16} className="animate-spin" style={{ color: "var(--color-ps-danger)" }} />
                      ) : (
                        <Trash2 size={16} style={{ color: "var(--color-ps-danger)" }} />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Reusable Input Field ── */
function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--color-ps-text-muted)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all duration-300"
        style={{
          background: "var(--color-ps-bg-elevated)",
          border: "1px solid var(--color-ps-border)",
          color: "var(--color-ps-text-primary)",
        }}
      />
    </div>
  );
}
