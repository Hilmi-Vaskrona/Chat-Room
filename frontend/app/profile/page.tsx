'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import {
  User,
  Mail,
  Smile,
  FileText,
  Calendar,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError('Nama tampilan tidak boleh kosong');
      return;
    }

    setSaving(true);
    try {
      const res = await api.users.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      if (res?.data) {
        updateUser(res.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <User className="w-4 h-4" />
            <span>Pengaturan Akun</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Profil Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola informasi profil personal dan tampilan nama Anda di ruang percakapan.
          </p>
        </div>

        {/* Profile Card */}
        <div className="mt-8 glass-panel p-6 sm:p-8 rounded-3xl shadow-xl">
          {/* Avatar and basic info banner */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5 pb-6 border-b border-slate-800">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-3xl font-bold text-white uppercase shadow-lg shadow-indigo-500/20">
              {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{user.display_name}</h2>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">
                @{user.username}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.email}</span>
                </span>
                {user.created_at && (
                  <span className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      Bergabung:{' '}
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mt-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Profil berhasil disimpan!</span>
            </div>
          )}

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Username (Fixed / Read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username (Permanen)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={`@${user.username}`}
                  className="w-full px-3.5 py-2.5 bg-slate-900/40 border border-slate-800 rounded-xl text-sm text-slate-500 cursor-not-allowed font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Username bersifat unik dan tidak dapat diubah setelah pendaftaran.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Tampilan
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bio / Status Personal
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Ceritakan sedikit tentang Anda..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                />
              </div>
              <div className="mt-1 flex justify-end">
                <span className="text-[10px] text-slate-500 font-mono">
                  {bio.length}/500
                </span>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Perubahan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
