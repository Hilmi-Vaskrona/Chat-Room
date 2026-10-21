'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import Navbar from '@/components/Navbar';
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
} from 'lucide-react';

export default function ContactsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState<any[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  // Search user to add
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUsername, setAddingUsername] = useState<string | null>(null);

  // Status banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const loadContacts = async () => {
    try {
      setLoadingContacts(true);
      const res = await api.contacts.getAll();
      if (res?.data) {
        setContacts(res.data);
      }
    } catch {
      // Handled
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadContacts();
    }
  }, [isAuthenticated]);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.users.search(searchQuery.trim());
        if (res?.data) {
          setSearchResults(res.data);
        }
      } catch {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleAddContact = async (targetUsername: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setAddingUsername(targetUsername);

    try {
      await api.contacts.add(targetUsername);
      setSuccessMessage(`Berhasil menambahkan @${targetUsername} ke daftar kontak!`);
      loadContacts();
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menambahkan kontak');
    } finally {
      setAddingUsername(null);
    }
  };

  const handleRemoveContact = async (contactId: string, contactUsername: string) => {
    if (!confirm(`Hapus @${contactUsername} dari daftar kontak Anda?`)) return;

    try {
      await api.contacts.remove(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
      setSuccessMessage(`Kontak @${contactUsername} berhasil dihapus.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus kontak');
    }
  };

  const existingContactUserIds = new Set(contacts.map((c) => c.contact_user_id));

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

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Buku Kontak</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Kelola Kontak Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cari akun pengguna lain berdasarkan username dan simpan ke dalam daftar kontak personal Anda.
          </p>
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              &times;
            </button>
          </div>
        )}

        {/* Section 1: Search & Add Contact */}
        <div className="p-6 rounded-3xl glass-panel">
          <h2 className="text-base font-bold text-white mb-3 flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-indigo-400" />
            <span>Cari & Tambah Kontak Baru</span>
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik username akun yang ingin dicari (contoh: rudi, ahmad, siti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-indigo-400 absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin" />
            )}
          </div>

          {/* Search Results */}
          {searchQuery.trim() && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-400 font-semibold mb-2">
                Hasil Pencarian:
              </p>

              {searchResults.length === 0 && !isSearching ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Tidak ditemukan akun dengan username &quot;{searchQuery}&quot;.
                </p>
              ) : (
                searchResults.map((targetUser) => {
                  const isAlreadyContact = existingContactUserIds.has(targetUser.id);
                  const isAdding = addingUsername === targetUser.username;

                  return (
                    <div
                      key={targetUser.id}
                      className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                          {targetUser.display_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {targetUser.display_name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            @{targetUser.username}
                          </p>
                          {targetUser.bio && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {targetUser.bio}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        {isAlreadyContact ? (
                          <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-medium flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sudah di Kontak</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isAdding}
                            onClick={() => handleAddContact(targetUser.username)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all"
                          >
                            {isAdding ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Menambahkan...</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Tambah Kontak</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Section 2: Contact List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Daftar Kontak Saya</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-normal">
                {contacts.length}
              </span>
            </h2>
          </div>

          {loadingContacts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-16 rounded-2xl glass-panel animate-pulse"
                />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-10 rounded-3xl glass-panel text-center flex flex-col items-center">
              <Users className="w-10 h-10 text-slate-600 mb-3" />
              <h3 className="text-sm font-semibold text-white">
                Daftar kontak masih kosong
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Gunakan kolom pencarian di atas untuk menemukan teman dan menambahkannya ke kontak Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl glass-panel flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-950 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                      {c.user?.display_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {c.user?.display_name}
                      </p>
                      <p className="text-xs text-indigo-400 font-mono truncate">
                        @{c.user?.username}
                      </p>
                      {c.user?.bio && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {c.user?.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveContact(c.id, c.user?.username)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 ml-2"
                    title="Hapus dari kontak"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
