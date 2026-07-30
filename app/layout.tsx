import type { Metadata } from "next";

import { env } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: env.NEXT_PUBLIC_APP_NAME,
    template: `%s | ${env.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "A flexible project command centre for milestones, workstreams, delivery, and readiness.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <body className="min-h-svh font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
