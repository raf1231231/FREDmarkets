import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "./AppProviders";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "FREDmarkets",
  description: "Prediction markets on Federal Reserve Economic Data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 py-6 w-full">
              {children}
            </main>
            <Footer />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
