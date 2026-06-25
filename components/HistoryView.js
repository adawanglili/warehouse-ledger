"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, Minus, ChevronRight, ChevronLeft } from "lucide-react";
import { CAT_COLOR, fmtMoney, fmtDate, SectionHeading, EmptyState, ghostBtn } from "./ui";

const SORT_OPTIONS = [
  { value: "alpha", label: "A → Z" },
  { value: "purchases", label: "Most purchased" },
];

const CHART_COLOR = "#A8453E";

export default function HistoryView({ items, priceHistory }) {
  const [selectedId, setSelectedId] = useState(null);
  const [sort, setSort] = useState("purchases");
  const [overviewItemId, setOverviewItemId] = useState("");

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

  const overviewItem = overviewItemId ? items.find((it) => it.id === overviewItemId) : null;

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

      {/* Overview panel */}
      {multiPurchaseItems.length >= 1 && (
        <OverviewPanel
          items={multiPurchaseItems}
          priceHistory={priceHistory}
          selectedItemId={overviewItemId}
          setSelectedItemId={setOverviewItemId}
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

// ---------- Overview panel ----------
function OverviewPanel({ items, priceHistory, selectedItemId, setSelectedItemId }) {
  const selectedItem = selectedItemId ? items.find((it) => it.id === selectedItemId) : null;

  const chartData = useMemo(() => {
    if (!selectedItem) return [];
    return priceHistory
      .filter((h) => h.item_id === selectedItem.id)
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((h) => ({ date: h.date, price: Number(h.price), label: fmtDate(h.date) }));
  }, [selectedItem, priceHistory]);

  const prices = chartData.map((d) => d.price);
  const min = prices.length ? Math.min(...prices) : null;
  const max = prices.length ? Math.max(...prices) : null;
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const netChange = prices.length >= 2 ? lastPrice - firstPrice : null;

  return (
    <div style={{
      background: "#fff", border: "1px solid var(--color-border)",
      borderRadius: 10, padding: "16px", marginBottom: 20,
    }}>
      {/* Dropdown */}
      <div style={{ marginBottom: selectedItem ? 16 : 0 }}>
        <select
          value={selectedItemId}
          onChange={(e) => setSelectedItemId(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1.5px solid var(--color-border)",
            borderRadius: 8,
            fontSize: 13.5,
            fontFamily: "var(--font-body)",
            background: "#FFFEFC",
            color: selectedItemId ? "var(--color-ink)" : "#B5AFA3",
            outline: "none",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23A39C8C' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
            paddingRight: 32,
            cursor: "pointer",
          }}
        >
          <option value="" disabled>Pick one item to review $ changes…</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>

      {/* Chart — only shown once an item is selected */}
      {selectedItem && chartData.length >= 2 && (
        <>
          {/* Item name as chart header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: CAT_COLOR[selectedItem.category] || "#8A8378", flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {selectedItem.name}
              </span>
            </div>
            {netChange !== null && (
              <div style={{ fontSize: 12.5, color: netChange > 0 ? "var(--color-rust)" : netChange < 0 ? "#5B7553" : "var(--color-muted)", marginTop: 3, marginLeft: 15, fontWeight: 600 }}>
                {netChange > 0 ? "▲" : netChange < 0 ? "▼" : "–"} {netChange > 0 ? "+" : ""}{fmtMoney(netChange)} since first purchase
              </div>
            )}
          </div>

          {/* Stat chips */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Chip label="Low" value={fmtMoney(min)} color="#5B7553" />
            <Chip label="High" value={fmtMoney(max)} color="var(--color-rust)" />
            <Chip label="Purchases" value={chartData.length} color="var(--color-ink)" />
          </div>

          {/* SVG dot + line chart */}
          <PriceDotChart data={chartData} />
        </>
      )}
    </div>
  );
}

// ---------- Custom SVG dot+line chart ----------
function PriceDotChart({ data }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const PADDING = { top: 32, right: 20, bottom: 44, left: 52 };
  const VW = 680;
  const VH = 240;
  const innerW = VW - PADDING.left - PADDING.right;
  const innerH = VH - PADDING.top - PADDING.bottom;

  const prices = data.map((d) => d.price);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const pad = (rawMax - rawMin) * 0.3 || 2;
  const yMin = Math.max(0, rawMin - pad);
  const yMax = rawMax + pad;

  const toX = (i) => PADDING.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const toY = (price) => PADDING.top + innerH - ((price - yMin) / (yMax - yMin)) * innerH;

  // Y axis ticks
  const yTicks = useMemo(() => {
    const range = yMax - yMin;
    const step = range <= 5 ? 1 : range <= 15 ? 2 : range <= 40 ? 5 : range <= 100 ? 10 : 20;
    const ticks = [];
    for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) ticks.push(v);
    return ticks;
  }, [yMin, yMax]);

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * VW;
    const my = ((e.clientY - rect.top) / rect.height) * VH;

    let closest = null;
    let closestDist = 25;
    data.forEach((d, i) => {
      const cx = toX(i);
      const cy = toY(d.price);
      const dist = Math.sqrt((mx - cx) ** 2 + (my - cy) ** 2);
      if (dist < closestDist) { closestDist = dist; closest = { i, cx, cy, ...d }; }
    });
    setTooltip(closest);
  }, [data]);

  // Build SVG polyline points
  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.price)}`).join(" ");

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <filter id="dshadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Y grid + labels */}
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PADDING.left} y1={toY(v)} x2={VW - PADDING.right} y2={toY(v)} stroke="#F0EBDE" strokeWidth={1} />
            <text x={PADDING.left - 8} y={toY(v)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill="#A39C8C">
              ${v}
            </text>
          </g>
        ))}

        {/* Connecting line */}
        {data.length >= 2 && (
          <polyline
            points={linePoints}
            fill="none"
            stroke={CHART_COLOR}
            strokeWidth={2}
            strokeOpacity={0.35}
            strokeLinejoin="round"
          />
        )}

        {/* Price labels above each dot */}
        {data.map((d, i) => {
          const cx = toX(i);
          const cy = toY(d.price);
          const isActive = tooltip && tooltip.i === i;
          return (
            <g key={i}>
              {/* Price label above dot */}
              <text
                x={cx} y={cy - 13}
                textAnchor="middle" fontSize={10.5}
                fontWeight="700" fill={CHART_COLOR}
                fontFamily="var(--font-mono)"
              >
                {fmtMoney(d.price)}
              </text>

              {/* Dot */}
              <circle
                cx={cx} cy={cy}
                r={isActive ? 8 : 6}
                fill={CHART_COLOR}
                stroke="#fff" strokeWidth={2.5}
                style={{ transition: "r 0.1s" }}
              />

              {/* X axis date label */}
              <text
                x={cx} y={VH - PADDING.bottom + 14}
                textAnchor="middle" fontSize={10}
                fill="#A39C8C"
                transform={data.length > 4 ? `rotate(-30, ${cx}, ${VH - PADDING.bottom + 14})` : undefined}
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Hover tooltip */}
        {tooltip && (() => {
          const TW = 158; const TH = 52;
          const tx = Math.min(Math.max(tooltip.cx - TW / 2, PADDING.left), VW - PADDING.right - TW);
          const ty = tooltip.cy - TH - 16;
          return (
            <g>
              <rect x={tx} y={ty} width={TW} height={TH} rx={6} fill="#fff" stroke="#E8E2D2" strokeWidth={1} filter="url(#dshadow)" />
              <text x={tx + 10} y={ty + 17} fontSize={11} fill="#8A8378">{fmtDate(tooltip.date)}</text>
              <text x={tx + 10} y={ty + 37} fontSize={13} fontWeight="700" fill={CHART_COLOR}>{fmtMoney(tooltip.price)}</text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

function Chip({ label, value, color }) {
  return (
    <div style={{ background: "#FAF7EF", border: "1px solid var(--color-border)", borderRadius: 7, padding: "5px 10px", display: "flex", gap: 5, alignItems: "baseline" }}>
      <span style={{ fontSize: 10.5, fontWeight: 600, color: "var(--color-muted-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, color }}>{value}</span>
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
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "var(--color-muted-soft)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 17, color }}>{value}</div>
    </div>
  );
}
