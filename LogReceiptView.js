"use client";

import { ListChecks, Receipt, BarChart3 } from "lucide-react";

export default function Header({ tab, setTab }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "var(--color-cream)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 26,
              letterSpacing: "-0.01em",
            }}
          >
            Warehouse Ledger
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--color-rust)",
              background: "var(--color-rust-soft)",
              padding: "2px 7px",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            COSTCO
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <NavTab icon={ListChecks} label="List" active={tab === "list"} onClick={() => setTab("list")} />
          <NavTab icon={Receipt} label="Log receipt" active={tab === "log"} onClick={() => setTab("log")} />
          <NavTab icon={BarChart3} label="History" active={tab === "history"} onClick={() => setTab("history")} />
        </div>
      </div>
    </div>
  );
}

function NavTab({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "10px 14px",
        background: "none",
        border: "none",
        borderBottom: active ? "2px solid var(--color-rust)" : "2px solid transparent",
        color: active ? "var(--color-ink)" : "var(--color-muted)",
        fontWeight: active ? 600 : 500,
        fontSize: 13.5,
        marginBottom: -1,
        transition: "color 0.15s",
      }}
    >
      <Icon size={15} strokeWidth={2.2} />
      {label}
    </button>
  );
}
