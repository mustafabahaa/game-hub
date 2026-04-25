"use client";

import { useState } from "react";
import { Account } from "@/types/account";
import { Provider } from "@/types/provider";
import { Eye, Copy, Check, ExternalLink, KeyRound, Shield, Crown, MessageCircle, Link as LinkIcon, Info } from "lucide-react";

interface GameCardProps {
  account: Account;
  provider?: Provider;
  index: number;
}

export default function GameCard({ account, provider, index }: GameCardProps) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  return (
    <div
      className={`card-glow ${account.isPsPlus ? "card-glow-plus" : ""} rounded-2xl overflow-hidden animate-fadeInUp`}
      style={{
        animationDelay: `${index * 0.07}s`,
        opacity: 0,
        background: "var(--color-ps-bg-card)",
        border: "1px solid var(--color-ps-border)",
      }}
    >
      {/* Game Image */}
      <div className="relative aspect-[3/4] overflow-hidden group">
        <img
          src={account.imageUrl}
          alt={account.gameTitle}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {account.isPsPlus && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: "linear-gradient(135deg, rgba(196,160,0,0.9), rgba(255,215,0,0.9))",
              color: "#1a1a00",
            }}
          >
            <Crown size={12} />
            PS Plus
          </div>
        )}

        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
          {account.accountType}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-lg">
            {account.gameTitle}
          </h3>
          {provider && (
            <p className="text-xs mt-1" style={{ color: "var(--color-ps-text-secondary)" }}>
              Provider: {provider.name}
            </p>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="p-4">
        <button
          onClick={() => setShowCredentials(!showCredentials)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer"
          style={{
            background: showCredentials
              ? "var(--color-ps-bg-elevated)"
              : account.isPsPlus
              ? "linear-gradient(135deg, var(--color-ps-plus-gold), var(--color-ps-plus-gold-light))"
              : "linear-gradient(135deg, var(--color-ps-accent-start), var(--color-ps-accent-end))",
            color: showCredentials ? "var(--color-ps-text-secondary)" : account.isPsPlus ? "#1a1a00" : "#fff",
          }}
        >
          {showCredentials ? (
            <>
              <Shield size={16} />
              Hide Credentials
            </>
          ) : (
            <>
              <Eye size={16} />
              View Credentials
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
