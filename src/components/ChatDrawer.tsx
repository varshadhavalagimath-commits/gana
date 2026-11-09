'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  MessageSquare,
  Send,
  Search,
  UserPlus,
  X,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCheck,
  Music,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { User, Friend, Song, ChatMessage, SearchUserResult } from '@/types';
import Avatar from './Avatar';

interface ChatDrawerProps {
  currentUser: User | null;
  friends: Friend[];
  incomingRequests: any[];
  onAcceptRequest: (requesterUsername: string) => void;
  onRejectRequest: (requesterUsername: string) => void;
  onRefreshFriends: () => void;
  songs: Song[];
  onPlayTrack: (song: Song) => void;
  currentTrack: Song | null;
  isPlaying: boolean;
  activeChatFriend: string | null;
  setActiveChatFriend: (username: string | null) => void;
  onClose?: () => void;
}

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const formatTime = (time: string | Date | undefined | null) => {
  if (!time) return '';
  const d = new Date(time);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatDrawer({
  currentUser,
  friends,
  incomingRequests,
  onAcceptRequest,
  onRejectRequest,
  onRefreshFriends,
  songs,
  onPlayTrack,
  currentTrack,
  isPlaying,
  activeChatFriend,
  setActiveChatFriend,
  onClose,
}: ChatDrawerProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(true);

  // Song sharing state
  const [showSongPicker, setShowSongPicker] = useState(false);
  const [selectedSongToShare, setSelectedSongToShare] = useState<Song | null>(null);
  const [songFilter, setSongFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Search users with partial query or alphabet filter
  const performSearch = async (term: string) => {
    if (!currentUser) return;
    setIsSearching(true);
    try {
      const url = term.trim()
        ? `/api/friends/search?q=${encodeURIComponent(
            term.trim().toLowerCase()
          )}&currentUser=${encodeURIComponent(currentUser.username)}`
        : `/api/friends/search?currentUser=${encodeURIComponent(currentUser.username)}`;

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setSearchResults(data.users || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Initial load of directory users
  useEffect(() => {
    if (currentUser) {
      performSearch(searchQuery);
    }
  }, [currentUser]);

  // Handle typing search
  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setSelectedLetter(null);
    performSearch(val);
  };

  // Handle alphabet filter click
  const handleLetterClick = (letter: string) => {
    if (selectedLetter === letter) {
      setSelectedLetter(null);
      setSearchQuery('');
      performSearch('');
    } else {
      setSelectedLetter(letter);
      setSearchQuery(letter.toLowerCase());
      performSearch(letter.toLowerCase());
    }
  };

  // Add friend / Send friend request
  const handleAddFriend = async (friendUsername: string) => {
    if (!currentUser || addingFriend) return;
    setAddingFriend(friendUsername);

    try {
      const response = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUsername: currentUser.username,
          targetUsername: friendUsername,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Optimistically update relationshipStatus in search results
        setSearchResults((prev) =>
          prev.map((u) =>
            u.username.toLowerCase() === friendUsername.toLowerCase()
              ? {
                  ...u,
                  relationshipStatus:
                    data.status === 'ACCEPTED' ? 'FRIENDS' : 'REQUEST_SENT',
                }
              : u
          )
        );
        alert(data.message || 'Friend request sent!');
        onRefreshFriends();
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Add friend error:', error);
    } finally {
      setAddingFriend(null);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    if (!currentUser || !activeChatFriend) return;
    try {
      const response = await fetch(
        `/api/chat?sender=${encodeURIComponent(
          currentUser.username
        )}&receiver=${encodeURIComponent(activeChatFriend)}`
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  // When activeChatFriend changes, fetch messages and clear unread count via onRefreshFriends
  useEffect(() => {
    if (activeChatFriend) {
      fetchMessages();
      onRefreshFriends();
    }
  }, [activeChatFriend]);

  // Periodic polling for incoming messages and friend metadata updates (every 1.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChatFriend) {
        fetchMessages();
      }
      onRefreshFriends();
    }, 1500);
    return () => clearInterval(interval);
  }, [activeChatFriend, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message with optional shared song
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentUser ||
      !activeChatFriend ||
      (!messageText.trim() && !selectedSongToShare)
    ) {
      return;
    }

    const textToSend = messageText.trim();
    const songToShare = selectedSongToShare;

    setMessageText('');
    setSelectedSongToShare(null);
    setShowSongPicker(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderUsername: currentUser.username,
          receiverUsername: activeChatFriend,
          text: textToSend || (songToShare ? `Shared 🎶 ${songToShare.title}` : ''),
          sharedSongId: songToShare?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        onRefreshFriends();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  // Check if activeChatFriend is connected (status ACCEPTED)
  const isChatActiveAccepted = friends.some(
    (f) => f.username.toLowerCase() === activeChatFriend?.toLowerCase()
  );

  // Filter songs for sharing picker
  const filteredSongsToShare = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(songFilter.toLowerCase()) ||
      s.artist.toLowerCase().includes(songFilter.toLowerCase()) ||
      s.genre.toLowerCase().includes(songFilter.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-zinc-950/90 border-l border-zinc-900 glass-panel">
      {/* Header with Small Logo */}
      <div className="p-3 border-b border-zinc-900 flex justify-between items-center bg-zinc-950">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-purple-600 to-cyan-500 rounded-lg text-black shadow-md shadow-purple-500/20 animate-pulse flex items-center justify-center">
            <Music size={11} strokeWidth={3} />
          </div>
          <h3 className="text-xs font-black tracking-widest uppercase text-zinc-100">
            Gana Chat
          </h3>
        </div>
        {/* Back to feed button (closes drawer on mobile) */}
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded transition cursor-pointer md:hidden"
          title="Back to Feed"
        >
          <X size={14} />
        </button>
      </div>

      {/* Panels Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Friends & Search Panel */}
        <div
          className={`w-full md:w-80 flex flex-col border-r border-zinc-900 bg-zinc-950/20 ${
            activeChatFriend ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Box & Alphabet Quick-Filter */}
          <div className="p-2 border-b border-zinc-900/60 space-y-2 bg-zinc-950/40">
            {/* Text Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search name or type alphabet..."
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-purple-500 transition font-semibold"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLetter(null);
                    performSearch('');
                  }}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-white cursor-pointer"
                  title="Clear"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Alphabet Scroller Strip */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedLetter(null);
                  setSearchQuery('');
                  performSearch('');
                }}
                className={`px-1.5 py-0.5 text-[8px] font-black rounded shrink-0 transition cursor-pointer ${
                  selectedLetter === null && !searchQuery
                    ? 'bg-purple-600 text-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                All
              </button>
              {ALPHABETS.map((letter) => {
                const isSelected =
                  selectedLetter === letter ||
                  searchQuery.toUpperCase() === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => handleLetterClick(letter)}
                    className={`px-1 py-0.5 text-[8px] font-black rounded shrink-0 min-w-[17px] text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-black shadow shadow-purple-500/30'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>

            {/* User Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-zinc-900/95 rounded-lg border border-zinc-850 p-1.5 space-y-1 max-h-44 overflow-y-auto">
                <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider px-1">
                  Matching People ({searchResults.length})
                </div>
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex justify-between items-center p-1.5 rounded hover:bg-zinc-800/80 transition gap-2"
                  >
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Avatar username={user.username} size={18} />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-zinc-200 font-semibold truncate block">
                          @{user.username}
                        </span>
                      </div>
                      {user.isPrivate && (
                        <span title="Private Account">
                          <Lock size={9} className="text-zinc-500" />
                        </span>
                      )}
                    </div>

                    {/* Action buttons based on relationship status */}
                    <div className="flex items-center gap-1 shrink-0">
                      {user.relationshipStatus === 'FRIENDS' && (
                        <button
                          onClick={() => {
                            setActiveChatFriend(user.username);
                          }}
                          className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[9px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Open Chat"
                        >
                          <MessageSquare size={9} />
                          <span>Chat</span>
                        </button>
                      )}

                      {user.relationshipStatus === 'REQUEST_SENT' && (
                        <span className="px-2 py-0.5 rounded bg-zinc-850 text-zinc-400 border border-zinc-800 text-[9px] font-bold flex items-center gap-1 select-none">
                          <Clock size={9} />
                          <span>Pending</span>
                        </span>
                      )}

                      {user.relationshipStatus === 'REQUEST_RECEIVED' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              onAcceptRequest(user.username);
                              performSearch(searchQuery);
                            }}
                            className="p-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer transition active:scale-95"
                            title="Accept Request"
                          >
                            <Check size={10} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => {
                              onRejectRequest(user.username);
                              performSearch(searchQuery);
                            }}
                            className="p-1 rounded bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white cursor-pointer transition active:scale-95"
                            title="Reject Request"
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      )}

                      {user.relationshipStatus === 'NONE' && (
                        <button
                          onClick={() => handleAddFriend(user.username)}
                          disabled={addingFriend === user.username}
                          className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-black text-[9px] font-black transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        >
                          <UserPlus size={9} />
                          <span>Request</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow / Friend Requests Collapsible Panel */}
          {incomingRequests.length > 0 && (
            <div className="mx-2 mt-2 bg-purple-950/20 border border-purple-500/30 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowRequests(!showRequests)}
                className="w-full px-2.5 py-1.5 flex justify-between items-center text-[10px] font-black text-purple-400 cursor-pointer hover:bg-purple-950/40"
              >
                <span>Friend Requests ({incomingRequests.length})</span>
                <span className="text-[8px]">{showRequests ? '▲' : '▼'}</span>
              </button>

              {showRequests && (
                <div className="p-1.5 space-y-1 border-t border-purple-500/20 max-h-32 overflow-y-auto">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between gap-2 p-1.5 bg-zinc-950/70 rounded-md border border-zinc-850"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <Avatar username={req.userId} size={16} />
                        <span className="text-[10px] font-bold text-zinc-300 truncate">
                          @{req.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onAcceptRequest(req.userId)}
                          className="p-1 rounded bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer transition active:scale-95"
                          title="Accept Request"
                        >
                          <Check size={11} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => onRejectRequest(req.userId)}
                          className="p-1 rounded bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white cursor-pointer transition active:scale-95"
                          title="Reject Request"
                        >
                          <X size={11} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WhatsApp-Style Accepted Friends List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
            <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider px-2 py-1">
              Conversations ({friends.length})
            </div>
            {friends.length === 0 ? (
              <div className="text-center text-[10px] text-zinc-600 py-10 font-bold px-4">
                {t('chat.no_friends')}
              </div>
            ) : (
              friends.map((friend) => {
                const isActive =
                  activeChatFriend?.toLowerCase() === friend.username.toLowerCase();
                const unread = friend.unreadCount || 0;

                return (
                  <button
                    key={friend.id}
                    onClick={() => setActiveChatFriend(friend.username)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer border ${
                      isActive
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 shadow shadow-purple-500/5'
                        : unread > 0
                        ? 'bg-emerald-950/25 border-emerald-500/40 text-white hover:bg-emerald-950/40'
                        : 'border-transparent text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 mr-1.5">
                      <div className="relative shrink-0">
                        <Avatar username={friend.username} size={26} />
                        {unread > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-zinc-950 shadow-sm" />
                        )}
                      </div>

                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[11px] truncate block ${
                              unread > 0 ? 'font-black text-white' : 'font-bold'
                            }`}
                          >
                            @{friend.username}
                          </span>
                          {friend.lastMessageTime && (
                            <span className="text-[8px] text-zinc-500 font-semibold shrink-0 ml-1">
                              {formatTime(friend.lastMessageTime)}
                            </span>
                          )}
                        </div>

                        {friend.lastMessage ? (
                          <p
                            className={`text-[9px] truncate mt-0.5 ${
                              unread > 0
                                ? 'text-emerald-400 font-bold'
                                : 'text-zinc-500 font-medium'
                            }`}
                          >
                            {friend.lastMessage}
                          </p>
                        ) : (
                          <p className="text-[9px] text-zinc-600 truncate mt-0.5">
                            Tap to start chat
                          </p>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp-Style Circular Unread Counter Badge */}
                    <div className="flex items-center gap-1 shrink-0">
                      {unread > 0 ? (
                        <span className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-black text-[9px] font-black rounded-full flex items-center justify-center shadow-md shadow-emerald-500/25 animate-pulse">
                          {unread}
                        </span>
                      ) : (
                        <ChevronRight
                          size={12}
                          className={isActive ? 'text-purple-400' : 'text-zinc-600'}
                        />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div
          className={`flex-1 flex flex-col bg-zinc-950/40 relative ${
            activeChatFriend
              ? 'flex'
              : 'hidden md:flex justify-center items-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider p-6'
          }`}
        >
          {activeChatFriend ? (
            <>
              {/* Header with Friend Avatar & Status */}
              <div className="px-3 py-2 border-b border-zinc-900/60 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {/* Mobile Back Button to Friends List */}
                  <button
                    onClick={() => setActiveChatFriend(null)}
                    className="p-1 -ml-1 mr-1 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded transition md:hidden cursor-pointer"
                    title="Back to Friends"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <Avatar username={activeChatFriend} size={22} />
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-black text-white block">
                      @{activeChatFriend}
                    </span>
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold tracking-wider">
                      {isChatActiveAccepted ? 'Connected Friend' : 'Pending Request'}
                    </span>
                  </div>
                </div>
                {!isChatActiveAccepted && (
                  <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-[9px] font-bold text-purple-300 flex items-center gap-1">
                    <Lock size={10} className="text-purple-400 shrink-0" />
                    <span>Locked</span>
                  </span>
                )}
              </div>

              {/* Message Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isChatActiveAccepted ? (
                  messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-zinc-600">
                      <MessageSquare size={24} className="text-zinc-700" />
                      <p className="text-xs font-bold text-zinc-400">No messages yet</p>
                      <p className="text-[10px] text-zinc-600">
                        Say hello or share a song with @{activeChatFriend}!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderUsername === currentUser?.username;
                      const sharedSong = msg.sharedSongId
                        ? songs.find((s) => s.id === msg.sharedSongId)
                        : null;
                      const isThisSongPlaying =
                        sharedSong &&
                        currentTrack?.id === sharedSong.id &&
                        isPlaying;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-2 max-w-[85%] ${
                            isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          <Avatar username={msg.senderUsername} size={18} />

                          <div
                            className={`flex flex-col ${
                              isMe ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`px-3 py-2 rounded-xl text-xs ${
                                isMe
                                  ? 'bg-purple-600 text-white rounded-tr-none'
                                  : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'
                              }`}
                            >
                              {msg.text && (
                                <p className="leading-relaxed whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              )}

                              {/* Shared Song Card */}
                              {sharedSong && (
                                <div
                                  className={`mt-2 p-2 rounded-lg border flex items-center justify-between gap-2.5 w-52 ${
                                    isMe
                                      ? 'bg-zinc-950/70 border-purple-500/40 text-white'
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-7 h-7 rounded bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                      <Music
                                        size={12}
                                        className={`text-purple-400 ${
                                          isThisSongPlaying ? 'animate-bounce' : ''
                                        }`}
                                      />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="text-[10px] font-bold text-white truncate">
                                        {sharedSong.title}
                                      </p>
                                      <p className="text-[8px] text-zinc-400 truncate">
                                        {sharedSong.artist || sharedSong.genre}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => onPlayTrack(sharedSong)}
                                    className="p-1.5 rounded-full bg-purple-500 text-black hover:bg-purple-400 transition cursor-pointer shrink-0 active:scale-95"
                                    title={isThisSongPlaying ? 'Pause' : 'Play Song'}
                                  >
                                    {isThisSongPlaying ? (
                                      <Pause size={10} fill="black" />
                                    ) : (
                                      <Play size={10} fill="black" />
                                    )}
                                  </button>
                                </div>
                              )}

                              {/* WhatsApp-Style Message Time & Read Receipts */}
                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  isMe ? 'justify-end' : 'justify-start'
                                } text-[8px] text-zinc-300/80 select-none`}
                              >
                                <span>{formatTime(msg.timestamp)}</span>
                                {isMe && (
                                  <span
                                    title={
                                      msg.isRead
                                        ? 'Read by recipient'
                                        : 'Delivered'
                                    }
                                  >
                                    <CheckCheck
                                      size={12}
                                      className={
                                        msg.isRead
                                          ? 'text-cyan-300'
                                          : 'text-zinc-400'
                                      }
                                    />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 p-4 text-zinc-500 select-none">
                    <Lock size={32} className="text-purple-500/50" />
                    <p className="text-xs font-bold text-zinc-300">
                      Connection Pending
                    </p>
                    <p className="text-[10px] text-zinc-500 max-w-[240px]">
                      A friend request must be accepted before you can chat and share tracks with @{activeChatFriend}.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Attached Song Banner (if selected to share) */}
              {isChatActiveAccepted && selectedSongToShare && (
                <div className="mx-2 mb-1 px-2.5 py-1.5 bg-purple-950/50 border border-purple-500/30 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Music size={12} className="text-purple-400 shrink-0 animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-200 truncate">
                      Attached: <span className="text-purple-300">{selectedSongToShare.title}</span> ({selectedSongToShare.artist})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSongToShare(null)}
                    className="p-0.5 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded cursor-pointer"
                    title="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {/* Song Selector Popover */}
              {isChatActiveAccepted && showSongPicker && (
                <div className="absolute bottom-14 left-2 right-2 bg-zinc-900 border border-zinc-800 rounded-xl p-2 shadow-2xl z-20 space-y-2 max-h-60 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      <Music size={11} className="text-purple-400" />
                      Select a Song to Share
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSongPicker(false)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Search song title or artist..."
                    value={songFilter}
                    onChange={(e) => setSongFilter(e.target.value)}
                    className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-[10px] text-white focus:outline-none focus:border-purple-500"
                  />

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {filteredSongsToShare.length === 0 ? (
                      <p className="text-[10px] text-zinc-600 text-center py-4 font-semibold">
                        No songs found
                      </p>
                    ) : (
                      filteredSongsToShare.map((song) => (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => {
                            setSelectedSongToShare(song);
                            setShowSongPicker(false);
                          }}
                          className="w-full flex items-center justify-between p-1.5 rounded hover:bg-zinc-800 text-left transition cursor-pointer"
                        >
                          <div className="overflow-hidden pr-2">
                            <p className="text-[10px] font-bold text-zinc-200 truncate">
                              {song.title}
                            </p>
                            <p className="text-[8px] text-zinc-400 truncate">
                              {song.artist} · {song.genre}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-purple-600 text-black text-[8px] font-black shrink-0">
                            Select
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Message Composer Form */}
              {isChatActiveAccepted && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-2 border-t border-zinc-900/60 bg-zinc-950 flex items-center gap-1.5"
                >
                  {/* Share Song Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setShowSongPicker(!showSongPicker)}
                    className={`p-2 rounded-lg border transition cursor-pointer shrink-0 ${
                      showSongPicker || selectedSongToShare
                        ? 'bg-purple-600 text-black border-purple-500'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-purple-400 hover:border-zinc-700'
                    }`}
                    title="Share a Song"
                  >
                    <Music size={13} />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 transition font-semibold"
                  />

                  <button
                    type="submit"
                    className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-black cursor-pointer transition active:scale-95 shrink-0"
                    title="Send"
                  >
                    <Send size={13} fill="black" />
                  </button>
                </form>
              )}
            </>
          ) : (
            <span>Select a conversation to start chatting</span>
          )}
        </div>
      </div>
    </div>
  );
}
