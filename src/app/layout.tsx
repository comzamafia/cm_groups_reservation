import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";

// Brand-aligned web fallbacks:
// Amandine (heading) → Cormorant Garamond (elegant display serif)
// New Oder (body)    → Inter (clean sans)
// Thai support       → IBM Plex Sans Thai
const heading = Cormorant_Garamond({
  variable: "--font-heading-stack",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body-stack",
  subsets: ["latin"],
});

const thai = IBM_Plex_Sans_Thai({
  variable: "--font-thai-stack",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Chiang Mai Thai Dining — Group Party & Events",
  description:
    "Book private dining, semi-private nooks, and full event spaces at Chiang Mai Thai Dining.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${heading.variable} ${body.variable} ${thai.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
