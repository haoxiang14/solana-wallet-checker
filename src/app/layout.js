import { Inter } from "next/font/google";
import "./globals.css";
import { AppWalletAdapter } from "../components/appWalletAdapter";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Solana Wallet Tracker",
  description: "Track your Solana wallet balances and transactions",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppWalletAdapter>
          {children}
        </AppWalletAdapter>
      </body>
    </html>
  );
}
