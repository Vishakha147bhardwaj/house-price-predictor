import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const body = Jost({ variable: "--font-body", subsets: ["latin"], weight: ["300", "400", "500"] });
const heading = Cormorant_Garamond({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Estate Value · California House Price Predictor",
  description: "Machine-learning valuations for California homes, served by FastAPI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable} h-full antialiased`}>
      <body className="min-h-full font-light">{children}</body>
    </html>
  );
}
