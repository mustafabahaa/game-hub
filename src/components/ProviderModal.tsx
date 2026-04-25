"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useProvidersContext } from "@/context/ProvidersContext";
import { Provider, ProviderFormData } from "@/types/provider";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import {
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  Users,
  Save,
  Image as ImageIcon,
  Upload,
} from "lucide-react";

const EMPTY_PROVIDER_FORM: ProviderFormData = {
  name: "",
  website: "",
  whatsapp: "",
  facebook: "",
  instagram: "",
  notes: "",
  photo: null,
};

export default function ProviderModal({ 
  isOpen, 
  onClose,
  initialEditProvider
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialEditProvider?: Provider | null;
}) {
  const [providerForm, setProviderForm] = useState<ProviderFormData>({ ...EMPTY_PROVIDER_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialEditProvider) {
      setProviderForm({
        name: initialEditProvider.name,
        website: initialEditProvider.website || "",
        whatsapp: initialEditProvider.whatsapp || "",
        facebook: initialEditProvider.facebook || "",
        instagram: initialEditProvider.instagram || "",
        notes: initialEditProvider.notes || "",
        photo: null,
      });
      setPreview(initialEditProvider.photoUrl || null);
    } else {
      setProviderForm({ ...EMPTY_PROVIDER_FORM });
      setPreview(null);
    }
  }, [initialEditProvider, isOpen]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      setProviderForm(f => ({ ...f, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProviderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!providerForm.name) return showToast("Provider name is required", "error");

    setSubmitting(true);
    try {
      let photoUrl = initialEditProvider?.photoUrl || null;

      if (providerForm.photo) {
        const fileExt = providerForm.photo.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `provider-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("game-images") // Using existing game-images bucket
          .upload(filePath, providerForm.photo);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("game-images")
          .getPublicUrl(filePath);
          
        photoUrl = publicUrl;
      }

      const payload = { 
        name: providerForm.name,
        website: providerForm.website || null,
        whatsapp: providerForm.whatsapp || null,
        facebook: providerForm.facebook || null,
        instagram: providerForm.instagram || null,
        notes: providerForm.notes || null,
        photo_url: photoUrl,
        updated_at: new Date().toISOString() 
      };

      const { error } = initialEditProvider
        ? await supabase.from("providers").update(payload).eq("id", initialEditProvider.id)
        : await supabase.from("providers").insert([{ ...payload, created_at: new Date().toISOString() }]);

      if (error) throw error;
      
      showToast(initialEditProvider ? "Changes saved" : "Provider added", "success");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to process request", "error");
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-black/40 border border-white/10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,102,255,0.2)] overflow-hidden flex flex-col max-h-[90vh] backdrop-blur-3xl">
        
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.5} />
        </div>

        <header className="relative z-10 px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0044ff] to-[#0099ff] flex items-center justify-center shadow-[0_10px_30px_rgba(0,102,255,0.3)] border border-white/20 ring-1 ring-white/10 ring-inset">
              <Users size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {initialEditProvider ? "Edit Provider" : "New Provider"}
              </h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Registry Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
          {toast && (
            <div className={`fixed top-10 right-10 z-[110] px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 animate-fadeInUp shadow-2xl border ${toast.type === "success" ? "bg-[#0066ff] border-white/20 text-white" : "bg-red-500 border-white/20 text-white"}`}>
              {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {toast.message}
            </div>
          )}

          <form onSubmit={handleProviderSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
              {/* Photo Upload */}
              <div className="md:col-span-4 space-y-4">
                <label className="block text-xs font-black text-white/40 uppercase tracking-widest ml-1">Provider Photo</label>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="aspect-square rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-[#0099ff]/50 transition-all cursor-pointer group overflow-hidden relative"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-[#0099ff]/50 transition-colors">
                        <ImageIcon size={24} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center px-4">Upload Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
              </div>

              {/* Basic Info */}
              <div className="md:col-span-8 space-y-8">
                <InputField 
                  label="Provider Name" 
                  value={providerForm.name} 
                  onChange={(v) => setProviderForm({ ...providerForm, name: v })} 
                  placeholder="e.g. PlayStation Store" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField 
                    label="Website" 
                    value={providerForm.website} 
                    onChange={(v) => setProviderForm({ ...providerForm, website: v })} 
                    placeholder="https://..." 
                  />
                  <InputField 
                    label="WhatsApp" 
                    value={providerForm.whatsapp} 
                    onChange={(v) => setProviderForm({ ...providerForm, whatsapp: v })} 
                    placeholder="+1 234..." 
                  />
                  <InputField 
                    label="Facebook" 
                    value={providerForm.facebook} 
                    onChange={(v) => setProviderForm({ ...providerForm, facebook: v })} 
                    placeholder="facebook.com/..." 
                  />
                  <InputField 
                    label="Instagram" 
                    value={providerForm.instagram} 
                    onChange={(v) => setProviderForm({ ...providerForm, instagram: v })} 
                    placeholder="@username" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-black text-white/40 uppercase tracking-widest mb-2 ml-1">Internal Notes</label>
              <textarea
                value={providerForm.notes}
                onChange={(e) => setProviderForm({ ...providerForm, notes: e.target.value })}
                placeholder="Private reference details..."
                className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#0099ff]/40 focus:bg-white/5 focus:ring-1 focus:ring-[#0099ff]/20 transition-all min-h-[100px] resize-none backdrop-blur-md placeholder:text-white/10"
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="group relative w-full py-5 rounded-2xl bg-gradient-to-r from-[#0044ff] to-[#0099ff] text-white font-black text-xs uppercase tracking-[0.3em] overflow-hidden shadow-[0_15px_40px_rgba(0,102,255,0.4)] border border-white/10 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {submitting ? <Loader2 size={18} className="animate-spin" /> : initialEditProvider ? <Save size={18} /> : <Plus size={18} />}
                {initialEditProvider ? "Save Changes" : "Add Provider"}
              </span>
            </button>
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
        className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#0099ff]/40 focus:bg-white/5 focus:ring-1 focus:ring-[#0099ff]/20 transition-all placeholder:text-white/10 backdrop-blur-md"
      />
    </div>
  );
}
