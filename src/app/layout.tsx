import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carta Fund ERP — Independent prototype",
  description:
    "Independent, synthetic-data prototype of a connected Fund ERP experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
