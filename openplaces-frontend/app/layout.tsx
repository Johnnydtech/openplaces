import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "OpenPlaces - Smart Placement for Any Message",
  description: "From event promotions to lost pet posters to emergency notices—discover the most effective locations to reach your audience in Arlington, VA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} ${jakarta.variable} antialiased font-sans`}
          style={{ fontFamily: 'var(--font-inter)' }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
