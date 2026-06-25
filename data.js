"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, Legend,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { CAT_COLOR, fmtMoney, fmtDate, SectionHeading, EmptyState, ghostBtn } from "./ui";

const SORT_OPTIONS = [
  { value: "alpha", label: "A → Z" },
  { value: "purchases", label: "Most purchased" },
];

// A palette of distinct lines for the overview chart
const LINE_COLORS = [
  "#A8453E","#4B7C92","#5B7553","#C9A24B","#B86B3F",
  "#6B6470","#8A6E4B","#7B5EA7","#2E7D82","#A0522D",
];

export default function HistoryView({ items, priceHistory }) {
  const [selectedId, setSelectedId] = useState(null);
  const [sort, setSort] = useState("purchases");

  const countMap = useMemo(() => {
    const m = {};
    priceHistory.forEach((h) => { m[h.item_id] = (m[h.item_id] || 0) + 1; });
    return m;
  }, [priceHistory]);

  const itemsWithHistory = useMemo(() => {
    const ids = new Set(priceHistory.map((h) => h.item_id));
    const list = Array.from(ids)
      .map((id) => items.find((it) => it.id === id))
      .filter(Boolean);

    if (sort === "alpha") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list.sort((a, b) => (countMap[b.id] || 0) - (countMap[a.id] || 0) || a.name.localeCompare(b.name));
  }, [items, priceHistory, sort, countMap]);

  // Items with 2+ purchases for the overview chart
  const multiPurchaseItems = useMemo(
    () => itemsWithHistory.filter((it) => (countMap[it.id] || 0) > 1),
    [itemsWithHistory, countMap]
  );

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

      {/* Sort control */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12.5, color: "var(--color-muted)", fontWeight: 500 }}>Sort by</span>
        <div style={{ display: "flex", gap: 4 }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 600,
                border: sort === opt.value ? "1.5px solid var(--color-ink)" : "1.5px solid var(--color-border)",
                background: sort === opt.value ? "var(--color-ink)" : "#fff",
                color: sort === opt.value ? "var(--color-cream)" : "var(--color-muted)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview chart — only shown when 2+ items have 2+ purchases */}
      {multiPurchaseItems.length >= 2 && (
        <OverviewChart items={multiPurchaseItems} priceHistory={priceHistory} />
      )}

      {/* Item list */}
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
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", background: "#fff",
                border: "1px solid var(--color-border)", borderRadius: 9,
                textAlign: "left", width: "100%",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 4, background: CAT_COLOR[item.category] || "#8A8378", flexShrink: 0 }} />
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

// ---------- Overview chart ----------
// X = item names, for each item shows grouped bars by purchase date
// so you can see price trends side by side across items
function OverviewChart({ items, priceHistory }) {
  // Build a dataset where each row is a purchase date,
  // and columns are item prices on that date (null if not bought that day)
  const allDates = useMemo(() => {
    const itemIds = new Set(items.map((it) => it.id));
    const dates = new Set(
      priceHistory.filter((h) => itemIds.has(h.item_id)).map((h) => h.date)
    );
    return Array.from(dates).sort();
  }, [items, priceHistory]);

  // For the bar chart: X = item names, Y = latest price, with a dot showing oldest
  // Actually build: one row per item, showing first price vs latest price
  const chartData = useMemo(() => {
    return items.map((item) => {
      const hist = priceHistory
        .filter((h) => h.item_id === item.id)
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      const first = hist[0];
      const latest = hist[hist.length - 1];
      const shortName = item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name;
      return {
        name: shortName,
        fullName: item.name,
        first: first ? Number(first.price) : null,
        latest: latest ? Number(latest.price) : null,
        change: latest && first ? Number((latest.price - first.price).toFixed(2)) : 0,
      };
    });
  }, [items, priceHistory]);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 10,
        padding: "16px 8px 10px",
        marginBottom: 20,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)", marginBottom: 12, paddingLeft: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Price overview — items bought 2+ times
      </div>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 10, bottom: 30, left: -10 }} barGap={2}>
            <CartesianGrid stroke="#F0EBDE" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#A39C8C" }}
              axisLine={{ stroke: "#E8E2D2" }}
              tickLine={false}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#A39C8C" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) => "$" + v}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div style={{ background: "#fff", border: "1px solid #E8E2D2", borderRadius: 8, padding: "8px 12px", fontSize: 12.5 }}>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.fullName}</div>
                    <div style={{ color: "#8A8378" }}>First: <span style={{ fontWeight: 600, color: "#2B2820" }}>{fmtMoney(d.first)}</span></div>
                    <div style={{ color: "#8A8378" }}>Latest: <span style={{ fontWeight: 600, color: "#2B2820" }}>{fmtMoney(d.latest)}</span></div>
                    <div style={{ marginTop: 4, fontWeight: 600, color: d.change > 0 ? "#A8453E" : d.change < 0 ? "#5B7553" : "#8A8378" }}>
                      {d.change > 0 ? "+" : ""}{fmtMoney(d.change)} since first purchase
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              iconSize={9}
              wrapperStyle={{ fontSize: 11.5, paddingBottom: 8 }}
            />
            <Bar dataKey="first" name="First price" fill="#D8D2C4" radius={[3, 3, 0, 0]} maxBarSize={28} />
            <Bar dataKey="latest" name="Latest price" radius={[3, 3, 0, 0]} maxBarSize={28}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.change > 0 ? "#A8453E" : entry.change < 0 ? "#5B7553" : "#C9A24B"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ fontSize: 11, color: "var(--color-muted-soft)", paddingLeft: 8, marginTop: 4 }}>
        Green = price dropped · Red = price went up · Tap an item below for full trend
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
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
        <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "16px 8px 8px", marginBottom: 20, height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 14, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="#F0EBDE" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#A39C8C" }} axisLine={{ stroke: "#E8E2D2" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#A39C8C" }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => "$" + v} />
              <Tooltip
                formatter={(v) => [fmtMoney(v), "Price"]}
                contentStyle={{ fontSize: 12.5, borderRadius: 8, border: "1px solid #E8E2D2" }}
              />
              <Line type="monotone" dataKey="price" stroke="#A8453E" strokeWidth={2.5} dot={{ r: 3.5, fill: "#A8453E" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState text="Need at least 2 purchases to chart a trend." />
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", marginBottom: 8 }}>All purchases</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[...hist].reverse().map((h) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: "#fff", border: "1px solid var(--color-border-soft)", borderRadius: 8, fontSize: 13 }}>
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
    <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--color-muted-soft)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color }}>{value}</div>
    </div>
  );
}
