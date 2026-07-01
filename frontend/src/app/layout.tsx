import type { Metadata } from "next";
import {
  IBM_Plex_Mono,
  Libre_Caslon_Display,
  Public_Sans,
} from "next/font/google";
import "./globals.css";

const caslon = Libre_Caslon_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-caslon",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arbiter — provably fair settlements, negotiated by AI advocates",
  description:
    "Every side of a dispute gets its own AI advocate. They negotiate a settlement in under a minute, and the game-theory math proves it is fair.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${caslon.variable} ${publicSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
