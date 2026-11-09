'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useLanguage, Language } from '@/lib/LanguageContext';
import AuthModal from '@/components/AuthModal';
import SongCreator from '@/components/SongCreator';
import CommunityFeed from '@/components/CommunityFeed';
import ChatDrawer from '@/components/ChatDrawer';
import BottomPlayer from '@/components/BottomPlayer';
import Avatar from '@/components/Avatar';
import AdminPortal from '@/components/AdminPortal';
import StoryPortal from '@/components/StoryPortal';
import {
  Music,
  MessageSquare,
  LogOut,
  Globe,
  Lock,
  Unlock,
  Home as HomeIcon,
  Plus,
  ShieldAlert,
  Mic,
  Headphones,
  BookOpen,
} from 'lucide-react';
import { User, Friend, Song } from '@/types';

interface IncomingRequest {
  id: string;
  userId: string;
  createdAt: string;
}

function DashboardContent() {
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTrack, setActiveTrack] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState<number>(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [activeChatFriend, setActiveChatFriend] = useState<string | null>(null);
  const [refreshFeedKey, setRefreshFeedKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [userCount, setUserCount] = useState<number>(0);
  const [showGuide, setShowGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'creator' | 'stories' | 'chat' | 'admin'>('feed');

  // Load user session
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    }
    setAuthChecked(true);
  }, []);

  // Trigger welcome guide popup on session load or login
  useEffect(() => {
    if (currentUser) {
      const guided = localStorage.getItem('gana_guided');
      if (guided !== 'true') {
        setShowGuide(true);
      }
    }
  }, [currentUser]);

  // Fetch Friends and follow requests (with stable reference check)
  const fetchFriends = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/friends?username=${encodeURIComponent(currentUser.username)}`);
      const data = await response.json();
      if (response.ok) {
        setFriends((prev) => {
          const next = data.friends || [];
          if (prev.length === next.length && prev.every((f, i) => f.id === next[i]?.id)) return prev;
          return next;
        });
        setIncomingRequests((prev) => {
          const next = data.incomingRequests || [];
          if (prev.length === next.length && prev.every((r, i) => r.id === next[i]?.id)) return prev;
          return next;
        });
        setTotalUnreadCount((prev) => (prev === data.totalUnreadCount ? prev : data.totalUnreadCount || 0));
      }
    } catch (error) {
      console.error('Failed to fetch friends network:', error);
    }
  };

  // Fetch all songs
  const fetchAllSongs = async () => {
    try {
      const response = await fetch('/api/songs');
      const data = await response.json();
      if (response.ok) {
        setAllSongs(data.songs || []);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    }
  };

  const fetchUserCount = async () => {
    try {
      const response = await fetch('/api/users/count');
      const data = await response.json();
      if (response.ok) {
        setUserCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    }
  };

  useEffect(() => {
    fetchAllSongs();
    fetchUserCount();
    if (currentUser) {
      fetchFriends();
      const interval = setInterval(fetchFriends, 2500);
      return () => clearInterval(interval);
    }
  }, [currentUser, refreshFeedKey]);

  // Handle URL share autoplay
  useEffect(() => {
    if (allSongs.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const playSongId = params.get('play');
      if (playSongId) {
        const matchedSong = allSongs.find((s) => s.id === playSongId);
        if (matchedSong) {
          setActiveTrack(matchedSong);
          setIsPlaying(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [allSongs]);

  // Toggle account privacy (Public / Private)
  const handleTogglePrivacy = async () => {
    if (!currentUser) return;
    const nextPrivate = !currentUser.isPrivate;
    try {
      const response = await fetch('/api/user/privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          isPrivate: nextPrivate,
        }),
      });

      if (response.ok) {
        const updated = { ...currentUser, isPrivate: nextPrivate };
        setCurrentUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
      } else {
        alert('Failed to update privacy settings');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Approve follow request
  const handleAcceptRequest = async (requesterUsername: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername,
          targetUsername: currentUser.username,
        }),
      });

      if (response.ok) {
        fetchFriends();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Reject follow request
  const handleRejectRequest = async (requesterUsername: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(
        `/api/friends?requesterUsername=${encodeURIComponent(
          requesterUsername
        )}&targetUsername=${encodeURIComponent(currentUser.username)}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        fetchFriends();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSongCreated = () => {
    setRefreshFeedKey((prev) => prev + 1);
    setActiveTab('feed');
  };

  const handlePlayTrack = (song: Song) => {
    // Ensure played track (from search results, trending, or stories) is present in queue for autoplay
    setAllSongs((prev) => {
      if (!prev.some((s) => s.id === song.id)) {
        return [...prev, song];
      }
      return prev;
    });

    if (activeTrack?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveTrack(song);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (!allSongs || allSongs.length === 0 || !activeTrack) return;
    const currentIndex = allSongs.findIndex((s) => s.id === activeTrack.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % allSongs.length;
    setActiveTrack(allSongs[nextIndex]);
    setIsPlaying(true);
  };

  const handlePreviousTrack = () => {
    if (!allSongs || allSongs.length === 0 || !activeTrack) return;
    const currentIndex = allSongs.findIndex((s) => s.id === activeTrack.id);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + allSongs.length) % allSongs.length;
    setActiveTrack(allSongs[prevIndex]);
    setIsPlaying(true);
  };

  const handleLikeToggle = async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}/like`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (activeTrack?.id === songId) {
          setActiveTrack({ ...activeTrack, likesCount: data.song.likesCount });
        }
        setAllSongs((prev) =>
          prev.map((s) => (s.id === songId ? { ...s, likesCount: data.song.likesCount } : s))
        );
        setRefreshFeedKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleShareSongToFriend = async (songId: string, friendUsername: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: friendUsername,
          text: `Hey, check out this track on Gana! 🎶`,
          sharedSongId: songId,
        }),
      });

      if (response.ok) {
        setActiveChatFriend(friendUsername);
        setActiveTab('chat');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to share song');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    setActiveChatFriend(null);
    setFriends([]);
    setIncomingRequests([]);
  };

  if (!authChecked) {
    return (
      <div className="flex-1 flex justify-center items-center bg-zinc-950 text-zinc-500">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthModal onLogin={setCurrentUser} />;
  }

  const isAdmin = currentUser.username.toLowerCase() === 'admin' || currentUser.role === 'ADMIN';
  const isSinger = currentUser.role === 'SINGER';
  const isWriter = currentUser.role === 'STORY_WRITER';

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-28 bg-zinc-950 text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-zinc-950/80 backdrop-blur border-b border-zinc-900">
        <div className="flex items-center gap-3">
          {/* Rebranded Glowing Logo */}
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl text-black shadow-lg shadow-purple-500/20 animate-pulse flex items-center justify-center">
            <Music size={24} strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-widest bg-gradient-to-r from-white via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Gana
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black flex items-center gap-1 shadow-sm glow-cyan select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {userCount} Users
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:block">
              Worldwide Music Platform
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-3">
          {/* Quick Admin Portal Button for Admin */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border shadow ${
                activeTab === 'admin'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-amber-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500 hover:text-black'
              }`}
            >
              <ShieldAlert size={14} />
              <span className="hidden sm:inline">Admin Portal</span>
            </button>
          )}

          {/* i18n Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <Globe size={14} className="text-zinc-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs text-zinc-200 border-none outline-none font-bold cursor-pointer"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          {/* User Profile Summary & Role Badge */}
          <div className="hidden sm:flex flex-col items-end gap-0.5 bg-zinc-900/40 border border-zinc-900 px-3 py-1.5 rounded-xl select-none">
            <div className="flex items-center gap-1.5">
              <Avatar username={currentUser.username} size={20} />
              <span className="font-black text-zinc-200 text-xs">@{currentUser.username}</span>

              {/* Role Badge */}
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : isSinger
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : isWriter
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}
              >
                {isAdmin ? '👑 Admin' : isSinger ? '🎤 Singer' : isWriter ? '📖 Story Writer' : '🎧 Listener'}
              </span>
            </div>

            {/* Account Privacy Toggle Switch */}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-zinc-500 font-black uppercase flex items-center gap-0.5">
                {currentUser.isPrivate ? (
                  <>
                    <Lock size={10} className="text-purple-400" />
                    Private
                  </>
                ) : (
                  <>
                    <Unlock size={10} className="text-cyan-400" />
                    Public
                  </>
                )}
              </span>

              <button
                onClick={handleTogglePrivacy}
                className={`w-7 h-4 rounded-full p-0.5 transition duration-200 cursor-pointer ${
                  currentUser.isPrivate ? 'bg-purple-600' : 'bg-zinc-700'
                }`}
                title="Toggle Public/Private Account"
              >
                <div
                  className={`w-3 h-3 bg-black rounded-full transition transform duration-200 ${
                    currentUser.isPrivate ? 'translate-x-3 bg-white' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={t('nav.logout')}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/40 text-zinc-400 hover:text-red-400 transition cursor-pointer active:scale-95"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Modern navigation tabs bar */}
      <div className="max-w-7xl w-full mx-auto px-4 lg:px-6 mt-4 flex items-center justify-between gap-4">
        <div className="flex bg-zinc-950/85 p-1.5 rounded-xl border border-zinc-900 shadow-xl gap-1.5 select-none w-full sm:w-auto overflow-x-auto">
          {/* Tab 1: Home Feed */}
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 select-none active:scale-95 border shrink-0 ${
              activeTab === 'feed'
                ? 'bg-purple-600 border-purple-500 text-black font-extrabold shadow shadow-purple-500/25'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <HomeIcon size={14} />
            <span>Home Feed</span>
          </button>

          {/* Tab 2: Singer Studio (Upload Songs into website) */}
          <button
            onClick={() => setActiveTab('creator')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 select-none active:scale-95 border shrink-0 ${
              activeTab === 'creator'
                ? 'bg-purple-600 border-purple-500 text-black font-extrabold shadow shadow-purple-500/25'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            {isSinger ? <Mic size={14} className="text-purple-300" /> : <Plus size={14} />}
            <span>{isSinger ? '🎤 Singer Studio (Upload)' : 'Upload Songs'}</span>
          </button>

          {/* Tab 3: Audio Stories & Novels */}
          <button
            onClick={() => setActiveTab('stories')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 select-none active:scale-95 border shrink-0 ${
              activeTab === 'stories'
                ? 'bg-purple-600 border-purple-500 text-black font-extrabold shadow shadow-purple-500/25'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <BookOpen size={14} className={isWriter ? 'text-emerald-300' : 'text-purple-300'} />
            <span>Audio Stories & Novels</span>
            {isWriter && (
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/30">
                Writer
              </span>
            )}
          </button>

          {/* Tab 4: Chat Room */}
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 select-none active:scale-95 border relative shrink-0 ${
              activeTab === 'chat'
                ? 'bg-purple-600 border-purple-500 text-black font-extrabold shadow shadow-purple-500/25'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat Room</span>
            {totalUnreadCount > 0 ? (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black leading-none shadow shadow-emerald-500/30 animate-pulse">
                {totalUnreadCount}
              </span>
            ) : incomingRequests.length > 0 ? (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full animate-ping" />
            ) : null}
          </button>

          {/* Tab 4: Main Admin Database Portal (Visible to Admin) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 select-none active:scale-95 border shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-amber-500 border-amber-400 text-black font-extrabold shadow shadow-amber-500/25'
                  : 'bg-transparent border-transparent text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert size={14} />
              <span>Admin Database Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 overflow-hidden">
        {activeTab === 'feed' && (
          <div className="space-y-6 animate-fade-in">
            <CommunityFeed
              onPlayTrack={handlePlayTrack}
              currentTrack={activeTrack}
              isPlaying={isPlaying}
              friends={friends}
              onShareSong={handleShareSongToFriend}
              refreshKey={refreshFeedKey}
            />
          </div>
        )}

        {activeTab === 'creator' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            {/* Singer announcement banner */}
            <div className="p-4 rounded-2xl glass-panel border border-purple-500/30 glow-purple flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-600 text-black">
                  <Mic size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {isSinger ? 'Singer Studio: Add or Upload Songs into Website' : 'Music Creator: Upload Your Tracks'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Upload MP3 / WAV files, stream via YouTube link, or record vocal hooks with procedurally generated beats.
                  </p>
                </div>
              </div>
            </div>

            <SongCreator
              creatorUsername={currentUser.username}
              onSongCreated={handleSongCreated}
            />
          </div>
        )}

        {activeTab === 'stories' && (
          <div className="space-y-6 animate-fade-in">
            <StoryPortal
              currentUser={currentUser}
              onPlayTrack={handlePlayTrack}
              currentTrack={activeTrack}
              isPlaying={isPlaying}
            />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[75vh] rounded-2xl overflow-hidden border border-zinc-900 shadow-2xl animate-fade-in">
            <ChatDrawer
              currentUser={currentUser}
              friends={friends}
              incomingRequests={incomingRequests}
              onAcceptRequest={handleAcceptRequest}
              onRejectRequest={handleRejectRequest}
              onRefreshFriends={fetchFriends}
              songs={allSongs}
              onPlayTrack={handlePlayTrack}
              currentTrack={activeTrack}
              isPlaying={isPlaying}
              activeChatFriend={activeChatFriend}
              setActiveChatFriend={setActiveChatFriend}
              onClose={() => setActiveTab('feed')}
            />
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-6 animate-fade-in">
            <AdminPortal
              currentUser={currentUser}
              onRefreshData={() => {
                fetchAllSongs();
                setRefreshFeedKey((prev) => prev + 1);
              }}
              onPlayTrack={handlePlayTrack}
            />
          </div>
        )}
      </main>

      {/* Sticky Bottom Player */}
      <BottomPlayer
        currentTrack={activeTrack}
        isPlaying={isPlaying}
        onPlayPauseToggle={setIsPlaying}
        onLikeToggle={handleLikeToggle}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
      />

      {/* Guide Popup */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-purple-500/30 glow-purple space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-2xl text-black animate-pulse flex items-center justify-center">
                <Music size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                  Welcome to Gana!
                </h3>
                <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">
                  Worldwide Music & Artist Platform
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed font-semibold">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1.5">
                <h4 className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <span>🌍</span> Worldwide Top Singers & Languages
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  Filter by language (English, Hindi, Punjabi, Spanish, Korean, Tamil, Telugu, French, Japanese) to instantly discover top singers and hit albums worldwide!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                <h4 className="text-purple-400 font-bold flex items-center gap-1.5">
                  <span>✨</span> Add Songs According to Your Mood
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  Use the &ldquo;Add to Mood&rdquo; button on any track to save it to your personal Mood Playlists (Energetic, Romantic, Chill, Party, Focus, Sad).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-850 space-y-1">
                <h4 className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span>🎤</span> Singer Studio & Admin Portal
                </h4>
                <p className="text-zinc-400 text-[11px]">
                  Singers can upload MP3/WAV tracks or YouTube streams. Main admin can manage the entire database and worldwide catalog from the Admin Portal.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem('gana_guided', 'true');
                setShowGuide(false);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-purple-500/20 transition cursor-pointer select-none active:scale-95 text-center uppercase tracking-widest"
            >
              Start Listening!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex justify-center items-center bg-zinc-950 text-zinc-500">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
