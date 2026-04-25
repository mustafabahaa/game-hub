"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Account, GameFormData } from "@/types/account";
import { supabase } from "@/lib/supabase";
import { useAccountsContext } from "@/context/AccountsContext";
import Aurora from "@/components/Aurora";
import { 
  X, 
  Plus, 
  Gamepad2, 
  Monitor, 
  Shield, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  ChevronLeft,
  CircleCheckBig,
  CircleAlert
} from "lucide-react";

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export default function AccountDetailModal({ isOpen, onClose, account }: AccountDetailModalProps) {
  const { refetch: refetchAccounts } = useAccountsContext();
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gameForm, setGameForm] = useState<GameFormData>({ title: "", imageFile: null, imageUrl: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !account) return null;

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const PlatformIcon = account.platform === "PlayStation" ? Gamepad2 : account.platform === "Xbox" ? Shield : Monitor;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setGameForm((f) => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddGame = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!gameForm.title || !gameForm.imageFile) return;

    setSubmitting(true);
    try {
      const fileExt = gameForm.imageFile.name.split(".").pop();
      const filePath = `games/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("game-images").upload(filePath, gameForm.imageFile);
      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from("game-images").getPublicUrl(filePath).data.publicUrl;

      const { error: dbError } = await supabase.from("games").insert({
        account_id: account.id,
        title: gameForm.title,
        image_url: imageUrl
      });

      if (dbError) throw dbError;

      // Update local context
      await refetchAccounts();

      showToast("Game Added to Vault", "success");
      setTimeout(() => {
        setIsAddingGame(false);
        setGameForm({ title: "", imageFile: null, imageUrl: "" });
        setPreview(null);
      }, 1000);
    } catch (err) {
      console.error("Error adding game:", err);
      showToast("Access Denied. System Error.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Are you sure you want to delete this game?")) return;
    try {
      const { error } = await supabase.from("games").delete().eq("id", gameId);
      if (error) throw error;
      await refetchAccounts();
      showToast("Game Removed", "success");
    } catch (err) {
      console.error("Error deleting game:", err);
      showToast("Delete Failed", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-3xl animate-fadeIn" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-5xl bg-[#0a0a0f] rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-10 right-10 z-[110] px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 animate-fadeInUp shadow-[0_20px_50px_rgba(0,0,0,0.5)] border ${toast.type === "success" ? "bg-gradient-to-r from-[#00d2ff] to-[#0044ff] border-white/20 text-white" : "bg-gradient-to-r from-red-600 to-red-800 border-white/20 text-white"}`}>
            {toast.type === "success" ? <CircleCheckBig size={16} className="drop-shadow-md" /> : <CircleAlert size={16} className="drop-shadow-md" />}
            {toast.message}
          </div>
        )}

        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.8} />
        </div>

        <header className="relative z-10 px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0044ff] to-[#0099ff] flex items-center justify-center shadow-lg border border-white/10">
              <PlatformIcon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">{account.accountName}</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Games Repository</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all">
            <X size={20} />
          </button>
        </header>

        <main className="relative z-10 flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isAddingGame ? (
            <div className="max-w-xl mx-auto animate-fadeIn">
              <button 
                onClick={() => setIsAddingGame(false)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white mb-8 transition-colors"
              >
                <ChevronLeft size={16} /> Back to Games
              </button>
              
              <form onSubmit={handleAddGame} className="space-y-8">
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="aspect-video rounded-[2rem] bg-white/5 border-2 border-dashed border-white/10 hover:border-[#00d2ff]/50 transition-all cursor-pointer group overflow-hidden relative shadow-2xl"
                >
                  {preview ? (
                    <Image src={preview} alt="Preview" fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10 group-hover:text-[#00d2ff]/50 transition-colors">
                        <ImageIcon size={32} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center">Upload Game Cover</span>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-black text-white/40 uppercase tracking-widest ml-1">Game Title</label>
                  <input
                    required
                    value={gameForm.title}
                    onChange={(e) => setGameForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. God of War Ragnarök"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white outline-none focus:border-[#00d2ff]/50 focus:bg-white/10 transition-all text-lg font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 rounded-[2rem] bg-gradient-to-r from-[#0044ff] to-[#00d2ff] text-white font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,102,255,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                  Add Game to Account
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Collection ({account.games?.length || 0})</h3>
                <button
                  onClick={() => setIsAddingGame(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#00d2ff]/10 text-[#00d2ff] text-[10px] font-black uppercase tracking-widest border border-[#00d2ff]/20 hover:bg-[#00d2ff] hover:text-white transition-all shadow-lg"
                >
                  <Plus size={16} /> Add Game
                </button>
              </div>

              {account.games && account.games.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {account.games.map((game) => (
                    <div key={game.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-2xl">
                      <Image src={game.imageUrl} alt={game.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="text-xs font-black text-white uppercase tracking-tight line-clamp-2 mb-2">{game.title}</h4>
                        <button 
                          onClick={() => handleDeleteGame(game.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                    <Gamepad2 size={40} />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-white/40 uppercase tracking-widest mb-1">No Games Found</p>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">Start by adding the first game to this vault</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
