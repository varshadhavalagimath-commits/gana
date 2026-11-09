'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Play,
  Pause,
  Heart,
  Share2,
  Music,
  Trash2,
  MessageSquare,
  Send,
  Search,
  Sparkles,
  TrendingUp,
  X,
  ArrowRight,
  Globe,
  Loader2,
  CheckCircle2,
  Smile,
  ListMusic,
  BookOpen,
  Copy,
  Check,
  Flame,
  Award,
} from 'lucide-react';
import { Song, Friend, User as UserType, Comment } from '@/types';
import Avatar from './Avatar';
import { MOODS, getMoodName } from '@/lib/moods';
import { WORLD_LANGUAGES } from '@/lib/artists';
import { MUSIC_INDUSTRIES, IndustryItem, IndustrySong, getDailyChartInfo, getDailyIndustryTop5 } from '@/lib/industries';

interface CommunityFeedProps {
  onPlayTrack: (song: Song) => void;
  currentTrack: Song | null;
  isPlaying: boolean;
  friends: Friend[];
  onShareSong: (songId: string, friendUsername: string) => void;
  refreshKey: number;
}

const moods = MOODS;

export default function CommunityFeed({
  onPlayTrack,
  currentTrack,
  isPlaying,
  friends,
  onShareSong,
  refreshKey,
}: CommunityFeedProps) {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);

  // Industry & Language Filter States
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [onlyLiked, setOnlyLiked] = useState(false);
  const [activeMoodPlaylist, setActiveMoodPlaylist] = useState<string | null>(null);

  // Database songs state
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Social & Mood States
  const [shareDropdownSongId, setShareDropdownSongId] = useState<string | null>(null);
  const [copiedSongId, setCopiedSongId] = useState<string | null>(null);
  const [moodPickerSongId, setMoodPickerSongId] = useState<string | null>(null);
  const [userMoodTags, setUserMoodTags] = useState<Record<string, string[]>>({});
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);

  // Search & Autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{
    queries: string[];
    dbSongs: any[];
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [searchingOnline, setSearchingOnline] = useState(false);
  const [searchedKeySong, setSearchedKeySong] = useState<Song | null>(null);

  // Lyrics Viewer Modal state
  const [viewingLyricsSong, setViewingLyricsSong] = useState<{
    title: string;
    artist: string;
    lyrics: string;
  } | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsCopied, setLyricsCopied] = useState(false);

  // Comments accordion states
  const [expandedCommentsSongId, setExpandedCommentsSongId] = useState<string | null>(null);
  const [songComments, setSongComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Load session user and local mood playlists / liked tracks
  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setCurrentUser(u);

        // Load user's mood tagged songs
        const savedMoodTags = localStorage.getItem(`gana_mood_tags_${u.username}`);
        if (savedMoodTags) {
          setUserMoodTags(JSON.parse(savedMoodTags));
        }

        // Load user's liked song IDs
        const savedLikes = localStorage.getItem(`gana_likes_${u.username}`);
        if (savedLikes) {
          setLikedSongIds(JSON.parse(savedLikes));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch songs from API (Silent background sync: Only show loading spinner on initial mount or manual filter change)
  const fetchSongs = async (isInitial = false) => {
    if (isInitial && songs.length === 0) {
      setLoading(true);
    }
    try {
      const url = new URL('/api/songs', window.location.origin);
      if (selectedLanguage && selectedLanguage !== 'All') {
        url.searchParams.set('language', selectedLanguage);
      }
      const response = await fetch(url.toString());
      if (response.ok) {
        const data = await response.json();
        setSongs(data.songs || []);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSongs(true);
    const interval = setInterval(() => {
      fetchSongs(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedLanguage, refreshKey]);

  // Debounced search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/songs/suggestions?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        console.warn('Suggestions error:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Automatically update searchedKeySong when searchQuery matches a song in library
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const match = songs.find(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.artist && s.artist.toLowerCase().includes(q)) ||
        (s.lyrics && s.lyrics.toLowerCase().includes(q))
    );
    if (match) {
      setSearchedKeySong(match);
    }
  }, [searchQuery, songs]);

  // Click outside listener to close search suggestions & popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (!(e.target as HTMLElement).closest('.mood-popover-container')) {
        setMoodPickerSongId(null);
      }
      if (!(e.target as HTMLElement).closest('.share-popover-container')) {
        setShareDropdownSongId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Like Toggle (Supports Unliking / Removing Like)
  const handleLike = async (songId: string) => {
    const isCurrentlyLiked = likedSongIds.includes(songId);
    const action = isCurrentlyLiked ? 'unlike' : 'like';

    // Optimistically update local liked list
    if (currentUser) {
      setLikedSongIds((prev) => {
        const next = isCurrentlyLiked ? prev.filter((id) => id !== songId) : [...prev, songId];
        localStorage.setItem(`gana_likes_${currentUser.username}`, JSON.stringify(next));
        return next;
      });
    }

    // Optimistically update like count on local song state
    setSongs((prev) =>
      prev.map((s) =>
        s.id === songId
          ? { ...s, likesCount: Math.max(0, s.likesCount + (isCurrentlyLiked ? -1 : 1)) }
          : s
      )
    );

    try {
      const response = await fetch(`/api/songs/${songId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, username: currentUser?.username }),
      });
      if (response.ok) {
        const data = await response.json();
        setSongs((prev) =>
          prev.map((s) => (s.id === songId ? { ...s, likesCount: data.song.likesCount } : s))
        );
      }
    } catch (error) {
      console.error('Failed to like/unlike:', error);
    }
  };

  // Add / Remove Song from User's Mood Playlist & sync song mood
  const handleToggleSongMood = async (songId: string, moodEmoji: string) => {
    if (!currentUser) return;
    const currentTags = userMoodTags[songId] || [];
    const isAdding = !currentTags.includes(moodEmoji);
    const nextTags = isAdding
      ? [...currentTags, moodEmoji]
      : currentTags.filter((m) => m !== moodEmoji);

    const nextState = {
      ...userMoodTags,
      [songId]: nextTags,
    };
    setUserMoodTags(nextState);
    localStorage.setItem(`gana_mood_tags_${currentUser.username}`, JSON.stringify(nextState));

    // Immediately update local song state so it reflects across the feed & mood filters
    setSongs((prev) =>
      prev.map((s) => (s.id === songId ? { ...s, moodEmoji } : s))
    );

    // Also update searchedKeySong if active
    setSearchedKeySong((prev) => (prev && prev.id === songId ? { ...prev, moodEmoji } : prev));

    // Persist to backend database if it's a real song ID
    if (!songId.startsWith('yt_') && !songId.startsWith('trend_')) {
      try {
        await fetch('/api/songs', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId, moodEmoji }),
        });
      } catch (err) {
        console.warn('Could not persist mood update to database:', err);
      }
    }
  };

  // Remove specific mood tag from song
  const handleRemoveSongMood = (songId: string, moodEmoji: string) => {
    if (!currentUser) return;
    const currentTags = userMoodTags[songId] || [];
    const nextTags = currentTags.filter((m) => m !== moodEmoji);
    const nextState = {
      ...userMoodTags,
      [songId]: nextTags,
    };
    setUserMoodTags(nextState);
    localStorage.setItem(`gana_mood_tags_${currentUser.username}`, JSON.stringify(nextState));
  };

  // Remove song from ALL moods
  const handleRemoveSongFromAllMoods = (songId: string) => {
    if (!currentUser) return;
    const nextState = { ...userMoodTags };
    delete nextState[songId];
    setUserMoodTags(nextState);
    localStorage.setItem(`gana_mood_tags_${currentUser.username}`, JSON.stringify(nextState));
  };

  // Copy shareable song link
  const handleCopyLink = (songId: string) => {
    const shareUrl = `${window.location.origin}/?play=${songId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedSongId(songId);
      setTimeout(() => setCopiedSongId(null), 2000);
    });
  };

  // Delete song from Gana
  const handleDeleteSong = async (songId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this track from Gana?')) return;
    try {
      if (searchedKeySong?.id === songId) {
        setSearchedKeySong(null);
      }
      setSongs((prev) => prev.filter((s) => s.id !== songId));

      // In-memory or preview stream IDs
      if (songId.startsWith('yt_') || songId.startsWith('trend_')) {
        return;
      }

      const response = await fetch(`/api/songs?id=${songId}&username=${currentUser.username}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchSongs();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to delete song');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Toggle comments accordion
  const toggleComments = async (songId: string) => {
    if (expandedCommentsSongId === songId) {
      setExpandedCommentsSongId(null);
      setSongComments([]);
      return;
    }
    setExpandedCommentsSongId(songId);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/songs/comments?songId=${songId}`);
      if (res.ok) {
        const data = await res.json();
        setSongComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Submit comment
  const handleAddComment = async (e: React.FormEvent, songId: string) => {
    e.preventDefault();
    if (!currentUser || !newCommentText.trim()) return;
    const text = newCommentText.trim();
    setNewCommentText('');
    try {
      const res = await fetch('/api/songs/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          username: currentUser.username,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSongComments((prev) => [...prev, data.comment]);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Comment error:', error);
    }
  };

  // Delete comment (Author or Admin)
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `/api/songs/comments?id=${commentId}&username=${encodeURIComponent(currentUser.username)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setSongComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Delete comment error:', error);
    }
  };

  // Open Lyrics Viewer
  const handleOpenLyrics = async (song: Song | IndustrySong) => {
    setLyricsLoading(true);
    setViewingLyricsSong({
      title: song.title,
      artist: song.artist,
      lyrics: song.lyrics || 'Loading lyrics...',
    });
    setLyricsCopied(false);

    try {
      const res = await fetch(
        `/api/songs/lyrics?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist)}`
      );
      if (res.ok) {
        const data = await res.json();
        setViewingLyricsSong({
          title: song.title,
          artist: song.artist,
          lyrics: data.lyrics || 'No lyrics available for this track yet.',
        });
      }
    } catch (e) {
      console.warn('Lyrics fetch error:', e);
    } finally {
      setLyricsLoading(false);
    }
  };

  // Handle Online Search & Play
  const handleSearchAndPlayOnline = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSearchingOnline(true);
    setShowSuggestions(false);

    try {
      const q = queryText.toLowerCase().trim();

      // 1. Check if it exists in database songs
      const existingMatch = songs.find(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q))
      );

      if (existingMatch) {
        setSearchedKeySong(existingMatch);
        onPlayTrack(existingMatch);
        setSearchingOnline(false);
        return;
      }

      // 2. Check in trending songs
      for (const ind of MUSIC_INDUSTRIES) {
        const trendMatch = ind.top5.find(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.artist.toLowerCase().includes(q)
        );
        if (trendMatch) {
          const songObj: Song = {
            id: trendMatch.id,
            title: trendMatch.title,
            artist: trendMatch.artist,
            album: trendMatch.album,
            genre: trendMatch.genre,
            moodEmoji: trendMatch.moodEmoji,
            audioUrl: trendMatch.audioUrl,
            creatorUsername: 'trending',
            likesCount: trendMatch.likesCount,
            language: trendMatch.language,
            description: trendMatch.description || '',
            lyrics: trendMatch.lyrics,
          };
          setSearchedKeySong(songObj);
          onPlayTrack(songObj);
          setSearchingOnline(false);
          return;
        }
      }

      // 3. Search metadata via iTunes + YouTube stream
      let resolvedArtist = 'Featured Artist';
      let resolvedAlbum = 'Hit Single';
      let resolvedGenre = 'Bollywood';
      let resolvedLyrics = '';

      try {
        const itunesRes = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(queryText)}&entity=song&limit=1`
        );
        if (itunesRes.ok) {
          const itunesData = await itunesRes.json();
          if (itunesData.results && itunesData.results.length > 0) {
            const firstResult = itunesData.results[0];
            resolvedArtist = firstResult.artistName || resolvedArtist;
            resolvedAlbum = firstResult.collectionName || resolvedAlbum;
            resolvedGenre = firstResult.primaryGenreName || resolvedGenre;
          }
        }
      } catch (err) {
        console.warn('iTunes metadata lookup skipped:', err);
      }

      try {
        const lyricsRes = await fetch(
          `/api/songs/lyrics?title=${encodeURIComponent(queryText)}&artist=${encodeURIComponent(resolvedArtist)}`
        );
        if (lyricsRes.ok) {
          const lyricsData = await lyricsRes.json();
          if (lyricsData.lyrics) {
            resolvedLyrics = lyricsData.lyrics;
          }
        }
      } catch (err) {
        console.warn('Lyrics lookup skipped:', err);
      }

      // Search YouTube stream
      const res = await fetch(`/api/songs/youtube-search?title=${encodeURIComponent(queryText)}&artist=${encodeURIComponent(resolvedArtist)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.videoId) {
          // Attempt to persist into database so it becomes a full, persistent key song with comments, likes, and delete options!
          try {
            const saveRes = await fetch('/api/songs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: queryText,
                artist: resolvedArtist,
                album: resolvedAlbum,
                genre: resolvedGenre,
                moodEmoji: '🔥',
                creatorUsername: currentUser?.username || 'searched',
                audioUrl: `youtube:${data.videoId}`,
                language: 'Various',
                industry: 'Bollywood',
                lyrics: resolvedLyrics,
                description: `Searched and added track: ${queryText} by ${resolvedArtist}`,
              }),
            });

            if (saveRes.ok) {
              const saveData = await saveRes.json();
              const savedSong: Song = saveData.song;
              setSongs((prev) => [savedSong, ...prev.filter((s) => s.id !== savedSong.id)]);
              setSearchedKeySong(savedSong);
              onPlayTrack(savedSong);
              setSearchingOnline(false);
              return;
            }
          } catch (saveErr) {
            console.warn('Failed to persist searched song:', saveErr);
          }

          // Fallback in-memory song object
          const newSong: Song = {
            id: `yt_${data.videoId}`,
            title: queryText,
            artist: resolvedArtist,
            album: resolvedAlbum,
            genre: resolvedGenre,
            moodEmoji: '🔥',
            audioUrl: `youtube:${data.videoId}`,
            creatorUsername: currentUser?.username || 'listener',
            likesCount: 1,
            language: 'Various',
            lyrics: resolvedLyrics,
            description: `Searched and played track: ${queryText}`,
          };
          setSearchedKeySong(newSong);
          onPlayTrack(newSong);
        }
      }
    } catch (err) {
      console.error('Search and play online error:', err);
    } finally {
      setSearchingOnline(false);
    }
  };

  const dailyChartInfo = useMemo(() => getDailyChartInfo(), []);

  // Currently selected music industry object with dynamically updated daily top 5
  const currentIndustryData = useMemo(() => {
    const rawIndustry =
      MUSIC_INDUSTRIES.find((item) => item.id === selectedIndustry) ||
      MUSIC_INDUSTRIES[0];

    return {
      ...rawIndustry,
      top5: getDailyIndustryTop5(rawIndustry),
    };
  }, [selectedIndustry]);

  // Filtered Songs according to Language, Mood, Liked, and Search query
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      // 1. Language filter
      if (selectedLanguage !== 'All' && s.language && s.language !== selectedLanguage) {
        return false;
      }

      // 2. Unified Mood Filter (matches either primary mood or user's added mood tag)
      const targetMood = selectedMood || activeMoodPlaylist;
      if (targetMood) {
        const tags = userMoodTags[s.id] || [];
        const matchesPrimary = s.moodEmoji === targetMood;
        const matchesUserTags = tags.includes(targetMood);
        if (!matchesPrimary && !matchesUserTags) {
          return false;
        }
      }

      // 4. Only liked filter
      if (onlyLiked && !likedSongIds.includes(s.id)) {
        return false;
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q)) ||
          (s.album && s.album.toLowerCase().includes(q)) ||
          (s.genre && s.genre.toLowerCase().includes(q)) ||
          (s.lyrics && s.lyrics.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [
    songs,
    selectedLanguage,
    selectedMood,
    activeMoodPlaylist,
    onlyLiked,
    likedSongIds,
    userMoodTags,
    searchQuery,
  ]);

  return (
    <div className="space-y-6">
      {/* 1. SMART SEARCH BAR (Instant Autocomplete & Play) */}
      <div className="relative" ref={searchContainerRef}>
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search any song by title, artist, or lyrics... (Press Enter to play instantly)"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSearchAndPlayOnline(searchQuery);
              }
            }}
            className="w-full pl-10 pr-24 py-3 bg-zinc-950/90 border border-zinc-800 focus:border-purple-500 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none transition font-semibold shadow-lg shadow-black/50"
          />
          <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-zinc-500 hover:text-white p-1 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearchAndPlayOnline(searchQuery)}
              disabled={searchingOnline || !searchQuery.trim()}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1"
            >
              {searchingOnline ? <Loader2 size={13} className="animate-spin" /> : <Play size={12} className="fill-black" />}
              <span>Play</span>
            </button>
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions && (suggestions.queries.length > 0 || suggestions.dbSongs.length > 0) && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-950/95 border border-purple-500/40 rounded-2xl shadow-2xl z-50 p-2.5 divide-y divide-zinc-900 animate-fade-in backdrop-blur-xl">
            {suggestions.dbSongs.length > 0 && (
              <div className="pb-2 space-y-1">
                <p className="text-[10px] font-black uppercase text-purple-400 px-2 tracking-wider">
                  In Gana Library
                </p>
                {suggestions.dbSongs.map((song: any) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      setSearchedKeySong(song);
                      onPlayTrack(song);
                      setShowSuggestions(false);
                    }}
                    className="p-2 rounded-xl hover:bg-purple-600/15 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-900 text-purple-400 group-hover:bg-purple-600 group-hover:text-black transition">
                        <Play size={12} className="fill-current" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{song.title}</p>
                        <p className="text-[11px] text-zinc-400 truncate">{song.artist}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-purple-300 font-mono">
                      {song.moodEmoji} {song.genre}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {suggestions.queries.length > 0 && (
              <div className="pt-2 space-y-0.5">
                <p className="text-[10px] font-black uppercase text-zinc-400 px-2 tracking-wider flex items-center gap-1">
                  <TrendingUp size={11} className="text-purple-400" />
                  <span>Trending Song Keywords</span>
                </p>
                {suggestions.queries.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSearchQuery(q);
                      handleSearchAndPlayOnline(q);
                    }}
                    className="p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-purple-600/15 flex items-center justify-between cursor-pointer transition"
                  >
                    <span className="flex items-center gap-2">
                      <Search size={13} className="text-zinc-500" />
                      <span className="font-semibold">{q}</span>
                    </span>
                    <Play size={12} className="text-purple-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🎯 SEARCHED SONG KEY CARD */}
      {searchedKeySong && (
        <div className="p-5 rounded-3xl glass-panel border-2 border-purple-500/70 shadow-2xl shadow-purple-600/25 bg-gradient-to-r from-purple-950/70 via-zinc-950/95 to-cyan-950/40 space-y-4 animate-fade-in relative overflow-hidden">
          {/* Glowing decorative backdrop */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Key Card Header Badge */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-black text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-purple-600/30">
                <Sparkles size={13} className="fill-black" />
                Searched Song Key Card
              </span>
              <span className="text-xs text-zinc-400 font-bold hidden sm:inline">
                Full interactive track controls
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchedKeySong(null)}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              title="Dismiss Key Card"
            >
              <X size={16} />
            </button>
          </div>

          {/* Song Info & Main Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Large Play/Pause Button */}
              <button
                type="button"
                onClick={() => onPlayTrack(searchedKeySong)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition cursor-pointer shrink-0 shadow-xl active:scale-95 ${
                  currentTrack?.id === searchedKeySong.id && isPlaying
                    ? 'bg-gradient-to-tr from-purple-500 to-cyan-400 text-black animate-pulse shadow-purple-500/40'
                    : 'bg-purple-600 hover:bg-purple-500 text-black shadow-purple-600/30'
                }`}
                title={currentTrack?.id === searchedKeySong.id && isPlaying ? 'Pause' : 'Play this searched song'}
              >
                {currentTrack?.id === searchedKeySong.id && isPlaying ? (
                  <Pause size={24} className="fill-current" />
                ) : (
                  <Play size={24} className="fill-current ml-1" />
                )}
              </button>

              {/* Title, Artist, and Badges */}
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white truncate" title={searchedKeySong.title}>
                  {searchedKeySong.title}
                </h3>
                <p className="text-sm font-bold text-purple-300 truncate mt-0.5 flex items-center gap-2">
                  <span>🎤 {searchedKeySong.artist}</span>
                  {searchedKeySong.album && (
                    <span className="text-zinc-400 font-normal truncate">• 💿 {searchedKeySong.album}</span>
                  )}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-extrabold uppercase tracking-wider">
                    {searchedKeySong.industry || 'Bollywood'}
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold">
                    {searchedKeySong.moodEmoji} {searchedKeySong.genre}
                  </span>

                  {/* Active Mood Tags with Delete Option (✕) */}
                  {(userMoodTags[searchedKeySong.id] || []).map((mEmoji) => (
                    <span
                      key={mEmoji}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{mEmoji}</span>
                      <span>{getMoodName(mEmoji, t)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSongMood(searchedKeySong.id, mEmoji)}
                        className="text-amber-400 hover:text-red-400 cursor-pointer ml-1"
                        title="Delete this mood from song"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Like Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleLike(searchedKeySong.id)}
                className={`px-4 py-2 rounded-xl border transition cursor-pointer flex items-center gap-2 active:scale-90 font-bold ${
                  likedSongIds.includes(searchedKeySong.id)
                    ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-md shadow-red-500/20'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:text-red-400'
                }`}
                title={likedSongIds.includes(searchedKeySong.id) ? 'Unlike this song' : 'Like this song'}
              >
                <Heart
                  size={16}
                  className={likedSongIds.includes(searchedKeySong.id) ? 'fill-red-400 text-red-400' : ''}
                />
                <span className="text-xs">{searchedKeySong.likesCount} Likes</span>
              </button>
            </div>
          </div>

          {/* Key Card Toolbar (Add Mode/Mood, Lyrics, Comment, Share, Delete) */}
          <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Lyrics & Option of Adding Mode/Mood */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Lyrics Button */}
              <button
                type="button"
                onClick={() => handleOpenLyrics(searchedKeySong)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <BookOpen size={13} className="text-purple-400" />
                <span>Lyrics</span>
              </button>

              {/* 🎭 Option of Adding Mode / Mood */}
              <div className="relative mood-popover-container">
                <button
                  type="button"
                  onClick={() => setMoodPickerSongId(moodPickerSongId === searchedKeySong.id ? null : searchedKeySong.id)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Add mode / mood to this song"
                >
                  <Smile size={13} className="text-amber-400" />
                  <span>+ Add Mode (Mood)</span>
                </button>

                {/* Mood Popover */}
                {moodPickerSongId === searchedKeySong.id && (
                  <div className="absolute left-0 bottom-full mb-2 bg-zinc-950/98 border border-amber-500/40 p-3 rounded-2xl shadow-2xl z-50 w-72 space-y-2 animate-fade-in backdrop-blur-xl">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-black text-amber-400">
                      <span>Select Mood / Mode</span>
                      {(userMoodTags[searchedKeySong.id] || []).length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSongFromAllMoods(searchedKeySong.id)}
                          className="text-red-400 hover:underline cursor-pointer lowercase"
                        >
                          clear all
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {moods.map((m) => {
                        const isTagged = (userMoodTags[searchedKeySong.id] || []).includes(m.emoji);
                        return (
                          <button
                            key={m.emoji}
                            type="button"
                            onClick={() => handleToggleSongMood(searchedKeySong.id, m.emoji)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                              isTagged
                                ? 'bg-amber-500 text-black border-amber-400'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-850'
                            }`}
                          >
                            <span>{m.emoji}</span>
                            <span className="truncate">{getMoodName(m.emoji, t)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Comment, Share & Option of Deleting */}
            <div className="flex items-center gap-2">
              {/* Comment Option */}
              <button
                type="button"
                onClick={() => toggleComments(searchedKeySong.id)}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 font-bold ${
                  expandedCommentsSongId === searchedKeySong.id
                    ? 'bg-purple-600 text-black border-purple-500'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
                title="Comments on this song"
              >
                <MessageSquare size={13} />
                <span>Comments ({searchedKeySong.comments?.length || (expandedCommentsSongId === searchedKeySong.id ? songComments.length : 0)})</span>
              </button>

              {/* Share Option */}
              <div className="relative share-popover-container">
                <button
                  type="button"
                  onClick={() => setShareDropdownSongId(shareDropdownSongId === searchedKeySong.id ? null : searchedKeySong.id)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 text-zinc-300 hover:text-purple-300 transition cursor-pointer flex items-center gap-1.5 font-bold"
                  title="Share track"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>

                {shareDropdownSongId === searchedKeySong.id && (
                  <div className="absolute right-0 bottom-full mb-2 bg-zinc-950/98 border border-purple-500/40 p-3 rounded-2xl shadow-2xl z-50 w-56 space-y-2 animate-fade-in backdrop-blur-xl">
                    <p className="text-[10px] uppercase tracking-wider font-black text-purple-400">
                      Share Song
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyLink(searchedKeySong.id);
                        setShareDropdownSongId(null);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-purple-500/20 font-bold flex items-center justify-between transition cursor-pointer"
                    >
                      <span>Copy Share Link</span>
                      {copiedSongId === searchedKeySong.id && <span className="text-[9px] text-emerald-400">Copied!</span>}
                    </button>

                    {friends.length > 0 && (
                      <div className="pt-1.5 border-t border-zinc-900 space-y-1">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">Send to Friend in Chat:</p>
                        {friends.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              onShareSong(searchedKeySong.id, f.username);
                              setShareDropdownSongId(null);
                            }}
                            className="w-full text-left px-2 py-1 rounded-md text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-900 transition flex items-center gap-1.5"
                          >
                            <span>👤</span>
                            <span>@{f.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🗑️ Option of Deleting */}
              <button
                type="button"
                onClick={() => handleDeleteSong(searchedKeySong.id)}
                className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-600 border border-red-800/50 hover:border-red-500 text-red-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 font-bold shadow-sm"
                title="Delete this song from Gana"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Comments Accordion for Searched Key Card */}
          {expandedCommentsSongId === searchedKeySong.id && (
            <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-fade-in">
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
                {commentsLoading ? (
                  <div className="text-center py-3 text-zinc-500 text-xs">Loading comments...</div>
                ) : songComments.length === 0 ? (
                  <div className="text-center py-3 text-zinc-500 text-xs font-semibold">
                    No comments yet on this track. Be the first to share your thoughts!
                  </div>
                ) : (
                  songComments.map((c) => (
                    <div key={c.id} className="p-2.5 bg-zinc-900/80 border border-zinc-800/60 rounded-xl flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-purple-300 text-xs">@{c.username}: </span>
                        <span className="text-zinc-200">{c.text}</span>
                      </div>
                      {(currentUser?.username === c.username || currentUser?.username === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition shrink-0"
                          title="Delete your comment"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={(e) => handleAddComment(e, searchedKeySong.id)} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Write a comment on this song..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-semibold"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl transition cursor-pointer shadow"
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. DAILY TRENDING 5 SONGS ACCORDING TO MUSIC INDUSTRY */}
      <div className="p-5 rounded-2xl glass-panel border border-purple-500/30 glow-purple bg-gradient-to-r from-purple-950/40 via-zinc-950 to-cyan-950/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 text-black shadow-lg shadow-purple-600/25 flex items-center justify-center">
              <Flame size={20} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>Daily Trending Top 5 Songs</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live daily updates active" />
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  {currentIndustryData.badge}
                </span>
              </div>
                <p className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                  <span>{currentIndustryData.description}</span>
                  <span className="text-[10px] text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                    📅 {dailyChartInfo.formattedDate} • Updated Daily
                  </span>
                </p>
            </div>
          </div>
        </div>

        {/* Industry Selector Tabs (Bollywood, Tollywood, Hollywood, etc.) */}
        <div className="flex flex-wrap gap-2 select-none">
          {MUSIC_INDUSTRIES.map((ind) => {
            const isSelected = selectedIndustry === ind.id;
            return (
              <button
                key={ind.id}
                type="button"
                onClick={() => setSelectedIndustry(ind.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-95 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-black border-purple-400 shadow-lg shadow-purple-600/30 font-black'
                    : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-purple-500/50 hover:text-white'
                }`}
              >
                <span>{ind.icon}</span>
                <span>{ind.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Top 5 Trending Cards List */}
        <div className="space-y-2.5 pt-1">
          {currentIndustryData.top5.map((track, idx) => {
            const rank = idx + 1;
            const rankBadges = ['🥇 #1', '🥈 #2', '🥉 #3', '#4', '#5'];
            const rankColors = [
              'text-yellow-400 border-yellow-500/40 bg-yellow-500/10',
              'text-zinc-300 border-zinc-400/40 bg-zinc-400/10',
              'text-amber-500 border-amber-600/40 bg-amber-600/10',
              'text-purple-400 border-purple-500/30 bg-purple-500/10',
              'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
            ];

            const songObj: Song = {
              id: track.id,
              title: track.title,
              artist: track.artist,
              album: track.album,
              genre: track.genre,
              moodEmoji: track.moodEmoji,
              audioUrl: track.audioUrl,
              creatorUsername: 'trending',
              likesCount: track.likesCount,
              language: track.language,
              description: track.description || '',
              lyrics: track.lyrics,
            };

            const isCurrentPlaying = currentTrack?.id === track.id && isPlaying;
            const isLiked = likedSongIds.includes(track.id);

            return (
              <div
                key={track.id}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCurrentPlaying
                    ? 'bg-purple-950/50 border-purple-500/60 shadow-lg shadow-purple-600/20'
                    : 'bg-zinc-950/80 border-zinc-850 hover:border-purple-500/40'
                }`}
              >
                {/* Left: Rank, Play Button, Track Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-xs font-black font-mono px-2 py-1 rounded-lg border shrink-0 ${
                      rankColors[idx]
                    }`}
                  >
                    {rankBadges[idx]}
                  </span>

                  <button
                    type="button"
                    onClick={() => onPlayTrack(songObj)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 shadow active:scale-95 ${
                      isCurrentPlaying
                        ? 'bg-purple-500 text-black animate-pulse'
                        : 'bg-zinc-900 hover:bg-purple-600 text-zinc-200 hover:text-black border border-zinc-800'
                    }`}
                    title={isCurrentPlaying ? 'Pause' : 'Play song'}
                  >
                    {isCurrentPlaying ? <Pause size={16} /> : <Play size={16} className="fill-current ml-0.5" />}
                  </button>

                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-white truncate" title={track.title}>
                      {track.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-purple-300 font-semibold truncate">
                        {track.artist} • <span className="text-zinc-400">{track.album}</span>
                      </p>
                      <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                        • 🎧 {(track.todayPlays || 94500).toLocaleString()} plays today
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions (Like / Unlike, Lyrics, Mood, Share) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono hidden md:inline-block">
                    {track.genre}
                  </span>

                  {/* Lyrics Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenLyrics(songObj)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-950/60 border border-zinc-800 hover:border-purple-500/40 text-xs font-bold text-zinc-300 hover:text-white transition flex items-center gap-1 cursor-pointer"
                    title="View song lyrics"
                  >
                    <BookOpen size={13} className="text-purple-400" />
                    <span>Lyrics</span>
                  </button>

                  {/* Like / Unlike Toggle */}
                  <button
                    type="button"
                    onClick={() => handleLike(track.id)}
                    className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                      isLiked
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400'
                    }`}
                    title={isLiked ? 'Unlike song' : 'Like song'}
                  >
                    <Heart size={13} className={isLiked ? 'fill-red-400 text-red-400' : ''} />
                    <span className="text-[11px] font-bold">
                      {track.likesCount + (isLiked ? 1 : 0)}
                    </span>
                  </button>

                  {/* Add to Mood Button */}
                  <div className="relative mood-popover-container">
                    <button
                      type="button"
                      onClick={() => setMoodPickerSongId(moodPickerSongId === track.id ? null : track.id)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 transition cursor-pointer"
                      title="Add to mood playlist"
                    >
                      <Smile size={14} />
                    </button>

                    {moodPickerSongId === track.id && (
                      <div className="absolute right-0 bottom-full mb-2 bg-zinc-950/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl z-40 w-64 space-y-2 animate-fade-in backdrop-blur-md">
                        <p className="text-[10px] uppercase tracking-wider font-black text-amber-400 flex items-center gap-1">
                          <span>✨</span> Save to Mood Playlist:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {moods.slice(0, 8).map((m) => {
                            const isTagged = (userMoodTags[track.id] || []).includes(m.emoji);
                            return (
                              <button
                                key={m.emoji}
                                type="button"
                                onClick={() => handleToggleSongMood(track.id, m.emoji)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                                  isTagged
                                    ? 'bg-amber-500 text-black border-amber-400'
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-850'
                                }`}
                              >
                                <span>{m.emoji}</span>
                                <span className="truncate">{getMoodName(m.emoji, t)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. VIBE & USER MOOD PLAYLIST FILTERS */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-850 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span>🎧</span>
              <span>Filter Library by Mood & Playlists</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Filter: My Liked Songs */}
            <button
              type="button"
              onClick={() => setOnlyLiked(!onlyLiked)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer select-none active:scale-95 border flex items-center gap-1.5 ${
                onlyLiked
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-500/30'
                  : 'bg-zinc-900 text-red-400 border-zinc-800 hover:border-red-500/40'
              }`}
            >
              <Heart size={12} className={onlyLiked ? 'fill-white' : 'fill-red-400'} />
              <span>Liked Songs ({likedSongIds.length})</span>
            </button>
          </div>
        </div>

        {/* Mood Pill Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedMood(null);
              setActiveMoodPlaylist(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer select-none active:scale-95 border ${
              selectedMood === null && activeMoodPlaylist === null
                ? 'bg-purple-600 text-black border-purple-500'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            All Moods
          </button>

          {moods.map((m) => {
            const moodText = getMoodName(m.emoji, t);
            const isMoodSelected = selectedMood === m.emoji || activeMoodPlaylist === m.emoji;
            return (
              <button
                key={m.emoji}
                type="button"
                onClick={() => {
                  const next = selectedMood === m.emoji ? null : m.emoji;
                  setSelectedMood(next);
                  setActiveMoodPlaylist(next);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition cursor-pointer select-none active:scale-95 border flex items-center gap-1.5 ${
                  isMoodSelected
                    ? 'bg-purple-600 text-black border-purple-500 shadow shadow-purple-600/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
                title={`${m.emoji} ${moodText}`}
              >
                <span>{m.emoji}</span>
                <span>{moodText}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. MAIN COMMUNITY SONG CARDS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
          <span>Showing {filteredSongs.length} Tracks in Library</span>
          {(selectedLanguage !== 'All' || selectedMood || onlyLiked || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedLanguage('All');
                setSelectedMood(null);
                setOnlyLiked(false);
                setSearchQuery('');
              }}
              className="text-purple-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center flex items-center justify-center gap-2 text-zinc-400 text-xs font-bold">
            <Loader2 size={16} className="animate-spin text-purple-400" />
            <span>Loading tracks from library...</span>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel border border-zinc-850 space-y-2">
            <p className="text-zinc-400 text-xs font-bold">No songs found matching current filters.</p>
            <p className="text-zinc-500 text-[11px]">
              Try searching a song name above or click on one of the Daily Trending songs!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSongs.map((song) => {
              const isCurrent = currentTrack?.id === song.id;
              const isLiked = likedSongIds.includes(song.id);
              const songMoods = userMoodTags[song.id] || [];

              return (
                <div
                  key={song.id}
                  className={`p-4 rounded-2xl transition border space-y-3 ${
                    isCurrent
                      ? 'border-purple-500/60 bg-gradient-to-r from-purple-950/40 via-zinc-900/90 to-purple-950/20 shadow-lg shadow-purple-600/20'
                      : 'border-zinc-850 bg-zinc-950/60 hover:border-zinc-700'
                  }`}
                >
                  {/* Top Track Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Play Button */}
                      <button
                        type="button"
                        onClick={() => onPlayTrack(song)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 shadow active:scale-95 ${
                          isCurrent && isPlaying
                            ? 'bg-purple-500 text-black animate-pulse'
                            : 'bg-zinc-900 hover:bg-purple-600 text-zinc-200 hover:text-black border border-zinc-800'
                        }`}
                        title={isCurrent && isPlaying ? 'Pause' : 'Play song'}
                      >
                        {isCurrent && isPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current ml-0.5" />}
                      </button>

                      {/* Title & Artist */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-black text-white truncate" title={song.title}>
                            {song.title}
                          </h4>
                        </div>

                        <p className="text-xs text-purple-300 font-bold truncate mt-0.5 flex items-center gap-1.5">
                          <span>🎤 {song.artist}</span>
                          {song.album && song.album !== 'Single' && (
                            <span className="text-zinc-400 font-normal truncate">• 💿 {song.album}</span>
                          )}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
                            {song.industry || song.language || 'Bollywood'}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-semibold border border-zinc-800">
                            {song.moodEmoji} {song.genre}
                          </span>

                          {/* Mood Tags with Remove Option */}
                          {songMoods.map((mEmoji) => (
                            <span
                              key={mEmoji}
                              className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1"
                            >
                              <span>{mEmoji}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSongMood(song.id, mEmoji)}
                                className="text-amber-400 hover:text-red-400 cursor-pointer ml-0.5"
                                title="Remove from this mood playlist"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Like & Options */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleLike(song.id)}
                        className={`p-2 rounded-xl border transition cursor-pointer flex items-center gap-1 active:scale-90 ${
                          isLiked
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-red-400'
                        }`}
                        title={isLiked ? 'Unlike this song' : 'Like this song'}
                      >
                        <Heart size={14} className={isLiked ? 'fill-red-400' : ''} />
                        <span className="text-[11px] font-bold">{song.likesCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between text-xs">
                    {/* Left: Lyrics & Add to Mood Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenLyrics(song)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 text-purple-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="View Lyrics"
                      >
                        <BookOpen size={12} className="text-purple-400" />
                        <span>Lyrics</span>
                      </button>

                      <div className="relative mood-popover-container">
                        <button
                          type="button"
                          onClick={() => setMoodPickerSongId(moodPickerSongId === song.id ? null : song.id)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-amber-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                          title="Add this song according to your mood"
                        >
                          <Smile size={12} className="text-amber-400" />
                          <span>Mood</span>
                        </button>

                        {moodPickerSongId === song.id && (
                          <div className="absolute left-0 bottom-full mb-2 bg-zinc-950/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl z-40 w-64 space-y-2 animate-fade-in backdrop-blur-md">
                            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-black text-amber-400">
                              <span>Save to Mood Playlist</span>
                              {songMoods.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSongFromAllMoods(song.id)}
                                  className="text-red-400 hover:underline cursor-pointer lowercase"
                                >
                                  clear all
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {moods.slice(0, 8).map((m) => {
                                const isTagged = songMoods.includes(m.emoji);
                                return (
                                  <button
                                    key={m.emoji}
                                    type="button"
                                    onClick={() => handleToggleSongMood(song.id, m.emoji)}
                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                                      isTagged
                                        ? 'bg-amber-500 text-black border-amber-400'
                                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-850'
                                    }`}
                                  >
                                    <span>{m.emoji}</span>
                                    <span className="truncate">{getMoodName(m.emoji, t)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Comments, Social Share & Delete */}
                    <div className="flex items-center gap-1.5">
                      {/* Comments toggle */}
                      <button
                        type="button"
                        onClick={() => toggleComments(song.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="View comments"
                      >
                        <MessageSquare size={13} />
                        <span className="text-[11px] font-bold">{song.comments?.length || 0}</span>
                      </button>

                      {/* Share Popover */}
                      <div className="relative share-popover-container">
                        <button
                          type="button"
                          onClick={() => setShareDropdownSongId(shareDropdownSongId === song.id ? null : song.id)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-purple-950/60 text-zinc-400 hover:text-purple-300 transition cursor-pointer"
                          title="Share with friends"
                        >
                          <Share2 size={13} />
                        </button>

                        {shareDropdownSongId === song.id && (
                          <div className="absolute right-0 bottom-full mb-2 bg-zinc-950/95 border border-purple-500/40 p-2.5 rounded-xl shadow-2xl z-40 w-52 space-y-2 animate-fade-in backdrop-blur-md">
                            <p className="text-[10px] uppercase tracking-wider font-black text-purple-400">
                              Share Track
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                handleCopyLink(song.id);
                                setShareDropdownSongId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-zinc-200 hover:bg-purple-500/20 font-bold flex items-center justify-between transition cursor-pointer"
                            >
                              <span>Copy Share Link</span>
                              {copiedSongId === song.id && <span className="text-[9px] text-emerald-400">Copied!</span>}
                            </button>

                            {friends.length > 0 && (
                              <div className="pt-1 border-t border-zinc-900 space-y-1">
                                <p className="text-[9px] text-zinc-500 font-bold uppercase">Send to Friend:</p>
                                {friends.map((f) => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                      onShareSong(song.id, f.username);
                                      setShareDropdownSongId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 rounded-md text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-900 transition flex items-center gap-1.5"
                                  >
                                    <span>👤</span>
                                    <span>@{f.username}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete Track */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSong(song.id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/60 text-zinc-500 hover:text-red-400 transition cursor-pointer"
                        title="Delete song from Gana"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Comments Accordion with Delete Option */}
                  {expandedCommentsSongId === song.id && (
                    <div className="pt-2 border-t border-zinc-900 space-y-2 animate-fade-in">
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {commentsLoading ? (
                          <div className="text-center py-2 text-zinc-500 text-[11px]">Loading comments...</div>
                        ) : songComments.length === 0 ? (
                          <div className="text-center py-2 text-zinc-500 text-[11px]">No comments yet. Be first!</div>
                        ) : (
                          songComments.map((c) => (
                            <div key={c.id} className="p-2 bg-zinc-900/60 rounded-lg flex items-start justify-between gap-2">
                              <div className="min-w-0 flex items-start gap-1.5">
                                <span className="font-bold text-purple-400 text-[10px] shrink-0">@{c.username}:</span>
                                <span className="text-zinc-300 text-[11px] break-words">{c.text}</span>
                              </div>

                              {/* Delete Comment Option (Author or Admin) */}
                              {(currentUser?.username === c.username || currentUser?.username === 'admin') && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-zinc-500 hover:text-red-400 p-0.5 transition cursor-pointer shrink-0"
                                  title="Delete your comment"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment input */}
                      <form onSubmit={(e) => handleAddComment(e, song.id)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={currentUser ? 'Write a comment...' : 'Sign in to comment'}
                          disabled={!currentUser}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                        />
                        <button
                          type="submit"
                          disabled={!currentUser || !newCommentText.trim()}
                          className="px-3 py-1.5 bg-purple-600 text-black font-bold text-xs rounded-lg hover:bg-purple-500 transition cursor-pointer"
                        >
                          <Send size={12} />
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. LYRICS VIEWER MODAL */}
      {viewingLyricsSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-950 border border-purple-500/40 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-purple-400" />
                  <span>{viewingLyricsSong.title}</span>
                </h3>
                <p className="text-xs text-purple-300 font-semibold">{viewingLyricsSong.artist}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingLyricsSong.lyrics);
                    setLyricsCopied(true);
                    setTimeout(() => setLyricsCopied(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-700 text-xs font-bold text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                >
                  {lyricsCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{lyricsCopied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingLyricsSong(null)}
                  className="text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 max-h-96 overflow-y-auto">
              {lyricsLoading ? (
                <div className="text-center py-8 text-zinc-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 size={16} className="animate-spin text-purple-400" />
                  <span>Searching verified lyrics...</span>
                </div>
              ) : (
                <pre className="text-xs text-zinc-200 font-mono whitespace-pre-wrap leading-relaxed text-center">
                  {viewingLyricsSong.lyrics}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
