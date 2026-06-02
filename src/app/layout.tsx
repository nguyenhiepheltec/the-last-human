import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "The Last Human",
  description:
    "A countdown to extinction. Press the button. Reset the timer. Keep humanity alive.",
  openGraph: {
    title: "The Last Human",
    description:
      "A countdown to extinction. Press the button. Reset the timer. Keep humanity alive.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Last Human",
    description:
      "A countdown to extinction. Press the button. Reset the timer. Keep humanity alive.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-bg text-text font-mono">
        {children}
      </body>
    </html>
  );
}
