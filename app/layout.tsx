import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Andres Arbelaez | Designer & Creative Technologist",
  description: "Portfolio with a RAG-powered agent that answers recruiter questions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
