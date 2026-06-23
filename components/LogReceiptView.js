"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { SectionHeading, inputStyle, labelStyle, primaryBtn, ghostBtn, iconBtn } from "./ui";
import { todayISO } from "./ui";
import { findOrCreateItem, addPriceEntry, markPurchasedByItemId } from "@/lib/data";

let rowCounter = 0;
const newRowId = () => `row-${Date.now()}-${rowCounter++}`;

export default function LogReceiptView({ refresh, showToast }) {
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([{ id: newRowId(), name: "", price: "" }]);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saving, setSaving] = useState(false);

  const addRow = () => setRows((r) => [...r, { id: newRowId(), name: "", price: "" }]);
  const updateRow = (id, field, val) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: val } : row)));
  const removeRow = (id) => setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));

  const parsePaste = () => {
    const lines = pasteText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = [];
    for (const line of lines) {
      const m = line.match(/^(.+?)\s+\$?(\d+\.\d{2})\s*$/);
      if (m) {
        parsed.push({ id: newRowId(), name: m[1].trim(), price: m[2] });
      }
    }
    if (parsed.length) {
      setRows(parsed);
      setPasteMode(false);
      setPasteText("");
    } else {
      showToast("Couldn't find any lines like 'Item name 12.99'");
    }
  };

  const submitReceipt = async () => {
    const validRows = rows.filter((r) => r.name.trim() && r.price && !isNaN(parseFloat(r.price)));
    if (!validRows.length) {
      showToast("Add at least one item with a price");
      return;
    }
    setSaving(true);
    try {
      const receiptId = crypto.randomUUID();
      for (const r of validRows) {
        const item = await findOrCreateItem({ name: r.name.trim() });
        await addPriceEntry({ itemId: item.id, date, price: parseFloat(r.price), receiptId });
        await markPurchasedByItemId(item.id);
      }
      setRows([{ id: newRowId(), name: "", price: "" }]);
      showToast(`Logged ${validRows.length} item${validRows.length === 1 ? "" : "s"} from receipt`);
      refresh();
    } catch (e) {
      showToast("Something went wrong saving the receipt");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeading eyebrow="New entry" title="Log a receipt" />

      <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: 16 }}>
        <label style={labelStyle}>Purchase date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ ...inputStyle, marginBottom: 14, maxWidth: 200 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Items</label>
          <button onClick={() => setPasteMode((p) => !p)} style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12 }}>
            {pasteMode ? "Type instead" : "Paste from photo text"}
          </button>
        </div>

        {pasteMode ? (
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Paste lines like:\nORG SPINACH 4.99\nKIRKLAND BACON 14.97"}
              style={{ ...inputStyle, minHeight: 110, fontFamily: "var(--font-mono)", fontSize: 13, resize: "vertical" }}
            />
            <button onClick={parsePaste} style={{ ...primaryBtn, marginTop: 10 }}>
              Parse lines
            </button>
          </div>
        ) : (
          <>
            {rows.map((row) => (
              <div key={row.id} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
                <input
                  value={row.name}
                  onChange={(e) => updateRow(row.id, "name", e.target.value)}
                  placeholder="Item name"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  value={row.price}
                  onChange={(e) => updateRow(row.id, "price", e.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                  style={{ ...inputStyle, width: 78, fontFamily: "var(--font-mono)" }}
                />
                <button onClick={() => removeRow(row.id)} style={iconBtn}>
                  <X size={15} color="var(--color-muted-soft)" />
                </button>
              </div>
            ))}
            <button onClick={addRow} style={{ ...ghostBtn, fontSize: 12.5, padding: "6px 10px" }}>
              <Plus size={13} style={{ marginRight: 4, verticalAlign: -2 }} /> Add row
            </button>
          </>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--color-border-soft)" }}>
          <button onClick={submitReceipt} style={{ ...primaryBtn, width: "100%" }} disabled={saving}>
            {saving ? "Saving…" : "Save receipt"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: "var(--color-muted-soft)", marginTop: 14, lineHeight: 1.6 }}>
        Tip: send your receipt photo to Claude in a chat and ask it to list items and prices as plain
        text — then paste that list here with &ldquo;Paste from photo text.&rdquo;
      </p>
    </div>
  );
}
