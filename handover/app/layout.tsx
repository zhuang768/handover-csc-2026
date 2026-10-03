import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Handover · Keep every lesson moving",
  description:
    "A clear handover. A prepared classroom. Coordinate school timetable changes and teaching handovers.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
