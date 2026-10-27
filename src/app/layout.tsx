import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Awards",
  description: "A simple and accessible community project voting system.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><header className="site-header"><div className="shell nav"><Link className="brand" href="/">Project Awards</Link><nav aria-label="Main navigation"><Link href="/">Vote</Link><Link href="/results">Results</Link></nav></div></header>{children}<footer className="site-footer"><div className="shell"><span>Project Awards</span><span>Anonymous voting · No registration required</span></div></footer></body></html>;
}
