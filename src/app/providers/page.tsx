"use client";

import { useState, useMemo } from "react";
import { useProvidersContext } from "@/context/ProvidersContext";
import { Provider } from "@/types/provider";
import ProviderModal from "@/components/ProviderModal";
import Aurora from "@/components/Aurora";
import {
  Search,
  Plus,
  Users,
  Globe,
  MessageCircle,
  Share2,
  Edit3,
  Trash2,
  ChevronLeft,
  Loader2,
  Database,
  ArrowRight,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ProvidersPage() {
  const { providers, loading } = useProvidersContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);

  const filteredProviders = useMemo(() => {
    return providers.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [providers, searchQuery]);

  const handleEdit = (provider: Provider) => {
    setEditProvider(provider);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditProvider(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this provider?")) return;
    try {
      const { error } = await supabase.from("providers").delete().eq("id", id);
      if (error) throw error;
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col font-sans selection:bg-ps-accent-blue/30">
      <title>Providers | GameHub</title>
      {/* ── Cinematic Backgrounds ── */}
      <div className="fixed inset-0 z-0">
        <Aurora 
          colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} 
          blend={0.8} 
          amplitude={1.4} 
          speed={0.4} 
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.05),transparent_70%)]" />
        <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-[#050505]" />
      </div>

      {/* ── Navigation ── */}
      <nav className="relative z-50 p-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link 
            href="/" 
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.5em] text-white/40 hover:text-white transition-all"
          >
            <div className="size-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-ps-accent-blue/20 group-hover:border-ps-accent-blue/40 transition-all">
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            </div>
            Back to Home
          </Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="relative z-20 px-8 pt-4 pb-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-ps-accent-blue/10 border border-ps-accent-blue/20 text-ps-accent-blue-light text-[10px] font-black uppercase tracking-[0.3em]">
              <Database size={12} />
              Provider Registry
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-none">
                Our <span className="text-transparent bg-clip-text bg-linear-to-r from-ps-accent-blue to-ps-accent-end">Providers</span>
              </h1>
              <p className="text-lg text-white/30 font-medium tracking-wide max-w-xl">
                Manage all your service providers, websites, and contact information in one simple place.
              </p>
            </div>
          </div>

          <button
            onClick={handleAddNew}
            className="group relative px-10 py-5 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-[0.4em] overflow-hidden shadow-[0_20px_60px_rgba(255,255,255,0.2)] hover:scale-[1.05] active:scale-[0.95] transition-all"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-linear-to-r from-transparent via-black/5 to-transparent" />
            <span className="relative z-10 flex items-center gap-3">
              <Plus size={20} />
              Add New Provider
            </span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="relative z-20 flex-1 px-8 pb-32 max-w-7xl mx-auto w-full flex flex-col">
        {/* Search Bar */}
        <div className="mb-16 relative group">
          <div className="absolute inset-0 bg-linear-to-r from-ps-accent-blue/20 to-ps-accent-end/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none text-white/20 group-focus-within:text-ps-accent-blue-light transition-colors">
              <Search size={24} />
            </div>
            <input
              type="text"
              placeholder="Search for a provider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] pl-20 pr-8 py-8 text-2xl font-bold outline-none focus:border-ps-accent-blue-light/50 focus:bg-white/10 focus:ring-1 focus:ring-ps-accent-blue-light/20 transition-all shadow-2xl placeholder:text-white/10 tracking-tight"
            />
          </div>
        </div>

        {/* Providers Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-ps-accent-blue blur-3xl opacity-20 animate-pulse" />
                <Loader2 className="animate-spin text-ps-accent-blue-light relative z-10" size={64} />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.5em] text-white/20 animate-pulse">Loading Providers</p>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-40 text-center space-y-8 bg-white/5 rounded-[4rem] border border-white/10 border-dashed backdrop-blur-sm">
              <div className="size-24 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto">
                <Users size={40} className="text-white/10" />
              </div>
              <div className="space-y-3">
                <p className="text-3xl font-black text-white/20 tracking-tighter uppercase">No Providers Found</p>
                <p className="text-xs text-white/10 uppercase tracking-[0.3em] font-bold">Try searching for something else</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProviders.map((p, i) => (
                <div 
                  key={p.id} 
                  className="group relative rounded-[3rem] bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 hover:border-ps-accent-blue-light/50 transition-all duration-700 shadow-2xl hover:shadow-[0_40px_100px_rgba(0,102,255,0.15)] hover:-translate-y-2 overflow-hidden flex flex-col animate-fadeInUp"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Card Glow Effect */}
                  <div className="absolute top-0 right-0 size-32 bg-linear-to-br from-ps-accent-blue/20 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Card Content */}
                  <div className="relative z-10 p-10 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-ps-accent-blue blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
                        <div className="relative size-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-all duration-700 shadow-xl group-hover:rotate-6">
                          {p.photoUrl ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.photoUrl} alt={p.name} className="size-full object-cover" />
                            </>
                          ) : (
                            <div className="text-ps-accent-blue-light group-hover:bg-ps-accent-blue-light group-hover:text-black size-full flex items-center justify-center transition-all duration-500">
                              <Users size={38} />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleEdit(p)}
                          className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-ps-accent-blue hover:border-ps-accent-blue hover:scale-110 transition-all duration-300"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-red-500 hover:border-red-500 hover:scale-110 transition-all duration-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 mb-10">
                      <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-ps-accent-blue-light transition-colors duration-500 leading-none">
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.3em] font-black group-hover:text-ps-accent-blue-light/50 transition-colors">
                        Service Provider
                      </div>
                    </div>

                    {/* Social/Link Grid */}
                    <div className="grid grid-cols-3 gap-3 mb-10">
                      <SocialButton href={p.website} icon={Globe} label="Web" />
                      <SocialButton href={p.whatsapp ? `https://wa.me/${p.whatsapp.replace(/\D/g, "")}` : ""} icon={MessageCircle} label="WhatsApp" />
                      <SocialButton href={p.instagram ? `https://instagram.com/${p.instagram.replace("@", "")}` : ""} icon={Share2} label="Insta" />
                    </div>

                    {p.notes && (
                      <div className="mb-10 p-6 rounded-3xl bg-white/5 border border-white/5 text-[11px] text-white/40 leading-relaxed font-medium italic group-hover:bg-white/10 transition-colors duration-500">
                        &quot;{p.notes}&quot;
                      </div>
                    )}

                    <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                        <Calendar size={12} />
                        Active Provider
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ps-accent-blue-light opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-700">
                        View Accounts <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <ProviderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditProvider(null);
        }}
        initialEditProvider={editProvider}
      />
    </div>
  );
}

function SocialButton({ href, icon: Icon, label }: { href?: string | null; icon: React.ElementType; label: string }) {
  if (!href) return (
    <div className="flex flex-col items-center gap-2 opacity-10 cursor-not-allowed group/btn">
      <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center">
        <Icon size={20} />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );

  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="flex flex-col items-center gap-2 group/btn hover:scale-110 transition-all duration-300"
    >
      <div className="size-12 rounded-2xl bg-white/5 group-hover/btn:bg-ps-accent-blue/20 border border-white/5 group-hover/btn:border-ps-accent-blue/40 flex items-center justify-center text-white/40 group-hover/btn:text-ps-accent-blue-light transition-all">
        <Icon size={20} />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover/btn:text-white transition-colors">{label}</span>
    </a>
  );
}
