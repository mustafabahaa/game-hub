"use client";

import { useState, useRef } from "react";
import { Account } from "@/types/account";
import { Provider } from "@/types/provider";
import { Eye, Copy, Check, ExternalLink, KeyRound, Shield, Crown, MessageCircle, Link as LinkIcon, Info, Pencil, Trash2, Monitor, Gamepad2, Smartphone } from "lucide-react";

interface GameCardProps {
  account: Account;
  provider?: Provider;
  index: number;
  isAdmin?: boolean;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
}

export default function GameCard({ account, provider, index, isAdmin, onEdit, onDelete }: GameCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const badgeClass =
    account.accountType === "Primary"
      ? "badge-primary"
      : account.accountType === "Secondary"
      ? "badge-secondary"
      : "badge-full";
  
  const PlatformIcon = account.platform === "PlayStation" ? Gamepad2 : account.platform === "Xbox" ? Shield : Monitor;

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`card-glow ${account.isPsPlus ? "card-glow-plus" : ""} rounded-3xl overflow-hidden animate-fadeInUp flex flex-col relative group/card`}
      style={{
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        background: "rgba(10, 10, 15, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Interactive Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 z-50"
        style={{
          opacity,
          background: account.isPsPlus 
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,215,0,0.15), transparent 40%)`
            : account.platform === "Xbox"
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16,124,16,0.15), transparent 40%)`
            : `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,210,255,0.15), transparent 40%)`,
        }}
      />
      {/* Game Image */}
      <div className="relative aspect-[3/4] overflow-hidden group bg-zinc-900/50">
        {!isImageLoaded && (
          <div className="absolute inset-0 skeleton z-10" />
        )}
        <img
          src={account.imageUrl}
          alt={account.gameTitle}
          onLoad={() => setIsImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-1000 ${isImageLoaded ? "scale-100 blur-0 opacity-100" : "scale-110 blur-2xl opacity-0"} group-hover:scale-110 group-hover:rotate-1`}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />

        {account.isPsPlus && (
          <div
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FFA500)",
              color: "#1a1a00",
              boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)"
            }}
          >
            <Crown size={14} />
            PS Plus
          </div>
        )}

        {account.platform === "PlayStation" && account.accountType && (
          <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${badgeClass}`}>
            {account.accountType}
          </div>
        )}

        {isAdmin && (
          <div className="absolute top-14 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(account);
              }}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[#00d2ff]/40 hover:text-[#00d2ff] transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(account.id);
              }}
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-red-500/40 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-5 transform transition-transform duration-500 group-hover:-translate-y-2">
          <div className="flex items-center gap-2 mb-1">
            <PlatformIcon size={14} className="text-white/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{account.platform}</span>
          </div>
          <h3 className="text-xl font-black text-white leading-tight drop-shadow-2xl">
            {account.gameTitle}
          </h3>
          {provider && (
            <p className="text-xs mt-1.5 font-semibold tracking-wide uppercase text-white/50">
              Provider: <span className="text-[#00d2ff]">{provider.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-[#050505] to-black/60 relative z-10">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
          style={{
            background: showCredentials
              ? "rgba(255, 255, 255, 0.05)"
              : account.isPsPlus
              ? "linear-gradient(135deg, #FFD700, #FFA500)"
              : "linear-gradient(135deg, #0044ff, #00d2ff)",
            color: showCredentials ? "white" : account.isPsPlus ? "#1a1a00" : "#fff",
            boxShadow: showCredentials ? "none" : account.isPsPlus ? "0 10px 20px rgba(255, 215, 0, 0.3)" : "0 10px 20px rgba(0, 112, 209, 0.3)",
            border: showCredentials ? "1px solid rgba(255, 255, 255, 0.1)" : "none"
          }}
        >
          {!showCredentials && (
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          )}
          {showCredentials ? (
            <>
              <Shield size={16} />
              Vault Locked
            </>
          ) : (
            <>
              <Eye size={16} />
              Access Vault
            </>
          )}
        </button>

        {showCredentials && (
          <div className="mt-3 space-y-2.5 animate-slideDown">
            <CredentialRow
              label="Email"
              value={account.email}
              field="email"
              copiedField={copiedField}
              onCopy={handleCopy}
            />
            
            {account.password ? (
              <CredentialRow
                label="Password"
                value={account.password}
                field="password"
                copiedField={copiedField}
                onCopy={handleCopy}
                isSecret
              />
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(255, 215, 0, 0.1)", border: "1px solid rgba(255, 215, 0, 0.3)" }}>
                <Info size={14} style={{ color: "var(--color-ps-plus-gold-light)" }} />
                <span style={{ color: "var(--color-ps-plus-gold-light)" }}>OTA Sign-in (Contact Provider)</span>
              </div>
            )}
            
            {account.otpSecret && (
              <CredentialRow
                label="OTP Secret"
                value={account.otpSecret}
                field="otp"
                copiedField={copiedField}
                onCopy={handleCopy}
                isSecret
              />
            )}

            {/* Provider Links */}
            {provider && (provider.website || provider.whatsapp || provider.facebook) && (
              <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid var(--color-ps-border)" }}>
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all hover:brightness-125"
                    style={{ background: "var(--color-ps-bg-elevated)", color: "var(--color-ps-text-primary)" }}
                  >
                    <ExternalLink size={12} /> Website
                  </a>
                )}
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all hover:brightness-125"
                    style={{ background: "var(--color-ps-bg-elevated)", color: "#25D366" }}
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
                {provider.facebook && (
                  <a
                    href={provider.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] uppercase font-bold transition-all hover:brightness-125"
                    style={{ background: "var(--color-ps-bg-elevated)", color: "#1877F2" }}
                  >
                    <LinkIcon size={12} /> Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  field,
  copiedField,
  onCopy,
  isSecret = false,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  isSecret?: boolean;
}) {
  const [revealed, setRevealed] = useState(!isSecret);

  return (
    <div
      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs"
      style={{ background: "var(--color-ps-bg-elevated)" }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <KeyRound size={14} className="shrink-0" style={{ color: "var(--color-ps-text-muted)" }} />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] uppercase tracking-wider" style={{ color: "var(--color-ps-text-muted)" }}>
            {label}
          </span>
          <span className="block truncate" style={{ color: "var(--color-ps-text-primary)" }}>
            {isSecret && !revealed ? "••••••••••" : value}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isSecret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="p-1.5 rounded-md transition-colors hover:bg-white/5 cursor-pointer"
            title={revealed ? "Hide" : "Reveal"}
          >
            <Eye size={14} style={{ color: "var(--color-ps-text-muted)" }} />
          </button>
        )}
        <button
          onClick={() => onCopy(value, field)}
          className="p-1.5 rounded-md transition-colors hover:bg-white/5 cursor-pointer"
          title="Copy"
        >
          {copiedField === field ? (
            <Check size={14} style={{ color: "var(--color-ps-success)" }} />
          ) : (
            <Copy size={14} style={{ color: "var(--color-ps-text-muted)" }} />
          )}
        </button>
      </div>
    </div>
  );
}
