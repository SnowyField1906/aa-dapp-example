'use client';

import './styles/globals.css';
import { WalletProvider } from './@aawallet-sdk';
import { EChain } from './@aawallet-sdk/types';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider chain={EChain.ETHEREUM}>{children}</WalletProvider>
      </body>
    </html>
  );
}
