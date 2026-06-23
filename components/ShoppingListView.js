"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import {
  CATEGORIES,
  CAT_COLOR,
  fmtMoney,
  fmtDate,
  SectionHeading,
  EmptyState,
  inputStyle,
  primaryBtn,
  ghostBtn,
  iconBtn,
  listRow,
} from "./ui";
import { findOrCreateItem, addToShoppingList, removeFromShoppingList } from "@/lib/data";

export default function ShoppingListView({ shoppingList, priceHistory, refresh, showToast }) {
  const [newName, setNewName] = useState("");
  const [newCat, setNewCat] = useState("Other");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const lastPrice = (itemId) => {
    const hist = priceHistory
      .filter((h) => h.item_id === itemId)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return hist[0] || null;
  };

  const addItem = async () => {
    const name = newName.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      const item = await findOrCreateItem({ name, category: newCat });
      await addToShoppingList(item.id);
      setNewName("");
      setAdding(false);
      showToast(`Added "${name}" to the list`);
      refresh();
    } catch (e) {
      showToast("Couldn't add item — try again");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (entryId) => {
    try {
      await removeFromShoppingList(entryId);
      refresh();
    } catch (e) {
      showToast("Couldn't remove item");
      console.error(e);
    }
  };

  return (
    <div className="fade-in">
      <SectionHeading
        eyebrow={`${shoppingList.length} item${shoppingList.length === 1 ? "" : "s"} planned`}
        title="What we're buying next"
      />

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "13px 16px",
            marginBottom: 18,
            background: "#fff",
            border: "1.5px dashed var(--color-border)",
            borderRadius: 10,
            color: "var(--color-muted)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Plus size={16} /> Add an item to the list
        </button>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid var(--color-ink)",
            borderRadius: 10,
            padding: 14,
            marginBottom: 18,
          }}
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="e.g. Kirkland Olive Oil 2L"
            style={inputStyle}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setNewCat(c)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  border: newCat === c ? `1.5px solid ${CAT_COLOR[c]}` : "1.5px solid var(--color-border)",
                  background: newCat === c ? CAT_COLOR[c] + "1A" : "#fff",
                  color: newCat === c ? CAT_COLOR[c] : "var(--color-muted)",
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addItem} style={primaryBtn} disabled={saving}>
              {saving ? "Adding…" : "Add to list"}
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
              style={ghostBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {shoppingList.length === 0 ? (
        <EmptyState text="Nothing planned yet. Add items above as you think of them." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {shoppingList.map((entry) => {
            const item = entry.items;
            if (!item) return null;
            const lp = lastPrice(item.id);
            return (
              <div key={entry.id} className="row-hover" style={listRow}>
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
                  <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--color-ink)" }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: "var(--color-muted-soft)", marginTop: 1 }}>
                    {lp ? `Last paid ${fmtMoney(lp.price)} · ${fmtDate(lp.date)}` : "No purchase history yet"}
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} style={iconBtn}>
                  <X size={15} strokeWidth={2.2} color="var(--color-muted-soft)" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
