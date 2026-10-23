import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/state/data-store";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Meridian · Delivery Reporting",
  description: "Consolidated project performance, team utilization and delivery cost reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
