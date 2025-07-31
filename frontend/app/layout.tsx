import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Intent Copilot - AI-Powered DeFi Trading',
  description: 'Turn natural language commands into fully-formed 1inch Intents and Limit Orders',
  keywords: ['DeFi', 'Trading', 'AI', '1inch', 'Crypto', 'Base Chain'],
  authors: [{ name: 'Intent Copilot Team' }],
  openGraph: {
    title: 'Intent Copilot - AI-Powered DeFi Trading',
    description: 'Trade crypto with natural language commands powered by AI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intent Copilot - AI-Powered DeFi Trading',
    description: 'Trade crypto with natural language commands powered by AI',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}