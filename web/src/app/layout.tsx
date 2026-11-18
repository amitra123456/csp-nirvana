import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { getSnapshot } from "@/lib/server-data";

export const metadata: Metadata = {
  title: "CSP-Nirvana // Institutional Cash-Secured Put Screener",
  description: "Deterministic cash-secured put screener, price ladder, and real position tracking.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const snapshot = await getSnapshot();
  const asOfEt = snapshot?.run?.as_of_et || "";
  const itmCount = snapshot?.positions?.filter((p) => p.status === "itm").length || 0;

  return (
    <html lang="en">
      <body className="min-h-screen bg-desk-bg text-desk-text antialiased">
        <Header asOfEt={asOfEt} itmCount={itmCount} />
        <main className="mx-auto max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1536px] px-3 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
