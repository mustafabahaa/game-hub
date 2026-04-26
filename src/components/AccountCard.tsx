"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Account } from "@/types/account";
import { Provider } from "@/types/provider";
import { Eye, Copy, Check, ExternalLink, KeyRound, Shield, Crown, MessageCircle, Link as LinkIcon, Info, Pencil, Trash2, Monitor, Gamepad2 } from "lucide-react";

interface AccountCardProps {
  account: Account;
  provider?: Provider;
  index: number;
  onEdit?: (account: Account) => void;
  onDelete?: (id: string) => void;
  onViewDetails?: (account: Account) => void;
}

export default function AccountCard({ account, provider, index, onEdit, onDelete, onViewDetails }: AccountCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const canViewPassword = account.canViewPassword ?? true;
  const canViewOtp = account.canViewOtp ?? true;

  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

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
  const expiryToneClass = account.lifecycleType === "lifetime" ? "text-white/40" : "text-amber-300";

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`
        card-glow
        ${account.isPsPlus ? "card-glow-plus" : ""}
        group/card relative w-full flex flex-col overflow-hidden
        rounded-3xl
      `}
      style={{
        animationDelay: `${index * 0.07}s`,
        background: "rgba(10, 10, 15, 0.4)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.05)",
        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Interactive Spotlight */}
      <div
        className="
          pointer-events-none absolute -inset-px z-50 rounded-3xl opacity-0
          transition-opacity duration-300
        "
        style={{
          opacity,
          background: account.isPsPlus 
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,215,0,0.15), transparent 40%)`
            : account.platform === "Xbox"
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(16,124,16,0.15), transparent 40%)`
            : `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(0,210,255,0.15), transparent 40%)`,
        }}
      />
      {/* Game Image Collage */}
      <div 
        className="
          group relative aspect-3/4 cursor-pointer overflow-hidden
          bg-zinc-900/50
        "
        onClick={() => onViewDetails?.(account)}
      >
        {account.games && account.games.length > 0 ? (
          <div className={`
            grid h-full
            ${
            account.games.length === 1 ? 'grid-cols-1' : 
            account.games.length === 2 ? 'grid-cols-2' : 
            'grid-cols-2 grid-rows-2'
          }
          `}>
            {account.games.slice(0, 4).map((game) => (
              <div key={game.id} className="
                relative size-full overflow-hidden border-[0.5px] border-white/5
              ">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  className="
                    object-cover transition-transform duration-700
                    group-hover:scale-110
                  "
                  unoptimized
                />
              </div>
            ))}
            {account.games.length > 4 && (
              <div className="
                absolute right-2 bottom-2 z-20 rounded-md border border-white/10
                bg-black/80 px-2 py-1 text-[8px] font-black tracking-widest
                text-white uppercase backdrop-blur-md
              ">
                +{account.games.length - 4} More
              </div>
            )}
          </div>
        ) : (
          <div className="
            flex h-full flex-col items-center justify-center gap-3 text-white/10
          ">
            <div className="
              flex size-16 items-center justify-center rounded-full bg-white/5
            ">
              <Gamepad2 size={32} />
            </div>
            <span className="
              text-[10px] font-black tracking-widest uppercase opacity-50
            ">Empty Account</span>
          </div>
        )}
        <div className="
          absolute inset-0 bg-linear-to-t from-[#050505] via-transparent
          to-transparent opacity-80
        " />

        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
          {account.isPsPlus && (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-lg"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FFA500)",
                color: "#1a1a00",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.3)",
              }}
            >
              <Crown size={14} />
              PS Plus
            </div>
          )}

          {account.platform === "PlayStation" && account.accountType && (
            <div className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-lg ${badgeClass}`}>
              {account.accountType}
            </div>
          )}
        </div>

        {(onEdit || onDelete) && (
          <div className="
            absolute top-4 right-4 z-20 flex gap-2 opacity-0 transition-opacity
            duration-300
            group-hover:opacity-100
          ">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(account);
                  }}
                  className="
                    flex size-8 items-center justify-center rounded-full border
                    border-white/20 bg-black/60 text-white backdrop-blur-md
                    transition-colors
                    hover:bg-ps-accent-end/40 hover:text-ps-accent-end
                  "
                >
                  <Pencil size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(account.id);
                  }}
                  className="
                    flex size-8 items-center justify-center rounded-full border
                    border-white/20 bg-black/60 text-white backdrop-blur-md
                    transition-colors
                    hover:bg-red-500/40 hover:text-red-400
                  "
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
        )}

        <div className="
          absolute inset-x-0 bottom-0 transform p-5 transition-transform
          duration-500
          group-hover:-translate-y-2
        ">
          <div className="mb-1 flex items-center gap-2">
            <PlatformIcon size={14} className="text-white/40" />
            <span className="
              text-[10px] font-black tracking-widest text-white/40 uppercase
            ">{account.platform}</span>
          </div>
          <h3 className="text-xl/tight font-black text-white drop-shadow-2xl">
            {account.accountName}
          </h3>
          {account.games && account.games.length > 0 && (
            <p className="
              mt-1 line-clamp-1 text-[9px] font-bold tracking-wider
              text-white/30 uppercase
            ">
              {account.games.length} {account.games.length === 1 ? 'Game' : 'Games'} included
            </p>
          )}
          {provider && (
            <p className="
              mt-1.5 text-xs font-semibold tracking-wide text-white/50 uppercase
            ">
              Provider: <span className="text-ps-accent-end">{provider.name}</span>
            </p>
          )}
          <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${expiryToneClass}`}>
            {account.lifecycleType === "lifetime"
              ? "Life: Lifetime"
              : `Expires: ${account.expiresOn || "Not set"}`}
          </p>
        </div>
      </div>

      {/* Action Area */}
      <div className="
        relative z-10 flex flex-1 flex-col bg-linear-to-b from-[#050505]
        to-black/60 p-5
      ">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="
            group relative flex w-full items-center justify-center gap-2
            overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-bold
            tracking-wide transition-all duration-300
            hover:scale-[1.02]
            active:scale-[0.98]
          "
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
            <div className="
              pointer-events-none absolute inset-0 -translate-x-full
              bg-linear-to-r from-transparent via-white/30 to-transparent
              group-hover:animate-[shimmer_1.5s_infinite]
            " />
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
          <div className="mt-3 animate-slideDown space-y-2.5">
            <CredentialRow
              label="Email"
              value={account.email}
              field="email"
              copiedField={copiedField}
              onCopy={handleCopy}
            />

            {account.password && canViewPassword ? (
              <CredentialRow
                label="Password"
                value={account.password}
                field="password"
                copiedField={copiedField}
                onCopy={handleCopy}
                isSecret
              />
            ) : account.password && !canViewPassword ? (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <Info size={14} style={{ color: "var(--color-ps-text-muted)" }} />
                <span style={{ color: "var(--color-ps-text-muted)" }}>Password hidden by owner</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ background: "rgba(255, 215, 0, 0.1)", border: "1px solid rgba(255, 215, 0, 0.3)" }}
              >
                <Info size={14} style={{ color: "var(--color-ps-plus-gold-light)" }} />
                <span style={{ color: "var(--color-ps-plus-gold-light)" }}>OTA Sign-in (Contact Provider)</span>
              </div>
            )}

            {account.otpSecret && canViewOtp && (
              <CredentialRow
                label="OTP Secret"
                value={account.otpSecret}
                field="otp"
                copiedField={copiedField}
                onCopy={handleCopy}
                isSecret
              />
            )}
            {account.otpSecret && !canViewOtp && (
              <div
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <Info size={14} style={{ color: "var(--color-ps-text-muted)" }} />
                <span style={{ color: "var(--color-ps-text-muted)" }}>OTP secret hidden by owner</span>
              </div>
            )}

            {/* Provider Links */}
            {provider && (provider.website || provider.whatsapp || provider.facebook) && (
              <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: "1px solid var(--color-ps-border)" }}>
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex flex-1 items-center justify-center gap-1.5 rounded-lg
                      px-2 py-1.5 text-[10px] font-bold uppercase transition-all
                      hover:brightness-125
                    "
                    style={{ background: "var(--color-ps-bg-elevated)", color: "var(--color-ps-text-primary)" }}
                  >
                    <ExternalLink size={12} /> Website
                  </a>
                )}
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/20${provider.whatsapp.replace(/[^0-9]/g, "").replace(/^20/, "").replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      flex flex-1 items-center justify-center gap-1.5 rounded-lg
                      px-2 py-1.5 text-[10px] font-bold uppercase transition-all
                      hover:brightness-125
                    "
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
                    className="
                      flex flex-1 items-center justify-center gap-1.5 rounded-lg
                      px-2 py-1.5 text-[10px] font-bold uppercase transition-all
                      hover:brightness-125
                    "
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
      className="
        flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs
      "
      style={{ background: "var(--color-ps-bg-elevated)" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <KeyRound size={14} className="shrink-0" style={{ color: "var(--color-ps-text-muted)" }} />
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] tracking-wider uppercase" style={{ color: "var(--color-ps-text-muted)" }}>
            {label}
          </span>
          <span className="block truncate" style={{ color: "var(--color-ps-text-primary)" }}>
            {isSecret && !revealed ? "••••••••••" : value}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isSecret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="
              cursor-pointer rounded-md p-1.5 transition-colors
              hover:bg-white/5
            "
            title={revealed ? "Hide" : "Reveal"}
          >
            <Eye size={14} style={{ color: "var(--color-ps-text-muted)" }} />
          </button>
        )}
        <button
          onClick={() => onCopy(value, field)}
          className="
            cursor-pointer rounded-md p-1.5 transition-colors
            hover:bg-white/5
          "
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
