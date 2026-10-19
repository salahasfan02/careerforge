import type { Metadata } from "next";
import { Manrope, Lora } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "CV Tailor — Private AI Career Assistant",
  description: "Local-first AI CV tailoring, job matching, and career optimisation.",
};

// Runs before hydration to avoid a flash of the wrong theme when a manual override is stored.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('cf-theme');
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.setAttribute('data-theme', stored);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="flex h-screen">
          <Sidebar />
          <main className="app-main flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
