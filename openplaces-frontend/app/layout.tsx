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
  title: "OpenPlaces - Smart Flyer & Poster Placement",
  description: "Find the best locations to post your event flyers and posters in Arlington, VA. AI-powered recommendations based on foot traffic, demographics, and location data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#4ade80',
          colorBackground: '#1a2f3a',
          colorInputBackground: '#1e3a48',
          colorInputText: '#ffffff',
          colorText: '#f1f5f9',
          colorTextSecondary: '#cbd5e1',
          colorTextOnPrimaryBackground: '#ffffff',
          colorDanger: '#fb923c',
          colorSuccess: '#4ade80',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'bg-[#1a2f3a] border border-[#4ade80]/20 shadow-2xl',
          headerTitle: 'text-white font-bold',
          headerSubtitle: 'text-slate-300',
          socialButtonsBlockButton: 'bg-[#1e3a48] border-[#2a4551] !text-white hover:bg-[#243f4d]',
          socialButtonsBlockButtonText: '!text-white font-medium',
          socialButtonsBlockButtonArrow: '!text-white',
          formButtonPrimary: 'bg-[#4ade80] !text-white hover:bg-[#22c55e] font-semibold shadow-lg',
          formButtonPrimaryText__loading: '!text-white',
          formFieldInput: 'bg-[#1e3a48] border-[#2a4551] text-white placeholder:text-slate-400',
          footerActionLink: 'text-[#4ade80] hover:text-[#22c55e] font-medium',
          footerActionText: 'text-slate-300',
          identityPreviewText: 'text-white',
          identityPreviewEditButton: 'text-[#4ade80]',
          formFieldLabel: 'text-slate-300 font-medium',
          dividerLine: 'bg-[#2a4551]',
          dividerText: 'text-slate-300',
          logoBox: 'justify-center',
        },
      }}
    >
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
