import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";
import "./styles.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const sans = Figtree({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: `${site.name} | Education, Admissions and Institutional Growth`,
  description: "Personalised admission guidance for students and strategic consultancy for educational institutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable} bg-paper font-sans text-ink antialiased`}>{children}</body>
    </html>
  );
}
