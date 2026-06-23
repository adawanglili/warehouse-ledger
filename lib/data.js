import { supabase } from "./supabaseClient";

// ---------- Items ----------
export async function fetchItems() {
  const { data, error } = await supabase.from("items").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function findItemByName(name) {
  const lower = name.trim().toLowerCase();
  const { data, error } = await supabase.from("items").select("*");
  if (error) throw error;
  return (
    data.find(
      (it) =>
        it.name.toLowerCase() === lower ||
        (it.nicknames || []).some((n) => n.toLowerCase() === lower)
    ) || null
  );
}

export async function createItem({ name, category = "Other", nicknames = [] }) {
  const { data, error } = await supabase
    .from("items")
    .insert({ name, category, nicknames })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findOrCreateItem({ name, category = "Other" }) {
  const existing = await findItemByName(name);
  if (existing) return existing;
  return createItem({ name, category });
}

// ---------- Shopping list ----------
export async function fetchShoppingList(status = "planned") {
  const { data, error } = await supabase
    .from("shopping_list")
    .select("*, items(*)")
    .eq("status", status)
    .order("added_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addToShoppingList(itemId) {
  // avoid duplicate planned entries
  const { data: existing } = await supabase
    .from("shopping_list")
    .select("id")
    .eq("item_id", itemId)
    .eq("status", "planned");
  if (existing && existing.length) return existing[0];

  const { data, error } = await supabase
    .from("shopping_list")
    .insert({ item_id: itemId, status: "planned" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeFromShoppingList(entryId) {
  const { error } = await supabase.from("shopping_list").delete().eq("id", entryId);
  if (error) throw error;
}

export async function markPurchasedByItemId(itemId) {
  const { error } = await supabase
    .from("shopping_list")
    .update({ status: "purchased" })
    .eq("item_id", itemId)
    .eq("status", "planned");
  if (error) throw error;
}

// ---------- Price history ----------
export async function fetchPriceHistory(itemId = null) {
  let query = supabase.from("price_history").select("*").order("date", { ascending: true });
  if (itemId) query = query.eq("item_id", itemId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function addPriceEntry({ itemId, date, price, qty = 1, receiptId = null }) {
  const { data, error } = await supabase
    .from("price_history")
    .insert({ item_id: itemId, date, price, qty, receipt_id: receiptId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchItemsWithHistory() {
  const { data, error } = await supabase
    .from("price_history")
    .select("item_id, date, price, items(*)")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}
