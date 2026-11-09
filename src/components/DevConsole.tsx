'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Users, Database, Music, Trash2, ShieldAlert, Cpu } from 'lucide-react';

interface AdminUser {
  id: string;
  username: string;
  isPrivate: boolean;
  createdAt: string;
}

interface AdminSong {
  id: string;
  title: string;
  genre: string;
  creatorUsername: string;
  likesCount: number;
}

interface Diagnostics {
  dbPath: string;
  dbSize: string;
  engine: string;
}

interface DevConsoleProps {
  currentUserUsername: string;
  onRefresh: () => void;
}

export default function DevConsole({ currentUserUsername, onRefresh }: DevConsoleProps) {
  // Guard clause to ensure only host/developer logged in as 'admin' can see/load this panel
  if (currentUserUsername !== 'admin') return null;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [songs, setSongs] = useState<AdminSong[]>([]);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'songs' | 'diagnostics'>('diagnostics');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin?requester=${currentUserUsername}`);
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
        setSongs(data.songs || []);
        setDiagnostics(data.diagnostics || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUserUsername]);

  const handleDeleteRecord = async (type: 'user' | 'song', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}? This action is irreversible.`)) return;

    try {
      const response = await fetch(`/api/admin?requester=admin&type=${type}&id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchAdminData();
        onRefresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete record');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-950/80 border border-orange-500/20 glow-orange mb-6">
      {/* Dev Console Header */}
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-zinc-900 justify-between">
        <div className="flex items-center gap-2 text-orange-400">
          <Terminal size={22} className="animate-pulse" />
          <h3 className="text-lg font-black tracking-widest uppercase">Host Developer Center</h3>
        </div>
        <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[9px] font-black uppercase">
          <ShieldAlert size={10} className="shrink-0" />
          <span>Root Privilege</span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900 select-none mb-4 max-w-xs text-xs font-bold gap-1 text-zinc-400">
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'diagnostics' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow' : 'hover:text-zinc-200'
          }`}
        >
          <Cpu size={12} />
          <span>Diagnostics</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'users' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow' : 'hover:text-zinc-200'
          }`}
        >
          <Users size={12} />
          <span>Users</span>
        </button>
        <button
          onClick={() => setActiveTab('songs')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition cursor-pointer ${
            activeTab === 'songs' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow' : 'hover:text-zinc-200'
          }`}
        >
          <Music size={12} />
          <span>Songs</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-6 text-zinc-600 text-xs">
          <Loader2 size={12} className="animate-spin" />
          <span>Inspecting database...</span>
        </div>
      ) : (
        <div className="min-h-40">
          {/* Tab 1: Diagnostics */}
          {activeTab === 'diagnostics' && diagnostics && (
            <div className="space-y-4 text-xs font-mono text-zinc-400">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-900 space-y-1.5">
                <p className="flex justify-between border-b border-zinc-950 pb-1">
                  <span className="text-zinc-500 uppercase font-black">Database Engine:</span>
                  <span className="text-orange-400 font-bold">{diagnostics.engine}</span>
                </p>
                <p className="flex justify-between border-b border-zinc-950 pb-1">
                  <span className="text-zinc-500 uppercase font-black">Database Size:</span>
                  <span className="text-zinc-300 font-bold">{diagnostics.dbSize}</span>
                </p>
                <div className="pt-1">
                  <span className="text-zinc-500 uppercase font-black block mb-1">Local Host Filepath:</span>
                  <span className="text-[10px] text-zinc-500 break-all select-all block bg-black/60 p-1.5 rounded border border-zinc-950">
                    {diagnostics.dbPath}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Users list */}
          {activeTab === 'users' && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs gap-3"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-bold text-zinc-200 truncate">@{u.username}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      u.isPrivate ? 'bg-purple-950/40 text-purple-400 border border-purple-500/20' : 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                    }`}>
                      {u.isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                  
                  {u.username !== 'admin' && (
                    <button
                      onClick={() => handleDeleteRecord('user', u.id)}
                      className="p-1.5 rounded hover:bg-red-950/40 border border-transparent hover:border-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                      title="Delete User Account"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Songs list */}
          {activeTab === 'songs' && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {songs.length === 0 ? (
                <p className="text-center text-zinc-600 text-xs py-8">No tracks in library</p>
              ) : (
                songs.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-2.5 bg-zinc-900/40 border border-zinc-900 rounded-xl text-xs gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-zinc-200 truncate">{s.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">Creator: @{s.creatorUsername} • Likes: {s.likesCount}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteRecord('song', s.id)}
                      className="p-1.5 rounded hover:bg-red-950/40 border border-transparent hover:border-red-500/20 text-zinc-500 hover:text-red-400 transition cursor-pointer shrink-0"
                      title="Delete Song"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Simple loader helper inside console
function Loader2({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      style={{ width: size, height: size }}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
