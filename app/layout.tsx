'use client'

import '@styles/globals.css'
import { WalletProvider } from '@aawallet-sdk'
import StaticSwapProvider from '@providers/StaticSwapProvider'
import { Network } from '@aawallet-sdk/types'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider network={Network.TETHSPL}>
          <StaticSwapProvider>{children}</StaticSwapProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
