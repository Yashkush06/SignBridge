import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SignBridge — AI-Powered Sign Language Translation",
    template: "%s | SignBridge",
  },
  description:
    "Translate sign language into spoken and written English in real time using AI. Built for accessibility, communication, and real-world usability.",
  keywords: [
    "sign language",
    "translation",
    "accessibility",
    "AI",
    "deaf",
    "hard of hearing",
    "ASL",
    "real-time",
    "webcam",
  ],
  authors: [{ name: "SignBridge" }],
  openGraph: {
    type: "website",
    title: "SignBridge — AI-Powered Sign Language Translation",
    description:
      "Break communication barriers. Translate sign language into text and speech in real time.",
    siteName: "SignBridge",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
