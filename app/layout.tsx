'use client';

import type { Metadata } from 'next';
import './css/globals.css';
import { WalletProvider } from './components/WalletProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
