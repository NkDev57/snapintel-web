import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SnapIntel Web - Analyse Snapchat',
  description: 'Analysez les comptes Snapchat : stories, highlights, spotlights, lenses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
