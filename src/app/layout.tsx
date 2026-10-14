import type { Metadata } from 'next'
import { Rubik, Nunito_Sans } from 'next/font/google'
import './globals.css'

const rubik = Rubik({ subsets: ['latin'], weight: ['400', '700', '800'], variable: '--font-rubik' })
const nunito = Nunito_Sans({ subsets: ['latin'], weight: ['200', '400', '700'], variable: '--font-nunito' })

export const metadata: Metadata = {
  title: 'BananaPrice',
  description: 'O seu radar de games a preço de banana!',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${rubik.variable} ${nunito.variable} bg-bp-bg font-body text-bp-muted antialiased`}>
        {children}
      </body>
    </html>
  )
}
