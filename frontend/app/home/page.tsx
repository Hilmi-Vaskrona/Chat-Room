'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import {
  MessageSquare,
  Plus,
  Link as LinkIcon,
  Users,
  Shield,
  Search,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join via Code Modal
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await api.groups.getAll();
      if (res?.data) {
        setGroups(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newGroupName.trim()) {
      setCreateError('Nama grup tidak boleh kosong');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await api.groups.create(newGroupName.trim());
      setShowCreateModal(false);
      setNewGroupName('');
      if (res?.data?.id) {
        router.push(`/groups/${res.data.id}`);
      } else {
        loadGroups();
      }
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat grup');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinViaCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const cleanCode = inviteCode.trim();
    if (!cleanCode) {
      setJoinError('Kode undangan wajib diisi');
      return;
    }

    setJoiningGroup(true);
    try {
      const res = await api.invite.join(cleanCode);
      setShowJoinModal(false);
      setInviteCode('');
      if (res?.data?.group_id) {
        router.push(`/groups/${res.data.group_id}`);
      } else {
        loadGroups();
      }
    } catch (err: any) {
      setJoinError(err.message || 'Gagal bergabung dengan kode undangan ini');
    } finally {
      setJoiningGroup(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top welcome & action header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ruang Kerja Saya</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Halo, {user.display_name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pilih ruang percakapan untuk mulai bertukar pesan realtime, atau buat grup baru.
            </p>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2.5 rounded-xl glass hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center space-x-2 border border-slate-700/60 transition-colors"
            >
              <LinkIcon className="w-4 h-4 text-indigo-400" />
              <span>Gabung via Kode</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center space-x-2 shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Grup Baru</span>
            </button>
          </div>
        </div>

        {/* Search & Groups Section */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Daftar Grup yang Diikuti</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                {groups.length}
              </span>
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama grup..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {loadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-5 rounded-2xl glass-panel animate-pulse h-36"
                />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-dashed border-slate-800 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">
                {searchQuery
                  ? 'Grup tidak ditemukan'
                  : 'Belum bergabung ke grup mana pun'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                {searchQuery
                  ? `Tidak ada grup dengan nama "${searchQuery}".`
                  : 'Mulai dengan membuat grup percakapan baru atau gunakan kode link undangan dari rekan Anda.'}
              </p>
              {!searchQuery && (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Grup Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((g) => (
                <Link
                  key={g.id}
                  href={`/groups/${g.id}`}
                  className="group p-5 rounded-2xl glass-panel hover:border-indigo-500/40 hover:bg-slate-900/70 transition-all duration-200 flex flex-col justify-between hover:-translate-y-0.5 shadow-lg shadow-black/20"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-base group-hover:scale-105 transition-transform">
                        {g.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                          g.role === 'admin'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {g.role === 'admin' && <Shield className="w-3 h-3" />}
                        <span>{g.role === 'admin' ? 'Admin' : 'Anggota'}</span>
                      </span>
                    </div>

                    <h3 className="mt-3 font-bold text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {g.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dibuat oleh:{' '}
                      <span className="text-slate-300 font-medium">
                        {g.creator_name}
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center space-x-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-slate-500" />
                      <span>{g.member_count} Anggota</span>
                    </span>
                    <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center space-x-1 text-[11px] font-semibold">
                      <span>Buka Chat</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal: Buat Grup Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-dropdown w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Buat Grup Percakapan Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Grup
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tim Proyek Akhir Kelas 12"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Anda akan otomatis menjadi Admin pada grup yang dibuat.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center space-x-2"
                >
                  {creatingGroup ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat...</span>
                    </>
                  ) : (
                    <span>Buat Grup</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Gabung via Kode Undangan */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-dropdown w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-indigo-400" />
                <span>Gabung via Kode Undangan</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{joinError}</span>
              </div>
            )}

            <form onSubmit={handleJoinViaCode} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kode Undangan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kode unik undangan (contoh: a1b2c3d4e5f6)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={joiningGroup}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center space-x-2"
                >
                  {joiningGroup ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Gabung Sekarang</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
