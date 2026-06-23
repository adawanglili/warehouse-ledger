import "./globals.css";

export const metadata = {
  title: "Warehouse Ledger",
  description: "Track planned Costco purchases and price history over time.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#FAF7EF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
