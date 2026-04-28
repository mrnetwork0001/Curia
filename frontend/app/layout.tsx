import type { Metadata } from "next";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curia - Decentralized AI Arbitration Protocol",
  description:
    "Decentralized justice powered by adversarial AI agents communicating peer-to-peer over AXL. No central authority. Consensus verdicts.",
  keywords: [
    "AI arbitration",
    "decentralized justice",
    "AXL",
    "peer-to-peer",
    "Gensyn",
    "multi-agent",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
