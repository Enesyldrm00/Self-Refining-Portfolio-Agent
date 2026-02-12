import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Self-Refining Portfolio Agent",
    description: "AI-driven cryptocurrency portfolio management on Stellar blockchain",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}
