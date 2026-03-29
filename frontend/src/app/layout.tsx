import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StudyPulse | AI Accountability & Learning",
  description: "Cognitive learning platform with AI-powered coaching.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
