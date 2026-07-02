import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignSpeak AI",
  description: "Learn sign language with AI-powered translation and guided lessons.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-espresso font-sans antialiased">{children}</body>
    </html>
  );
}
