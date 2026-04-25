"use client";

export default function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-ps-bg-card)", border: "1px solid var(--color-ps-border)" }}
    >
      <div className="aspect-[3/4] skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-10 skeleton rounded-xl" />
      </div>
    </div>
  );
}
