'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import Navbar from '@/components/Navbar';
import {
  MessageSquare,
  Users,
  Send,
  Shield,
  ShieldAlert,
  Link as LinkIcon,
  Copy,
  Check,
  Edit2,
  ChevronLeft,
  X,
  Loader2,
  AtSign,
  AlertCircle,
  Wifi,
  WifiOff,
} from 'lucide-react';

function GroupChatContent() {
  const params = useParams();
  const groupId = params.groupId as string;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Group metadata & members
  const [group, setGroup] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Messages & WebSocket
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // Mention Suggestions Popover
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');

  // Group Details Sidebar / Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [updatingName, setUpdatingName] = useState(false);

  // Invite Link Generator Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteResult, setInviteResult] = useState<any | null>(null);
  const [inviteHours, setInviteHours] = useState(24);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Load group details, members, and initial message history
  const loadGroupData = async () => {
    try {
      setLoadingGroup(true);
      const [groupRes, membersRes] = await Promise.all([
        api.groups.getDetails(groupId),
        api.groups.getMembers(groupId),
      ]);
      setGroup(groupRes.data);
      setEditNameValue(groupRes.data.name);
      setMembers(membersRes.data);
    } catch (err: any) {
      if (err.statusCode === 403) {
        setAccessDenied(true);
      }
    } finally {
      setLoadingGroup(false);
    }
  };

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      const res = await api.groups.getMessages(groupId, 100);
      if (res?.data) {
        setMessages(res.data);
      }
    } catch (err: any) {
      // Handled
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && groupId) {
      loadGroupData();
      loadMessages();
    }
  }, [isAuthenticated, groupId]);

  // WebSocket lifecycle
  useEffect(() => {
    if (!isAuthenticated || !groupId) return;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setIsSocketConnected(true);
      setSocketError(null);
      socket.emit('joinGroup', { groupId });
    };

    const onDisconnect = () => {
      setIsSocketConnected(false);
    };

    const onNewMessage = (newMsg: any) => {
      if (newMsg.group_id === groupId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    const onSocketError = (err: any) => {
      setSocketError(err?.message || 'Terjadi kesalahan socket');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('newMessage', onNewMessage);
    socket.on('socketError', onSocketError);

    // If socket was already connected before this component mounted
    if (socket.connected) {
      setIsSocketConnected(true);
      socket.emit('joinGroup', { groupId });
    }

    return () => {
      socket.emit('leaveGroup', { groupId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('newMessage', onNewMessage);
      socket.off('socketError', onSocketError);
    };
  }, [isAuthenticated, groupId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing and @ mention suggestions detection
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    // Detect if cursor is immediately after '@'
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.-]*)$/);

    if (match) {
      setShowMentionSuggestions(true);
      setMentionFilter(match[1].toLowerCase());
    } else {
      setShowMentionSuggestions(false);
    }
  };

  const handleSelectMention = (targetUsername: string) => {
    if (!inputRef.current) return;
    const cursorPos = inputRef.current.selectionStart;
    const textBefore = inputText.slice(0, cursorPos);
    const textAfter = inputText.slice(cursorPos);

    const replaced = textBefore.replace(/@([a-zA-Z0-9_.-]*)$/, `@${targetUsername} `);
    setInputText(replaced + textAfter);
    setShowMentionSuggestions(false);
    inputRef.current.focus();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = inputText.trim();
    if (!cleanContent) return;

    const socket = getSocket();
    socket.emit('sendMessage', {
      groupId,
      content: cleanContent,
    });

    setInputText('');
    setShowMentionSuggestions(false);
  };

  const handleUpdateName = async () => {
    if (!editNameValue.trim()) return;
    setUpdatingName(true);
    try {
      const res = await api.groups.updateName(groupId, editNameValue.trim());
      setGroup((prev: any) => ({ ...prev, name: res.data.name }));
      setIsEditingName(false);
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah nama grup');
    } finally {
      setUpdatingName(false);
    }
  };

  const handlePromoteAdmin = async (targetUserId: string) => {
    if (!confirm('Apakah Anda yakin ingin mengangkat anggota ini menjadi Admin?')) {
      return;
    }
    try {
      await api.groups.changeRole(groupId, targetUserId, 'admin');
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === targetUserId ? { ...m, role: 'admin' } : m,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengangkat anggota menjadi admin');
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingInvite(true);
    try {
      const res = await api.groups.createInvite(groupId, inviteHours);
      setInviteResult(res.data);
    } catch (err: any) {
      alert(err.message || 'Gagal membuat link undangan');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyInvite = () => {
    if (!inviteResult?.invite_url) return;
    navigator.clipboard.writeText(inviteResult.invite_url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-4">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Akses Ditolak (403)</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Anda bukan anggota grup ini sehingga tidak memiliki izin untuk melihat percakapan atau anggota.
            </p>
            <div className="mt-6">
              <Link
                href="/home"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-block"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loadingGroup || !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const isAdmin = group.my_role === 'admin';

  // Helper to format content with highlighted mentions
  const renderMessageContent = (content: string, isMentionedMe: boolean) => {
    const parts = content.split(/(@[a-zA-Z0-9_.-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const usernameWithoutAt = part.substring(1).toLowerCase();
        const isMe = user?.username?.toLowerCase() === usernameWithoutAt;
        return (
          <span
            key={index}
            className={`font-semibold px-1.5 py-0.5 rounded-md inline-block my-0.5 transition-colors ${
              isMe
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 ring-1 ring-amber-400/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const filteredMembersForMention = members.filter(
    (m) =>
      m.user?.username?.toLowerCase().includes(mentionFilter) ||
      m.user?.display_name?.toLowerCase().includes(mentionFilter),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col h-screen overflow-hidden">
      <Navbar />

      {/* Group Room Container */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto px-2 sm:px-4 lg:px-6 py-3 overflow-hidden">
        {/* Top Header Card */}
        <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg mb-3 shrink-0">
          <div className="flex items-center space-x-3">
            <Link
              href="/home"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Kembali ke Beranda"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              {group.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {group.name}
                </h1>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isAdmin
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isAdmin ? 'Admin' : 'Anggota'}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>{members.length} Anggota</span>
                </span>
                <span>•</span>
                {/* Realtime WebSocket indicator */}
                <span className="flex items-center space-x-1">
                  {isSocketConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400">Realtime Aktif</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-yellow-400">Menyambung...</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(true);
                  handleGenerateInvite();
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                title="Buat Tautan Undangan"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Undang</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowDetailsModal(true)}
              className="px-3 py-1.5 rounded-xl glass hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Info Grup</span>
            </button>
          </div>
        </div>

        {/* Socket Error Notice if any */}
        {socketError && (
          <div className="mb-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{socketError}</span>
            </div>
            <button
              type="button"
              onClick={() => setSocketError(null)}
              className="text-red-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Message Stream Area */}
        <div className="flex-1 glass-panel rounded-2xl p-4 overflow-y-auto space-y-3 relative shadow-inner">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm font-semibold text-slate-400">
                Belum ada pesan di grup ini
              </p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Jadilah yang pertama mengirim pesan atau menyapa rekan Anda dengan mention @username!
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.sender_id === user?.id;
              const hasMentionedMe = (m.mentions || []).some(
                (men: any) => men.mentioned_user_id === user?.id,
              );

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline space-x-2 mb-1 px-1">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {isMe ? 'Anda' : m.sender?.display_name || 'User'}
                    </span>
                    {!isMe && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        @{m.sender?.username}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">
                      {new Date(m.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-md lg:max-w-xl rounded-2xl px-4 py-2.5 text-sm shadow-md transition-all ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : hasMentionedMe
                        ? 'bg-slate-900 border-2 border-amber-400/70 text-slate-100 rounded-tl-none shadow-amber-500/10'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {hasMentionedMe && (
                      <div className="mb-1 text-[10px] font-semibold text-amber-300 flex items-center space-x-1">
                        <AtSign className="w-3 h-3" />
                        <span>Anda ditandai dalam pesan ini</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                      {renderMessageContent(m.content, hasMentionedMe)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="mt-3 relative shrink-0">
          {/* Mention Suggestions Popup */}
          {showMentionSuggestions && filteredMembersForMention.length > 0 && (
            <div className="absolute bottom-full mb-2 left-0 w-72 glass-dropdown rounded-2xl p-2 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 border-b border-slate-800 flex items-center justify-between">
                <span>Tag Anggota Grup</span>
                <span className="text-[10px] font-mono">@username</span>
              </div>
              <div className="max-h-48 overflow-y-auto mt-1 space-y-1">
                {filteredMembersForMention.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelectMention(m.user?.username)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 hover:text-white flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-white leading-tight">
                        {m.user?.display_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        @{m.user?.username}
                      </p>
                    </div>
                    {m.role === 'admin' && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-semibold">
                        Admin
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="glass rounded-2xl p-2 flex items-end space-x-2">
            <textarea
              ref={inputRef}
              rows={1}
              maxLength={2000}
              placeholder="Tulis pesan... (Ketik @ untuk men-tag anggota grup)"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              className="flex-1 max-h-32 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none px-2 py-1.5 leading-normal"
            />

            <div className="flex items-center space-x-1.5 shrink-0">
              <span className="text-[10px] text-slate-500 font-mono pr-1 hidden sm:inline">
                {inputText.length}/2000
              </span>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Group Info & Members */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-dropdown w-full max-w-lg rounded-3xl p-6 shadow-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Info & Anggota Grup</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5">
              {/* Group Name & Edit for Admin */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Nama Grup
                  </span>
                  {isAdmin && !isEditingName && (
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Ubah Nama</span>
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleUpdateName}
                      disabled={updatingName}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
                    >
                      {updatingName ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setEditNameValue(group.name);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <p className="text-base font-bold text-white">{group.name}</p>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Dibuat pada:{' '}
                  {new Date(group.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
                  <span>Daftar Anggota ({members.length})</span>
                  <span className="text-[10px] text-slate-500">
                    {members.filter((m) => m.role === 'admin').length} Admin
                  </span>
                </h4>

                <div className="space-y-2">
                  {members.map((m) => {
                    const isMemberAdmin = m.role === 'admin';
                    const isCurrentUser = m.user_id === user?.id;

                    return (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                            {m.user?.display_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-semibold text-white">
                                {m.user?.display_name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] text-indigo-400 font-medium">
                                  (Anda)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              @{m.user?.username}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                              isMemberAdmin
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isMemberAdmin && <Shield className="w-2.5 h-2.5" />}
                            <span>{isMemberAdmin ? 'Admin' : 'Anggota'}</span>
                          </span>

                          {/* Admin action: promote regular member to admin */}
                          {isAdmin && !isMemberAdmin && !isCurrentUser && (
                            <button
                              type="button"
                              onClick={() => handlePromoteAdmin(m.user_id)}
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition-colors"
                              title="Jadikan Admin Grup"
                            >
                              Jadikan Admin
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite Link Generator */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-dropdown w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-indigo-400" />
                <span>Tautan Undangan Grup</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Bagikan tautan ini kepada rekan Anda. Pengguna yang bergabung melalui tautan akan otomatis menjadi Anggota biasa.
              </p>

              {generatingInvite ? (
                <div className="py-6 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : inviteResult ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between gap-2">
                    <span className="text-xs text-indigo-300 font-mono truncate select-all">
                      {inviteResult.invite_url}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyInvite}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0 flex items-center space-x-1 shadow-sm"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Kode unik: <span className="font-mono text-white">{inviteResult.code}</span></span>
                    {inviteResult.expires_at && (
                      <span>Kedaluwarsa: {new Date(inviteResult.expires_at).toLocaleDateString('id-ID')}</span>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupChatPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <GroupChatContent />
    </React.Suspense>
  );
}

