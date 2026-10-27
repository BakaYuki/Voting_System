import type { Metadata } from "next";
import { VoterGate } from "@/components/voter-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Awards",
  description: "A simple and accessible community project voting system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning><VoterGate><header className="site-header"><div className="shell nav"><span className="brand">Project Awards</span></div></header>{children}<footer className="site-footer"><div className="shell"><span>Project Awards</span><span>Registered voter access</span></div></footer></VoterGate></body></html>;
}
