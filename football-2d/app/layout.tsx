import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tactical Football 2D",
  description: "A tactical 2D football simulation game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
