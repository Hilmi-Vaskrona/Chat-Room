'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Users,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mentions, setMentions] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchMentions = async () => {
    try {
      const res = await api.mentions.getAll();
      if (res?.data) {
        setMentions(res.data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchMentions();
      const interval = setInterval(fetchMentions, 15000); // Polling mention preview interval
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = mentions.filter((m) => !m.is_read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.mentions.markAsRead(id);
      setMentions((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)),
      );
    } catch {
      // Ignore
    }
  };

  const navLinks = [
    { href: '/home', label: 'Beranda', icon: MessageSquare },
    { href: '/contacts', label: 'Kontak', icon: Users },
    { href: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <NextLink
              href="/home"
              className="flex items-center space-x-2.5 group transition-transform active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                ChatRoom
              </span>
            </NextLink>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1 ml-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <NextLink
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </NextLink>
                );
              })}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Mention Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMentions(!showMentions)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Notifikasi Mention"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full ring-2 ring-slate-950 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mentions Dropdown */}
              {showMentions && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-dropdown rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-sm text-white">
                        Mention untuk Anda
                      </h3>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                        {mentions.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowMentions(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      Tutup
                    </button>
                  </div>

                  <div className="max-h-72 overflow-y-auto mt-2 space-y-2 pr-1">
                    {mentions.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">
                        Belum ada mention baru
                      </p>
                    ) : (
                      mentions.map((m) => (
                        <div
                          key={m.id}
                          className={`p-3 rounded-xl border text-xs transition-colors ${
                            m.is_read
                              ? 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                              : 'bg-indigo-950/40 border-indigo-500/30 text-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-semibold text-indigo-400">
                                @{m.message?.sender?.username || 'user'}
                              </span>{' '}
                              menandai Anda di grup{' '}
                              <span className="font-medium text-slate-200">
                                {m.group?.name || 'Grup'}
                              </span>
                            </div>
                            {!m.is_read && (
                              <button
                                type="button"
                                onClick={(e) => handleMarkAsRead(m.id, e)}
                                title="Tandai sudah dibaca"
                                className="text-indigo-400 hover:text-indigo-300 shrink-0"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-slate-300 line-clamp-2 bg-slate-950/50 p-2 rounded-lg font-mono text-[11px]">
                            &quot;{m.message?.content}&quot;
                          </p>
                          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                            <span>
                              {new Date(m.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {m.group?.id && (
                              <NextLink
                                href={`/groups/${m.group.id}`}
                                onClick={() => setShowMentions(false)}
                                className="text-indigo-400 hover:underline flex items-center space-x-1"
                              >
                                <span>Buka Grup</span>
                                <ExternalLink className="w-3 h-3" />
                              </NextLink>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Logout */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <NextLink
                  href="/profile"
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
                  title="Profil Saya"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shadow-sm">
                    {user.display_name?.charAt(0) || user.username?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {user.display_name}
                    </p>
                    <p className="text-[10px] text-slate-400">@{user.username}</p>
                  </div>
                </NextLink>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <NextLink
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NextLink>
            );
          })}
        </div>
      )}
    </nav>
  );
}
