import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./styles/globals.css";
import Unsupported from "./components/unsupported";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nodes",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={jost.variable}>
        <Unsupported />
        {children}
      </body>
    </html>
  );
}
