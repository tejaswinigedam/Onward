import type { Metadata } from "next";
import { Inter, Manrope, Fraunces } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@/components/Analytics";
import "./globals.css";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-manrope" });
const fraunces = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: "Onward — Your salary, demystified",
  description:
    "You earn it every month and still don't know where it goes. Onward decodes your salary and taxes — and shows you the money you're leaving on the table.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const html = (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
  // Only mount ClerkProvider when configured, so the app still builds/runs without keys.
  return clerkEnabled ? <ClerkProvider>{html}</ClerkProvider> : html;
}
