import type { Metadata, Viewport } from "next";
import { Sour_Gummy, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sourGummy = Sour_Gummy({
  weight: ["400", "800"],
  subsets: ["latin"],
  variable: "--font-sour-gummy",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
};

export const metadata: Metadata = {
  title: "Aaj Kya Khana Hai?",
  description: "Recipe discovery for couples — find your pick in under 2 minutes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourGummy.variable} ${plusJakarta.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakarta.className} antialiased`}
        style={{ backgroundColor: "#FFF9F5" }}
      >
        {children}
      </body>
    </html>
  );
}
