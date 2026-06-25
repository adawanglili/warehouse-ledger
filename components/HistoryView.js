"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, ChevronRight, ChevronLeft, Search, X } from "lucide-react";
import { CAT_COLOR, fmtMoney, fmtDate, SectionHeading, EmptyState, ghostBtn, inputStyle } from "./ui";

const SORT_OPTIONS = [
  { value: "alpha", label: "A → Z" },
  { value: "purchases", label: "Most purchased" },
];

const DOT_COLORS = [
  "#A8453E","#4B7C92","#5B7553","#C9A24B","#B86B3F",
  "#6B6470","#8A6E4B","#7B5EA7","#2E7D82","#A0522D",
];

export default function HistoryView({ items, priceHistory }) {
  const [selectedId, setSelectedId] = useState(null);
  const [sort, setSort] = useState("purchases");
  const [overviewFilter, setOverviewFilter] = useState("");

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

  const multiPurchaseItems = useMemo(
    () => itemsWithHistory.filter((it) => (countMap[it.id] || 0) > 1),
    [itemsWithHistory, countMap]
  );

  const filteredOverviewItems = useMemo(() => {
    const q = overviewFilter.trim().toLowerCase();
    if (!q) return multiPurchaseItems;
    return multiPurchaseItems.filter((it) => it.name.toLowerCase().includes(q));
  }, [multiPurchaseItems, overviewFilter]);

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
                padding: "5px 12px", borderRadius: 6, fontSize: 12.5, fontWeight: 600,
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

      {/* Overview chart */}
      {multiPurchaseItems.length >= 2 && (
        <OverviewChart
          items={filteredOverviewItems}
          allItems={multiPurchaseItems}
          priceHistory={priceHistory}
          filter={overviewFilter}
          setFilter={setOverviewFilter}
        />
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

// ---------- Overview dot-plot chart ----------
// Custom SVG: X = item names, Y = price
// Each purchase = a dot; dots for same item connected by a vertical range line
// Tooltip on hover shows price + date
function OverviewChart({ items, allItems, priceHistory, filter, setFilter }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, item, price, date }
  const svgRef = useRef(null);

  const PADDING = { top: 24, right: 16, bottom: 60, left: 48 };
  const HEIGHT = 260;

  // Build per-item data
  const itemData = useMemo(() => {
    return items.map((item, i) => {
      const purchases = priceHistory
        .filter((h) => h.item_id === item.id)
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((h) => ({ price: Number(h.price), date: h.date }));
      return {
        item,
        purchases,
        color: DOT_COLORS[allItems.findIndex((it) => it.id === item.id) % DOT_COLORS.length],
        min: Math.min(...purchases.map((p) => p.price)),
        max: Math.max(...purchases.map((p) => p.price)),
      };
    });
  }, [items, priceHistory, allItems]);

  // Global Y range across all visible items
  const allPrices = itemData.flatMap((d) => d.purchases.map((p) => p.price));
  const yMin = allPrices.length ? Math.floor(Math.min(...allPrices) * 0.92) : 0;
  const yMax = allPrices.length ? Math.ceil(Math.max(...allPrices) * 1.05) : 10;

  const chartW = 680; // viewBox width, scales responsively
  const innerW = chartW - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const toY = (price) => PADDING.top + innerH - ((price - yMin) / (yMax - yMin || 1)) * innerH;
  const itemCount = itemData.length || 1;
  const slotW = innerW / itemCount;
  const toX = (i) => PADDING.left + slotW * i + slotW / 2;

  // Y axis ticks
  const yTicks = useMemo(() => {
    const range = yMax - yMin;
    const step = range <= 10 ? 2 : range <= 30 ? 5 : range <= 100 ? 10 : 20;
    const ticks = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yMin, yMax]);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = chartW / rect.width;
    const scaleY = HEIGHT / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let closest = null;
    let closestDist = 20; // px threshold in viewBox units

    itemData.forEach((d, i) => {
      const cx = toX(i);
      d.purchases.forEach((p) => {
        const cy = toY(p.price);
        const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { x: cx, y: cy, item: d.item, price: p.price, date: p.date, color: d.color };
        }
      });
    });
    setTooltip(closest);
  }, [itemData, toX, toY, chartW]);

  const handleMouseLeave = () => setTooltip(null);

  if (items.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <ChartHeader filter={filter} setFilter={setFilter} />
        <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted-soft)", fontSize: 13.5 }}>
          No items match &ldquo;{filter}&rdquo;
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "16px 12px 12px", marginBottom: 20 }}>
      <ChartHeader filter={filter} setFilter={setFilter} />

      <div style={{ position: "relative", userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartW} ${HEIGHT}`}
          style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Y grid lines + labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line
                x1={PADDING.left} y1={toY(v)}
                x2={chartW - PADDING.right} y2={toY(v)}
                stroke="#F0EBDE" strokeWidth={1}
              />
              <text
                x={PADDING.left - 6} y={toY(v)}
                textAnchor="end" dominantBaseline="middle"
                fontSize={11} fill="#A39C8C"
              >
                ${v}
              </text>
            </g>
          ))}

          {/* Per-item: range line + dots */}
          {itemData.map((d, i) => {
            const cx = toX(i);
            const yLow = toY(d.min);
            const yHigh = toY(d.max);
            const hasRange = d.min !== d.max;

            // Short label for X axis
            const label = d.item.name.length > 12 ? d.item.name.slice(0, 11) + "…" : d.item.name;

            return (
              <g key={d.item.id}>
                {/* Vertical range line */}
                {hasRange && (
                  <line
                    x1={cx} y1={yHigh} x2={cx} y2={yLow}
                    stroke={d.color} strokeWidth={2} strokeOpacity={0.25}
                  />
                )}

                {/* Purchase dots */}
                {d.purchases.map((p, j) => {
                  const cy = toY(p.price);
                  const isActive = tooltip && tooltip.item.id === d.item.id && tooltip.price === p.price && tooltip.date === p.date;
                  return (
                    <circle
                      key={j}
                      cx={cx} cy={cy} r={isActive ? 7 : 5}
                      fill={d.color}
                      stroke="#fff" strokeWidth={2}
                      style={{ transition: "r 0.1s" }}
                    />
                  );
                })}

                {/* X axis label */}
                <text
                  x={cx} y={HEIGHT - PADDING.bottom + 14}
                  textAnchor="middle" fontSize={10.5} fill="#A39C8C"
                  transform={`rotate(-30, ${cx}, ${HEIGHT - PADDING.bottom + 14})`}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip && (() => {
            const TW = 160, TH = 54;
            const tx = Math.min(Math.max(tooltip.x - TW / 2, PADDING.left), chartW - PADDING.right - TW);
            const ty = tooltip.y - TH - 12;
            return (
              <g>
                <rect x={tx} y={ty} width={TW} height={TH} rx={6} fill="#fff" stroke="#E8E2D2" strokeWidth={1} filter="url(#shadow)" />
                <text x={tx + 10} y={ty + 17} fontSize={12} fontWeight="700" fill="#2B2820">{tooltip.item.name}</text>
                <text x={tx + 10} y={ty + 32} fontSize={11} fill="#8A8378">{fmtDate(tooltip.date)}</text>
                <text x={tx + 10} y={ty + 47} fontSize={12} fontWeight="700" fill={tooltip.color}>{fmtMoney(tooltip.price)}</text>
              </g>
            );
          })()}

          <defs>
            <filter id="shadow" x="-10%" y="-20%" width="120%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
            </filter>
          </defs>
        </svg>
      </div>

      <div style={{ fontSize: 11, color: "var(--color-muted-soft)", marginTop: 4 }}>
        Each dot = one purchase · vertical line shows price range · hover a dot for details
      </div>
    </div>
  );
}

function ChartHeader({ filter, setFilter }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Price overview — items bought 2+ times
      </div>
      <div style={{ position: "relative", minWidth: 160 }}>
        <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#B5AFA3", pointerEvents: "none" }} />
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter items…"
          style={{ ...inputStyle, paddingLeft: 28, paddingTop: 7, paddingBottom: 7, fontSize: 13, width: "100%" }}
        />
        {filter && (
          <button
            onClick={() => setFilter("")}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", padding: 0, display: "flex" }}
          >
            <X size={13} color="#B5AFA3" />
          </button>
        )}
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
  const chartData = yearHist.map((h) => ({ price: Number(h.price), label: fmtDate(h.date) }));
  const prices = yearHist.map((h) => Number(h.price));
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;

  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ ...ghostBtn, marginBottom: 14, display: "flex", alignItems: "center", gap: 5, padding: "6px 10px" }}>
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
              <Tooltip formatter={(v) => [fmtMoney(v), "Price"]} contentStyle={{ fontSize: 12.5, borderRadius: 8, border: "1px solid #E8E2D2" }} />
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
