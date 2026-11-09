'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  Music,
  Users,
  Mic,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Play,
  Globe,
  Sliders,
  HardDrive,
  Heart,
  X,
} from 'lucide-react';
import { Song, User } from '@/types';
import { WORLD_LANGUAGES, WorldLanguage } from '@/lib/artists';
import { MOODS, getMoodName } from '@/lib/moods';

interface AdminPortalProps {
  currentUser: User;
  onRefreshData?: () => void;
  onPlayTrack?: (song: Song) => void;
}

interface AdminDiagnostics {
  dbPath: string;
  dbSize: string;
  engine: string;
  dbStatus: string;
}

interface AdminStats {
  totalUsers: number;
  singerCount: number;
  listenerCount: number;
  totalSongs: number;
  totalLikes: number;
}

export default function AdminPortal({ currentUser, onRefreshData, onPlayTrack }: AdminPortalProps) {
  // Guard check: ensure only admin can view
  const isAdmin = currentUser.username.toLowerCase() === 'admin' || currentUser.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<'songs' | 'users' | 'tools'>('songs');
  const [songs, setSongs] = useState<Song[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [diagnostics, setDiagnostics] = useState<AdminDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search & Filter in Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('All');

  // Add Song Modal / Form States
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newAlbum, setNewAlbum] = useState('Single');
  const [newLanguage, setNewLanguage] = useState('English');
  const [newGenre, setNewGenre] = useState('Pop');
  const [newMoodEmoji, setNewMoodEmoji] = useState('🔥');
  const [newAudioUrl, setNewAudioUrl] = useState('');
  const [newLikesCount, setNewLikesCount] = useState(150);
  const [newDescription, setNewDescription] = useState('');
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);

  // Edit Song Modal State
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Fetch admin dashboard data
  const fetchAdminData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/admin?requester=admin`);
      const data = await res.json();
      if (res.ok) {
        setSongs(data.songs || []);
        setUsers(data.users || []);
        setStats(data.stats || null);
        setDiagnostics(data.diagnostics || null);
      } else {
        setErrorMessage(data.error || 'Failed to load database records');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Network error connecting to admin API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // 1-Click Sync Worldwide Catalog
  const handleSyncCatalog = async () => {
    if (!confirm('Sync and populate worldwide top singers and songs into database?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: 'admin',
          action: 'sync_catalog',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Worldwide catalog synchronized successfully!');
        await fetchAdminData();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMessage(data.error || 'Catalog sync failed');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Failed to trigger catalog sync');
    } finally {
      setLoading(false);
    }
  };

  // Delete song
  const handleDeleteSong = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}" from the database?`)) return;
    try {
      const res = await fetch(`/api/admin?requester=admin&type=song&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setActionMessage(`Deleted track "${title}" successfully.`);
        setSongs((prev) => prev.filter((s) => s.id !== id));
        if (onRefreshData) onRefreshData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to delete song');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Error deleting song');
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Delete user @${username}? This account will be permanently removed.`)) return;
    try {
      const res = await fetch(`/api/admin?requester=admin&type=user&id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setActionMessage(`User @${username} deleted.`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Error deleting user');
    }
  };

  // Change user role
  const handleChangeRole = async (userId: string, newRole: 'USER' | 'SINGER' | 'ADMIN') => {
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: 'admin',
          action: 'update_user_role',
          userId,
          role: newRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      } else {
        setErrorMessage(data.error || 'Failed to update role');
      }
    } catch (e) {
      console.error(e);
      setErrorMessage('Error updating role');
    }
  };

  // Add song submit
  const handleAddSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newArtist.trim() || !newAudioUrl.trim()) {
      alert('Title, Artist, and Audio URL are required');
      return;
    }
    setIsSubmittingSong(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: 'admin',
          action: 'add_song',
          title: newTitle.trim(),
          artist: newArtist.trim(),
          album: (newAlbum || 'Single').trim(),
          language: newLanguage,
          genre: newGenre,
          moodEmoji: newMoodEmoji,
          audioUrl: newAudioUrl.trim(),
          likesCount: newLikesCount,
          description: newDescription.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Song "${newTitle}" added to database!`);
        setShowAddSongModal(false);
        setNewTitle('');
        setNewArtist('');
        setNewAudioUrl('');
        setNewDescription('');
        await fetchAdminData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || 'Failed to add song');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating song');
    } finally {
      setIsSubmittingSong(false);
    }
  };

  // Edit song submit
  const handleEditSongSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester: 'admin',
          action: 'update_song',
          ...editingSong,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Song "${editingSong.title}" updated!`);
        setEditingSong(null);
        await fetchAdminData();
        if (onRefreshData) onRefreshData();
      } else {
        alert(data.error || 'Failed to update song');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating song');
    }
  };

  // Filter songs
  const filteredSongs = songs.filter((s) => {
    if (filterLanguage !== 'All' && s.language !== filterLanguage) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.album && s.album.toLowerCase().includes(q)) ||
        (s.language && s.language.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-950/80 border border-red-500/20 text-center space-y-4">
        <ShieldAlert size={48} className="text-red-400 mx-auto animate-pulse" />
        <h3 className="text-xl font-black text-red-300">Admin Authorization Required</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          This portal is reserved strictly for the main website administrator to manage the database and catalog.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Header */}
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 glow-amber flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-2xl text-black shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Database size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                Main Admin Database Portal
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
                Owner Access
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Maintain and manage songs, users, singer accounts, and database storage in real time.
            </p>
          </div>
        </div>

        {/* Global Admin Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleSyncCatalog}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-black font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 disabled:opacity-50"
            title="Populate top songs and albums across all languages"
          >
            <Sparkles size={14} />
            <span>Sync Worldwide Catalog</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddSongModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
          >
            <Plus size={14} />
            <span>Add Song to DB</span>
          </button>

          <button
            type="button"
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Refresh database records"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-zinc-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-zinc-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Database Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 select-none">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
              <Music size={12} className="text-purple-400" /> Total Tracks
            </span>
            <span className="text-2xl font-black text-white mt-1">{stats.totalSongs}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
              <Mic size={12} className="text-cyan-400" /> Singer Accounts
            </span>
            <span className="text-2xl font-black text-cyan-400 mt-1">{stats.singerCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
              <Users size={12} className="text-emerald-400" /> Listeners
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1">{stats.listenerCount}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
              <Heart size={12} className="text-red-400" /> Total Likes
            </span>
            <span className="text-2xl font-black text-red-400 mt-1">{stats.totalLikes}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-900 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider flex items-center gap-1">
              <HardDrive size={12} className="text-amber-400" /> DB Storage
            </span>
            <span className="text-2xl font-black text-amber-300 mt-1">
              {diagnostics?.dbSize || 'Active'}
            </span>
          </div>
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="flex bg-zinc-950/90 p-1 rounded-xl border border-zinc-900 max-w-md select-none text-xs font-black gap-1">
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'songs'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Music size={13} />
          <span>Songs Database ({songs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'users'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users size={13} />
          <span>Users & Singers ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'tools'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders size={13} />
          <span>DB Diagnostics</span>
        </button>
      </div>

      {/* --- TAB 1: SONGS DATABASE --- */}
      {activeTab === 'songs' && (
        <div className="p-5 rounded-2xl glass-panel border border-zinc-900 space-y-4">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-3 text-zinc-500" />
              <input
                type="text"
                placeholder="Search database songs by title, artist, album, language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            {/* Language filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] text-zinc-500 font-black uppercase shrink-0">Language:</span>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {WORLD_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang === 'All' ? 'All Languages' : lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Songs Table */}
          <div className="rounded-xl border border-zinc-850 overflow-hidden bg-zinc-950/60 max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] sticky top-0 z-10 border-b border-zinc-800">
                <tr>
                  <th className="p-3">Track & Artist</th>
                  <th className="p-3 hidden sm:table-cell">Album</th>
                  <th className="p-3">Language</th>
                  <th className="p-3 hidden md:table-cell">Genre & Mood</th>
                  <th className="p-3">Likes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-medium">
                {filteredSongs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      No matching songs in database. Click &ldquo;Add Song to DB&rdquo; or &ldquo;Sync Worldwide Catalog&rdquo;.
                    </td>
                  </tr>
                ) : (
                  filteredSongs.map((song) => (
                    <tr key={song.id} className="hover:bg-zinc-900/40 transition group">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => onPlayTrack && onPlayTrack(song)}
                            className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black flex items-center justify-center transition cursor-pointer shrink-0"
                            title="Preview playback"
                          >
                            <Play size={12} className="fill-current" />
                          </button>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-100 truncate">{song.title}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 hidden sm:table-cell text-zinc-400">
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-semibold">
                          {song.album || 'Single'}
                        </span>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                          {song.language || 'English'}
                        </span>
                      </td>

                      <td className="p-3 hidden md:table-cell text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <span>{song.moodEmoji}</span>
                          <span className="text-[11px]">{song.genre}</span>
                        </div>
                      </td>

                      <td className="p-3 font-bold text-zinc-300">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Heart size={10} className="text-red-400 fill-red-400" />
                          {song.likesCount}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingSong(song)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            title="Delete track"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: USERS & SINGERS --- */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-2xl glass-panel border border-zinc-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users size={16} className="text-amber-400" />
              <span>Registered Accounts & Roles</span>
            </h3>
            <span className="text-xs text-zinc-500 font-bold">
              {users.length} Total Users
            </span>
          </div>

          <div className="rounded-xl border border-zinc-850 overflow-hidden bg-zinc-950/60 max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 uppercase tracking-wider font-extrabold text-[10px] sticky top-0 z-10 border-b border-zinc-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3 hidden sm:table-cell">Email</th>
                  <th className="p-3">Current Role</th>
                  <th className="p-3 hidden md:table-cell">Visibility</th>
                  <th className="p-3 text-right">Change Role / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 font-medium">
                {users.map((u) => {
                  const isCurrentAdmin = u.username.toLowerCase() === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/40 transition">
                      <td className="p-3 font-bold text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span>@{u.username}</span>
                          {isCurrentAdmin && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black">
                              MASTER
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 hidden sm:table-cell text-zinc-400 font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            u.role === 'SINGER'
                              ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                              : u.role === 'ADMIN'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {u.role === 'SINGER' ? '🎤 Singer' : u.role === 'ADMIN' ? '👑 Admin' : '🎧 Listener'}
                        </span>
                      </td>

                      <td className="p-3 hidden md:table-cell text-zinc-400 text-[11px]">
                        {u.isPrivate ? '🔒 Private' : '🌐 Public'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isCurrentAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleChangeRole(u.id, u.role === 'SINGER' ? 'USER' : 'SINGER')}
                                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-200 transition cursor-pointer"
                              >
                                {u.role === 'SINGER' ? 'Make Listener' : 'Promote to Singer'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 rounded hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: DIAGNOSTICS & SYSTEM --- */}
      {activeTab === 'tools' && (
        <div className="p-5 rounded-2xl glass-panel border border-zinc-900 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive size={16} className="text-amber-400" />
            <span>Database Storage & Runtime Diagnostics</span>
          </h3>

          {diagnostics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <p className="text-zinc-500 uppercase font-black text-[10px]">Database Engine</p>
                <p className="text-amber-400 font-bold text-sm">{diagnostics.engine}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <p className="text-zinc-500 uppercase font-black text-[10px]">Database Status</p>
                <p className="text-emerald-400 font-bold text-sm">{diagnostics.dbStatus}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <p className="text-zinc-500 uppercase font-black text-[10px]">Database File Size</p>
                <p className="text-zinc-200 font-bold text-sm">{diagnostics.dbSize}</p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <p className="text-zinc-500 uppercase font-black text-[10px]">SQLite File Path</p>
                <p className="text-zinc-400 text-[10px] break-all select-all">{diagnostics.dbPath}</p>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-zinc-850 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSyncCatalog}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-2 shadow"
            >
              <RefreshCw size={14} />
              <span>Re-index & Synchronize Full Music Catalog</span>
            </button>
          </div>
        </div>
      )}

      {/* --- ADD SONG MODAL --- */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-amber-500/40 glow-amber space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus size={16} className="text-amber-400" />
                <span>Add Song Directly to Database</span>
              </h3>
              <button onClick={() => setShowAddSongModal(false)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSongSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Song Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shape of You"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Singer / Artist *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ed Sheeran"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Album Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Divide (or Single)"
                    value={newAlbum}
                    onChange={(e) => setNewAlbum(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Language *</label>
                  <select
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    {WORLD_LANGUAGES.filter((l) => l !== 'All').map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Genre</label>
                  <input
                    type="text"
                    placeholder="e.g. Pop / Synth"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Vibe / Mood</label>
                  <select
                    value={newMoodEmoji}
                    onChange={(e) => setNewMoodEmoji(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    {MOODS.map((m) => (
                      <option key={m.emoji} value={m.emoji}>
                        {m.emoji} {getMoodName(m.emoji)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-zinc-400">Audio URL or YouTube ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. youtube:JGwWNGJdvx8 or https://.../audio.mp3"
                  value={newAudioUrl}
                  onChange={(e) => setNewAudioUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Prefix with &ldquo;youtube:&rdquo; for YouTube streaming, or provide an MP3 audio URL.
                </p>
              </div>

              <div>
                <label className="block mb-1 font-bold text-zinc-400">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short note or album context..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSongModal(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSong}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{isSubmittingSong ? 'Saving...' : 'Save to Database'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT SONG MODAL --- */}
      {editingSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl glass-panel border border-amber-500/40 glow-amber space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 size={16} className="text-amber-400" />
                <span>Edit Song Metadata</span>
              </h3>
              <button onClick={() => setEditingSong(null)} className="text-zinc-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSongSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block mb-1 font-bold text-zinc-400">Song Title</label>
                <input
                  type="text"
                  required
                  value={editingSong.title}
                  onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Singer / Artist</label>
                  <input
                    type="text"
                    required
                    value={editingSong.artist}
                    onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Album</label>
                  <input
                    type="text"
                    value={editingSong.album}
                    onChange={(e) => setEditingSong({ ...editingSong, album: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Language</label>
                  <select
                    value={editingSong.language || 'English'}
                    onChange={(e) => setEditingSong({ ...editingSong, language: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    {WORLD_LANGUAGES.filter((l) => l !== 'All').map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-zinc-400">Genre</label>
                  <input
                    type="text"
                    value={editingSong.genre}
                    onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-semibold focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-bold text-zinc-400">Audio URL or YouTube ID</label>
                <input
                  type="text"
                  required
                  value={editingSong.audioUrl}
                  onChange={(e) => setEditingSong({ ...editingSong, audioUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-[11px] focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
