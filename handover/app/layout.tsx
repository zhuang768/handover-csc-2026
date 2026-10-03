import type { Metadata, Viewport } from "next";
import { PwaRegister } from "@/components/handover/pwa-register";
import "./globals.css";
export const metadata: Metadata = {
  title: "Handover · Keep every lesson moving",
  description:
    "A clear handover. A prepared classroom. Coordinate school timetable changes and teaching handovers.",
  applicationName: "Handover",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Handover",
    statusBarStyle: "default",
  },
  other: { "codex-preview": "development" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#246b56",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
