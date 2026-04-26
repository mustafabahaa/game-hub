"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Provider, ProviderFormData } from "@/types/provider";
import { supabase } from "@/lib/supabase";
import Aurora from "@/components/Aurora";
import {
  Plus,
  X,
  Loader2,
  CircleAlert,
  CircleCheckBig,
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
  initialEditProvider,
  onSuccess
}: { 
  isOpen: boolean; 
  onClose: () => void;
  initialEditProvider?: Provider | null;
  onSuccess?: () => void;
}) {
  const [providerForm, setProviderForm] = useState<ProviderFormData>({ ...EMPTY_PROVIDER_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" } | null>(null);
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
    setSuccessMessage(null);
  }, [initialEditProvider, isOpen]);

  const showToast = (message: string, type: "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      setProviderForm(f => ({ ...f, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProviderSubmit = async (e: React.SyntheticEvent) => {
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
      
      const successMsg = initialEditProvider ? "Changes saved" : "Provider added";
      setSuccessMessage(successMsg);
      onSuccess?.();
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast("Failed to process request", "error");
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="
      animate-fadeIn fixed inset-0 z-100 flex items-center justify-center p-4
      sm:p-6
    ">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="
        relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden
        rounded-[2.5rem] border border-white/10 bg-black/40
        shadow-[0_0_100px_rgba(0,102,255,0.2)] backdrop-blur-3xl
      ">
        
        <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
          <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.5} />
        </div>

        <header className="
          relative z-10 flex items-center justify-between border-b
          border-white/10 bg-white/5 px-8 py-6 backdrop-blur-md
        ">
          <div className="flex items-center gap-4">
            <div className="
              flex size-12 items-center justify-center rounded-2xl border
              border-white/20 bg-linear-to-br from-ps-accent-start
              to-ps-accent-blue-light shadow-[0_10px_30px_rgba(0,102,255,0.3)]
              ring-1 ring-white/10 ring-inset
            ">
              <Users size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">
                {initialEditProvider ? "Edit Provider" : "New Provider"}
              </h2>
              <p className="
                text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase
              ">Registry Entry</p>
            </div>
          </div>
          <button onClick={onClose} className="
            flex size-10 items-center justify-center rounded-full border
            border-white/10 bg-white/5 text-white/40 transition-all
            hover:bg-white/10 hover:text-white
          ">
            <X size={20} />
          </button>
        </header>

        <div className="
          custom-scrollbar relative z-10 flex-1 overflow-y-auto p-8
          lg:p-10
        ">
          {toast && (
            <div className={`
              fixed bottom-6 left-1/2 -translate-x-1/2 z-110 flex animate-fadeInUp items-center
              gap-3 rounded-2xl border border-white/20 bg-red-500 px-6 py-4 text-sm font-bold text-white shadow-2xl
            `}>
              <CircleAlert size={20} />
              {toast.message}
            </div>
          )}

          <form onSubmit={handleProviderSubmit} className="space-y-10">
            <div className="
              grid grid-cols-1 gap-10
              md:grid-cols-12
            ">
              {/* Photo Upload */}
              <div className="
                space-y-4
                md:col-span-4
              ">
                <label className="
                  ml-1 block text-xs font-black tracking-widest text-white/40
                  uppercase
                ">Provider Photo</label>
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="
                    group relative aspect-square cursor-pointer overflow-hidden
                    rounded-[2rem] border-2 border-dashed border-white/10
                    bg-white/5 transition-all
                    hover:border-ps-accent-blue-light/50
                  "
                >
                  {preview ? (
                    <Image 
                      src={preview} 
                      alt="Preview" 
                      fill
                      unoptimized
                      className="
                        object-cover transition-transform duration-700
                        group-hover:scale-110
                      " 
                    />
                  ) : (
                    <div className="
                      absolute inset-0 flex flex-col items-center justify-center
                      gap-4
                    ">
                      <div className="
                        flex size-12 items-center justify-center rounded-full
                        bg-white/5 text-white/10 transition-colors
                        group-hover:text-ps-accent-blue-light/50
                      ">
                        <ImageIcon size={24} />
                      </div>
                      <span className="
                        px-4 text-center text-[10px] font-black tracking-widest
                        text-white/20 uppercase
                      ">Upload Image</span>
                    </div>
                  )}
                  <div className="
                    absolute inset-0 flex items-center justify-center
                    bg-black/60 opacity-0 transition-opacity
                    group-hover:opacity-100
                  ">
                    <Upload size={24} className="text-white" />
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="
                  hidden
                " onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
              </div>

              {/* Basic Info */}
              <div className="
                space-y-8
                md:col-span-8
              ">
                <InputField 
                  label="Provider Name" 
                  value={providerForm.name} 
                  onChange={(v) => setProviderForm({ ...providerForm, name: v })} 
                  placeholder="e.g. PlayStation Store" 
                />
                <div className="
                  grid grid-cols-1 gap-6
                  sm:grid-cols-2
                ">
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
              <label className="
                mb-2 ml-1 block text-xs font-black tracking-widest text-white/40
                uppercase
              ">Internal Notes</label>
              <textarea
                value={providerForm.notes}
                onChange={(e) => setProviderForm({ ...providerForm, notes: e.target.value })}
                placeholder="Private reference details..."
                className="
                  min-h-[100px] w-full resize-none rounded-2xl border
                  border-white/5 bg-black/20 px-5 py-4 text-sm text-white
                  backdrop-blur-md transition-all outline-none
                  placeholder:text-white/10
                  focus:border-ps-accent-blue-light/40 focus:bg-white/5
                  focus:ring-1 focus:ring-ps-accent-blue-light/20
                "
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting || successMessage !== null}
              className={`
                group relative w-full overflow-hidden rounded-2xl border
                py-5 text-xs font-black tracking-[0.3em]
                text-white uppercase transition-all
                hover:scale-[1.01]
                active:scale-[0.99]
                ${successMessage ? `
                  border-ps-accent-blue bg-linear-to-r from-ps-accent-blue to-ps-accent-blue-light
                  shadow-[0_15px_40px_rgba(0,102,255,0.4)]
                ` : `
                  border-white/10 bg-linear-to-r from-ps-accent-start
                  to-ps-accent-blue-light shadow-[0_15px_40px_rgba(0,102,255,0.4)]
                `}
              `}
            >
              <div className="
                absolute inset-0 -translate-x-full bg-linear-to-r
                from-transparent via-white/30 to-transparent
                group-hover:animate-[shimmer_1.5s_infinite]
              " />
              <span className="
                relative z-10 flex items-center justify-center gap-3
              ">
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : successMessage ? (
                  <CircleCheckBig size={18} />
                ) : initialEditProvider ? (
                  <Save size={18} />
                ) : (
                  <Plus size={18} />
                )}
                {successMessage || (initialEditProvider ? "Save Changes" : "Add Provider")}
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
      <label className="
        ml-1 block text-xs font-black tracking-widest text-white/40 uppercase
      ">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full rounded-2xl border border-white/5 bg-black/20 px-5 py-4 text-sm
          text-white backdrop-blur-md transition-all outline-none
          placeholder:text-white/10
          focus:border-ps-accent-blue-light/40 focus:bg-white/5 focus:ring-1
          focus:ring-ps-accent-blue-light/20
        "
      />
    </div>
  );
}
