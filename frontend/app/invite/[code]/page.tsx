'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Users,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  LogIn,
} from 'lucide-react';

function InviteContent() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [inviteInfo, setInviteInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<any | null>(null);

  useEffect(() => {
    if (!code) return;

    api.invite
      .getInfo(code)
      .then((res) => {
        if (res?.data) {
          setInviteInfo(res.data);
        }
      })
      .catch((err) => {
        setError(err.message || 'Tautan undangan tidak valid atau tidak ditemukan');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;
    setJoining(true);
    setError(null);

    try {
      const res = await api.invite.join(code);
      setJoinResult(res.data);
      if (res?.data?.group_id) {
        setTimeout(() => {
          router.push(`/groups/${res.data.group_id}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal bergabung ke grup');
    } finally {
      setJoining(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-2.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">
            Undangan Bergabung Grup
          </h2>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl">
          {error ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tautan Tidak Berlaku</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {error}
              </p>
              <div className="mt-6">
                <Link
                  href="/home"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-block"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : inviteInfo ? (
            <div>
              {/* Group Overview Banner */}
              <div className="text-center pb-6 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md">
                  {inviteInfo.group_name?.charAt(0)?.toUpperCase()}
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {inviteInfo.group_name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dibuat oleh{' '}
                  <span className="text-indigo-400 font-semibold">
                    {inviteInfo.creator_name}
                  </span>
                </p>

                <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{inviteInfo.member_count} Anggota saat ini</span>
                </div>
              </div>

              {/* Status & Validity */}
              <div className="py-4 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Status Undangan:</span>
                  <span
                    className={`font-semibold ${
                      inviteInfo.is_valid ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {inviteInfo.is_valid ? 'Aktif' : 'Tidak Aktif / Kedaluwarsa'}
                  </span>
                </div>
                {inviteInfo.expires_at && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Kedaluwarsa:</span>
                    </span>
                    <span>
                      {new Date(inviteInfo.expires_at).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              {/* Success Join Alert */}
              {joinResult && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs mb-4">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    {joinResult.is_already_member
                      ? 'Anda sudah menjadi anggota grup ini!'
                      : 'Berhasil bergabung! Mengalihkan ke ruang chat...'}
                  </span>
                </div>
              )}

              {/* Actions depending on Auth State */}
              <div className="mt-4">
                {isAuthenticated ? (
                  <button
                    type="button"
                    disabled={joining || !inviteInfo.is_valid}
                    onClick={handleJoin}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses Keanggotaan...</span>
                      </>
                    ) : (
                      <>
                        <span>Gabung ke Grup Ini</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-xs text-center text-slate-400 mb-2">
                      Silakan masuk atau daftar terlebih dahulu untuk bergabung ke grup ini:
                    </p>
                    <Link
                      href="/login"
                      className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/25"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Akun</span>
                    </Link>
                    <Link
                      href="/register"
                      className="w-full py-2.5 px-4 rounded-xl glass hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center"
                    >
                      <span>Daftar Akun Baru</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <InviteContent />
    </React.Suspense>
  );
}

