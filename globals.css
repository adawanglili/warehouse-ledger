"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import ShoppingListView from "@/components/ShoppingListView";
import LogReceiptView from "@/components/LogReceiptView";
import HistoryView from "@/components/HistoryView";
import { fetchItems, fetchShoppingList, fetchPriceHistory } from "@/lib/data";

export default function Home() {
  const [tab, setTab] = useState("list");
  const [items, setItems] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const loadAll = useCallback(async () => {
    try {
      const [itemsData, listData, historyData] = await Promise.all([
        fetchItems(),
        fetchShoppingList("planned"),
        fetchPriceHistory(),
      ]);
      setItems(itemsData);
      setShoppingList(listData);
      setPriceHistory(historyData);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(
        "Couldn't connect to the database. Check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 28, color: "var(--color-gold)" }}>⛁</div>
        <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Loading your list…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600 }}>Setup needed</div>
        <div style={{ color: "var(--color-muted)", fontSize: 13.5, maxWidth: 380 }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header tab={tab} setTab={setTab} />
      <div style={{ flex: 1, maxWidth: 720, margin: "0 auto", width: "100%", padding: "0 16px 100px" }}>
        {tab === "list" && (
          <ShoppingListView
            shoppingList={shoppingList}
            priceHistory={priceHistory}
            refresh={loadAll}
            showToast={showToast}
          />
        )}
        {tab === "log" && <LogReceiptView refresh={loadAll} showToast={showToast} />}
        {tab === "history" && <HistoryView items={items} priceHistory={priceHistory} />}
      </div>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-ink)",
            color: "var(--color-cream)",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
            zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
