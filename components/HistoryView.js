"use client";

import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, TrendingUp, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { CAT_COLOR, fmtMoney, fmtDate, SectionHeading, EmptyState, ghostBtn } from "./ui";

export default function HistoryView({ items, priceHistory }) {
  const [selectedId, setSelectedId] = useState(null);

  const itemsWithHistory = useMemo(() => {
    const ids = new Set(priceHistory.map((h) => h.item_id));
    return Array.from(ids)
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, priceHistory]);

  if (itemsWithHistory.length === 0) {
    return (
      <div className="fade-in">
        <SectionHeading eyebrow="Price trends" title="Purchase history" />
        <EmptyState text="No purchases logged yet. Log a receipt to start building price history." />
      </div>
    );
  }

  const selected = selectedId ? items.find((it) => it.id === selectedId) : null;

  if (selected) {
    return (
      <ItemDetail
        item={selected}
        history={priceHistory.filter((h) => h.item_id === selected.id)}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  return (
    <div className="fade-in">
      <SectionHeading eyebrow="Price trends" title="Purchase history" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {itemsWithHistory.map((item) => {
          const hist = priceHistory
            .filter((h) => h.item_id === item.id)
            .sort((a, b) => (a.date < b.date ? 1 : -1));
          const latest = hist[0];
          const prev = hist[1];
          const trend = prev ? latest.price - prev.price : 0;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className="row-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid var(--color-border)",
                borderRadius: 9,
                textAlign: "left",
                width: "100%",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: CAT_COLOR[item.category] || "#8A8378",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14.5 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted-soft)", marginTop: 1 }}>
                  {hist.length} purchase{hist.length === 1 ? "" : "s"} · last {fmtDate(latest.date)}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14.5 }}>
                  {fmtMoney(latest.price)}
                </span>
                <TrendIcon trend={trend} />
              </div>
              <ChevronRight size={16} color="#C7C0B0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrendIcon({ trend }) {
  if (!trend) return <Minus size={14} color="#C7C0B0" />;
  if (trend > 0) return <TrendingUp size={14} color="var(--color-rust)" />;
  return <TrendingDown size={14} color="#5B7553" />;
}

function ItemDetail({ item, history, onBack }) {
  const hist = useMemo(
    () => [...history].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [history]
  );

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yearHist = hist.filter((h) => new Date(h.date + "T00:00:00") >= oneYearAgo);

  const chartData = yearHist.map((h) => ({ price: h.price, label: fmtDate(h.date) }));
  const prices = yearHist.map((h) => h.price);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  return (
    <div className="fade-in">
      <button
        onClick={onBack}
        style={{ ...ghostBtn, marginBottom: 14, display: "flex", alignItems: "center", gap: 5, padding: "6px 10px" }}
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: CAT_COLOR[item.category] || "#8A8378" }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {item.category}
        </span>
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: "0 0 18px" }}>
        {item.name}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        <StatCard label="Lowest" value={fmtMoney(min)} color="#5B7553" />
        <StatCard label="Average" value={fmtMoney(avg)} color="var(--color-ink)" />
        <StatCard label="Highest" value={fmtMoney(max)} color="var(--color-rust)" />
      </div>

      {chartData.length >= 2 ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: "16px 8px 8px",
            marginBottom: 20,
            height: 220,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 14, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#F0EBDE" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#A39C8C" }}
                axisLine={{ stroke: "#E8E2D2" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#A39C8C" }}
                axisLine={false}
                tickLine={false}
                width={42}
                tickFormatter={(v) => "$" + v}
              />
              <Tooltip
                formatter={(v) => [fmtMoney(v), "Price"]}
                contentStyle={{ fontSize: 12.5, borderRadius: 8, border: "1px solid #E8E2D2" }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#A8453E"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#A8453E" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState text="Need at least 2 purchases to chart a trend." />
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 8 }}>All purchases</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[...hist].reverse().map((h) => (
          <div
            key={h.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "9px 12px",
              background: "#fff",
              border: "1px solid var(--color-border-soft)",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <span style={{ color: "var(--color-muted)" }}>{fmtDate(h.date)}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{fmtMoney(h.price)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "12px 10px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--color-muted-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color }}>{value}</div>
    </div>
  );
}
