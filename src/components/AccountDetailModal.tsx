"use client";

import { useState, useRef, useEffect } from "react";
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
  const { accounts, refetch: refetchAccounts } = useAccountsContext();
  const currentAccount = account ? accounts.find((a) => a.id === account.id) || account : null;
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [gameForm, setGameForm] = useState<GameFormData>({ title: "", imageFile: null, imageUrl: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsAddingGame(false);
      setSuccessMessage(null);
      setGameForm({ title: "", imageFile: null, imageUrl: "" });
      setPreview(null);
      setToast(null);
    }
  }, [isOpen, currentAccount?.id]);

  if (!isOpen || !currentAccount) return null;

  const showToast = (message: string, type: "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const PlatformIcon = currentAccount.platform === "PlayStation" ? Gamepad2 : currentAccount.platform === "Xbox" ? Shield : Monitor;

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setGameForm((f) => ({ ...f, imageFile: file }));
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddGame = async (e: React.SyntheticEvent) => {
    e.preventDefault();
if (!gameForm.title) {
        showToast("Game title is required", "error");
        return;
      }

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (gameForm.imageFile) {
        const fileExt = gameForm.imageFile.name.split(".").pop();
        const filePath = `games/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("game-images").upload(filePath, gameForm.imageFile);
        if (uploadError) throw uploadError;

        imageUrl = supabase.storage.from("game-images").getPublicUrl(filePath).data.publicUrl;
      }

      const { error: dbError } = await supabase.from("games").insert({
        account_id: currentAccount.id,
        title: gameForm.title,
        image_url: imageUrl
      });

      if (dbError) throw dbError;

      // Update local context
      await refetchAccounts();

      setSuccessMessage("Game Added to Vault");
      setTimeout(() => {
        setSuccessMessage(null);
        setIsAddingGame(false);
        setGameForm({ title: "", imageFile: null, imageUrl: "" });
        setPreview(null);
      }, 1500);
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
      setIsAddingGame(false);
    } catch (err) {
      console.error("Error deleting game:", err);
      showToast("Delete Failed", "error");
    }
  };

  return (
    <div className="
      fixed inset-0 z-100 flex items-center justify-center p-4
      sm:p-6
      lg:p-8
    ">
      <div 
        className="
          animate-fadeIn absolute inset-0 bg-black/80 backdrop-blur-3xl
        " 
        onClick={onClose} 
      />
      
      <div className="
        animate-scaleIn relative flex max-h-[90vh] w-full max-w-5xl flex-col
        overflow-hidden rounded-[3rem] border border-white/10 bg-[#0a0a0f]
        shadow-[0_50px_100px_rgba(0,0,0,0.8)]
      ">
        {/* Toast Notification */}
        {toast && (
          <div className={`
            fixed bottom-6 left-1/2 -translate-x-1/2 z-110 flex animate-fadeInUp items-center gap-3
            rounded-2xl border border-white/20 bg-linear-to-r from-red-600 to-red-800 px-6 py-4 text-[10px] font-black tracking-[0.2em]
            uppercase shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-white
          `}>
            <CircleAlert size={16} className="drop-shadow-md" />
            {toast.message}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-0 opacity-10">
          <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.8} />
        </div>

        <header className="
          relative z-10 flex items-center justify-between border-b
          border-white/10 bg-white/5 px-8 py-6 backdrop-blur-xl
        ">
          <div className="flex items-center gap-4">
            <div className="
              flex size-12 items-center justify-center rounded-2xl border
              border-white/10 bg-linear-to-br from-ps-accent-start
              to-ps-accent-blue-light shadow-lg
            ">
              <PlatformIcon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="
                text-2xl font-black tracking-tight text-white uppercase
              ">{currentAccount.accountName}</h2>
              <p className="
                text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase
              ">Games Repository</p>
            </div>
          </div>
          <button onClick={onClose} className="
            flex size-10 items-center justify-center rounded-full bg-white/5
            text-white/40 transition-all
            hover:bg-white/10 hover:text-white
          ">
            <X size={20} />
          </button>
        </header>

        <main className="
          custom-scrollbar relative z-10 flex-1 overflow-y-auto p-8
        ">
          {isAddingGame ? (
            <div className="animate-fadeIn mx-auto max-w-xl">
              <button 
                onClick={() => setIsAddingGame(false)}
                className="
                  mb-8 flex items-center gap-2 text-[10px] font-black
                  tracking-widest text-white/40 uppercase transition-colors
                  hover:text-white
                "
              >
                <ChevronLeft size={16} /> Back to Games
              </button>
              
              <form onSubmit={handleAddGame} className="space-y-8">
                <div 
                  onClick={() => fileRef.current?.click()}
                  className="
                    group relative aspect-video cursor-pointer overflow-hidden
                    rounded-[2rem] border-2 border-dashed border-white/10
                    bg-white/5 shadow-2xl transition-all
                    hover:border-ps-accent-end/50
                  "
                >
                  {preview ? (
                    <Image src={preview} alt="Preview" fill className="
                      object-cover transition-transform duration-700
                      group-hover:scale-105
                    " unoptimized />
                  ) : (
                    <div className="
                      absolute inset-0 flex flex-col items-center justify-center
                      gap-4
                    ">
                      <div className="
                        flex size-16 items-center justify-center rounded-full
                        bg-white/5 text-white/10 transition-colors
                        group-hover:text-ps-accent-end/50
                      ">
                        <ImageIcon size={32} />
                      </div>
                      <span className="
                        text-center text-[10px] font-black tracking-widest
                        text-white/20 uppercase
                      ">Upload Game Cover</span>                      <span className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Optional</span>                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="
                    hidden
                  " onChange={(e) => handleFileChange(e.target.files?.[0] || null)} />
                </div>

                <div className="space-y-4">
                  <label className="
                    ml-1 block text-xs font-black tracking-widest text-white/40
                    uppercase
                  ">Game Title</label>
                  <input
                    required
                    value={gameForm.title}
                    onChange={(e) => setGameForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. God of War Ragnarök"
                    className="
                      w-full rounded-2xl border border-white/10 bg-white/5 px-6
                      py-5 text-lg font-bold text-white transition-all
                      outline-none
                      focus:border-ps-accent-end/50 focus:bg-white/10
                    "
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || successMessage !== null}
                  className={`
                    flex w-full items-center justify-center gap-3 rounded-[2rem]
                    py-5 text-xs font-black tracking-[0.4em] text-white uppercase
                    shadow-[0_20px_50px_rgba(0,102,255,0.4)] transition-all
                    hover:scale-[1.01]
                    active:scale-[0.99]
                    disabled:opacity-50
                    ${successMessage ? `
                      bg-linear-to-r from-ps-accent-end to-ps-accent-end
                    ` : `
                      bg-linear-to-r from-ps-accent-start to-ps-accent-end
                    `}
                  `}
                >
                  {submitting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : successMessage ? (
                    <CircleCheckBig size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                  {successMessage || "Add Game to Account"}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="
                  text-xs font-black tracking-[0.4em] text-white/40 uppercase
                ">Collection ({currentAccount.games?.length || 0})</h3>
                <button
                  onClick={() => setIsAddingGame(true)}
                  className="
                    flex items-center gap-2 rounded-full border
                    border-ps-accent-end/20 bg-ps-accent-end/10 px-6 py-3
                    text-[10px] font-black tracking-widest text-ps-accent-end
                    uppercase shadow-lg transition-all
                    hover:bg-ps-accent-end hover:text-white
                  "
                >
                  <Plus size={16} /> Add Game
                </button>
              </div>

              {currentAccount.games && currentAccount.games.length > 0 ? (
                <div className="
                  grid grid-cols-2 gap-6
                  sm:grid-cols-3
                  md:grid-cols-4
                ">
                  {currentAccount.games.map((game) => (
                    <div key={game.id} className="
                      group relative aspect-3/4 overflow-hidden rounded-2xl
                      border border-white/5 bg-white/5 shadow-2xl
                    ">
                      <Image src={game.imageUrl} alt={game.title} fill className="
                        object-cover transition-transform duration-700
                        group-hover:scale-110
                      " unoptimized />
                      <div className="
                        absolute inset-0 bg-linear-to-t from-black via-black/20
                        to-transparent opacity-80
                      " />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h4 className="
                          mb-2 line-clamp-2 text-xs font-black tracking-tight
                          text-white uppercase
                        ">{game.title}</h4>
                        <button 
                          onClick={() => handleDeleteGame(game.id)}
                          className="
                            rounded-lg bg-red-500/10 p-2 text-red-500 opacity-0
                            transition-opacity
                            group-hover:opacity-100
                            hover:bg-red-500 hover:text-white
                          "
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="
                  flex flex-col items-center justify-center gap-6 rounded-[3rem]
                  border-2 border-dashed border-white/5 bg-white/2 py-20
                ">
                  <div className="
                    flex size-20 items-center justify-center rounded-full
                    bg-white/5 text-white/10
                  ">
                    <Gamepad2 size={40} />
                  </div>
                  <div className="text-center">
                    <p className="
                      mb-1 text-lg font-black tracking-widest text-white/40
                      uppercase
                    ">No Games Found</p>
                    <p className="
                      text-[10px] tracking-[0.2em] text-white/20 uppercase
                    ">Start by adding the first game to this vault</p>
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
