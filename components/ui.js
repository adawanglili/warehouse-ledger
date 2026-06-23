export const CATEGORIES = [
  "Produce",
  "Meat & Seafood",
  "Dairy",
  "Pantry",
  "Frozen",
  "Bakery",
  "Household",
  "Other",
];

export const CAT_COLOR = {
  "Produce": "#5B7553",
  "Meat & Seafood": "#A8453E",
  "Dairy": "#C9A24B",
  "Pantry": "#8A6E4B",
  "Frozen": "#4B7C92",
  "Bakery": "#B86B3F",
  "Household": "#6B6470",
  "Other": "#8A8378",
};

export function fmtMoney(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  return "$" + Number(n).toFixed(2);
}

export function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "var(--font-body)",
  background: "#FFFEFC",
  outline: "none",
  color: "var(--color-ink)",
};

export const labelStyle = {
  display: "block",
  fontSize: 11.5,
  fontWeight: 600,
  color: "var(--color-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: 6,
};

export const primaryBtn = {
  padding: "10px 16px",
  background: "var(--color-ink)",
  color: "var(--color-cream)",
  border: "none",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
};

export const ghostBtn = {
  padding: "10px 16px",
  background: "#fff",
  color: "var(--color-muted)",
  border: "1.5px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 13.5,
  fontWeight: 600,
};

export const iconBtn = {
  background: "none",
  border: "none",
  padding: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const listRow = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  background: "#fff",
  border: "1px solid var(--color-border-soft)",
  borderRadius: 9,
};

export function SectionHeading({ eyebrow, title }) {
  return (
    <div style={{ margin: "20px 0 16px" }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          color: "var(--color-rust)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {eyebrow}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 23,
          fontWeight: 600,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h1>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "36px 20px",
        color: "var(--color-muted-soft)",
        fontSize: 13.5,
        background: "#fff",
        border: "1px dashed var(--color-border)",
        borderRadius: 10,
      }}
    >
      {text}
    </div>
  );
}
