import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat Room — Website Percakapan Realtime Kelas 12',
  description:
    'Aplikasi Chat Room realtime dengan REST API NestJS, TypeORM PostgreSQL Supabase, Socket.IO, JWT Auth, Group Roles, Mentions, dan Invite Links.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark h-full">
      <body className={`${inter.className} min-h-full bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
