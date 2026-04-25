"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Gamepad2, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import SplitText from "@/components/SplitText";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-[#050505]">
      
      {/* Full Page Aurora Background */}
      <div className="absolute inset-0 z-0">
        <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={1.2} speed={0.5} />
      </div>
      
      {/* Subtle overlay for contrast */}
      <div className="absolute inset-0 bg-black/40 z-0 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-0 pointer-events-none" />

      {/* Glassmorphic Container */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-[2rem] overflow-hidden bg-black/20 backdrop-blur-2xl relative z-10 animate-fadeInUp shadow-[0_0_80px_rgba(0,112,209,0.3)] border border-white/10">
        
        {/* Left Side: Branding/Hero Panel */}
        <div className="flex w-full md:w-5/12 p-6 sm:p-8 flex-col justify-center md:justify-between relative overflow-hidden text-white border-b md:border-b-0 md:border-r border-white/10 min-h-[200px] md:min-h-0">
          
          {/* Inner Aurora Background */}
          <div className="absolute inset-0 z-0 opacity-80">
            <Aurora colorStops={["#00d2ff", "#0044ff", "#1a0b2e"]} blend={0.6} />
          </div>
          <div className="absolute inset-0 bg-black/30 z-0 mix-blend-overlay" />

          <div className="relative z-10 flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/30 shrink-0">
              <Gamepad2 size={20} className="text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-wide drop-shadow-md">GAMEHUB</span>
          </div>

          <div className="relative z-10 mt-2 md:mt-10 mb-auto">
            <SplitText
              text="All your games. One ultimate vault."
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-2 md:mb-4 drop-shadow-lg inline-block text-white"
              delay={40}
              from={{ opacity: 0, transform: 'translate3d(0, 30px, 0)' }}
              to={{ opacity: 1, transform: 'translate3d(0, 0, 0)' }}
            />
            <p className="text-white/80 text-xs sm:text-sm max-w-[280px] leading-relaxed drop-shadow animate-fadeInUp" style={{ animationDelay: "1s" }}>
              Store your credentials for PlayStation, Xbox, Steam, and PC in one secure place. Never lose track of your purchases across a gazillion providers again.
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-7/12 p-8 md:p-10 flex flex-col justify-center relative">
          
          <div className="max-w-sm w-full mx-auto">
            <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">Login to GameHub</h2>
            <p className="text-sm text-white/70 mb-6 flex items-center gap-1.5">
              Don't have an account?
              <Link href="/register" className="text-[#00d2ff] font-semibold hover:text-white transition-colors">
                Register
              </Link>
            </p>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl mb-6 text-sm font-semibold animate-fadeInUp bg-red-500/20 border border-red-500/30 text-white backdrop-blur-md">
                <ShieldAlert size={18} className="shrink-0 text-red-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-20">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest ml-1 text-white/80">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 outline-none placeholder:text-white/30 focus:border-[#00d2ff]/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(0,210,255,0.2)] bg-black/40 border border-white/10 text-white backdrop-blur-md"
                  placeholder="player@gamehub.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-widest ml-1 text-white/80">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 outline-none placeholder:text-white/30 tracking-widest focus:border-[#00d2ff]/50 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(0,210,255,0.2)] bg-black/40 border border-white/10 text-white backdrop-blur-md"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed group relative overflow-hidden mt-8 bg-gradient-to-r from-[#0044ff] to-[#00d2ff] text-white shadow-[0_10px_30px_rgba(0,112,209,0.5)] border border-white/20"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
                <span className="relative z-10 flex items-center gap-2 drop-shadow-md">
                  {loading ? <Loader2 size={20} className="animate-spin" /> : "Enter Vault"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
