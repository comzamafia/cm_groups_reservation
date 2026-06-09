import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// Design fonts (from the handoff):
//   Headings → Playfair Display (serif)
//   Body     → Inter (sans)
const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chiang Mai · Private Dining & Group Events",
  description:
    "Celebrate your most memorable moments inside our modern Thai dining room — murals, candlelight and a kitchen built for a crowd. Private dining for 2–180 guests in Mississauga.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
