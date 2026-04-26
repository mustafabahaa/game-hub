"use client";

import Aurora from "@/components/Aurora";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="animate-fadeIn fixed inset-0 z-120 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 shadow-[0_0_100px_rgba(0,102,255,0.2)] backdrop-blur-3xl">
        <div className="pointer-events-none absolute inset-0 z-0 opacity-30">
          <Aurora colorStops={["#0066ff", "#0044ff", "#1a0b2e"]} blend={0.6} amplitude={0.5} />
        </div>

        <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-white/5 px-8 py-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/20 text-red-200 shadow-[0_10px_30px_rgba(239,68,68,0.25)] ring-1 ring-inset ring-white/10">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">{title}</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Confirm Action</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        <div className="relative z-10 space-y-8 p-8 lg:p-10">
          <p className="text-sm leading-relaxed text-white/75">{message}</p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="group relative overflow-hidden rounded-2xl border border-red-400/40 bg-linear-to-r from-red-600/70 to-red-500/70 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_35px_rgba(220,38,38,0.35)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                {loading ? "Deleting..." : confirmLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
