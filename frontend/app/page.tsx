'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Users,
  AtSign,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const features = [
    {
      icon: Zap,
      title: 'Pesan Realtime',
      desc: 'Komunikasi secepat kilat dengan NestJS WebSocket Gateway & Socket.IO tanpa polling.',
    },
    {
      icon: ShieldCheck,
      title: 'Role Admin per Grup',
      desc: 'Otorisasi ketat di backend. Pembuat otomatis admin dengan hak kelola anggota.',
    },
    {
      icon: AtSign,
      title: 'Mention @username',
      desc: 'Saran tag anggota otomatis dan penanda khusus saat Anda ditandai.',
    },
    {
      icon: LinkIcon,
      title: 'Tautan Undangan Grup',
      desc: 'Undang rekan dengan link acak unik yang dapat diatur masa kedaluwarsanya.',
    },
    {
      icon: Users,
      title: 'Buku Kontak Personal',
      desc: 'Cari pengguna berdasarkan username dan simpan ke dalam daftar kontak Anda.',
    },
    {
      icon: MessageSquare,
      title: 'Riwayat Pesan Aman',
      desc: 'Pesan disimpan di PostgreSQL Supabase sebelum disiarkan ke anggota.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-violet-600/15 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
            ChatRoom
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Daftar Sekarang
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 text-center z-10 flex flex-col items-center">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Tugas Project Website Chat Room Kelas 12</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl">
          Ruang Percakapan Realtime{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
            Modern & Terproteksi
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Dibangun dengan arsitektur penuh: Next.js + NestJS + PostgreSQL di Supabase + TypeORM + WebSocket Socket.IO + JWT Auth.
        </p>

        {/* Call to actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Mulai Buat Akun</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass hover:bg-slate-800/80 text-slate-200 font-semibold border border-slate-700/60 transition-all"
          >
            Masuk ke Akun Anda
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-left w-full">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl glass-panel hover:border-indigo-500/40 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 border-t border-slate-900 text-center text-xs text-slate-500 z-10">
        &copy; {new Date().getFullYear()} Website Chat Room Kelas 12. Fullstack REST API & WebSocket.
      </footer>
    </div>
  );
}
