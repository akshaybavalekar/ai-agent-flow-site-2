import type { Metadata } from 'next';
import './globals.css';
import { McpCacheProvider } from '@/contexts/McpCacheContext';
import { TeleSpeechProvider } from '@/contexts/TeleSpeechContext';

const agentName = process.env.NEXT_PUBLIC_AGENT_NAME || 'trAIn';

export const metadata: Metadata = {
  title: agentName,
  description: `${agentName} — AI-powered training platform`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-[#0a0a0a]">
        <McpCacheProvider>
          <TeleSpeechProvider>
            {children}
          </TeleSpeechProvider>
        </McpCacheProvider>
      </body>
    </html>
  );
}
