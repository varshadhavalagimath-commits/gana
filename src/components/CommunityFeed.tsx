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
  Disc,
  Globe,
  Loader2,
  CheckCircle2,
  Zap,
  Crown,
  Smile,
  ListMusic,
} from 'lucide-react';
import { Song, Friend, User as UserType, Comment } from '@/types';
import Avatar from './Avatar';
import { MOODS, getMoodName } from '@/lib/moods';
import { FEATURED_ARTISTS, WORLD_LANGUAGES, ArtistItem } from '@/lib/artists';

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

  // Filter States
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);
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

  // Search & Google-like Autocomplete states (strictly keyword & database songs, NO similar mood representator)
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{
    queries: string[];
    dbSongs: any[];
    matchedArtists?: { artist: string; albums: string[]; count: number }[];
    matchedAlbums?: { album: string; artist: string; count: number }[];
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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

        // Load user liked songs list
        const savedLikes = localStorage.getItem(`gana_likes_${u.username}`);
        if (savedLikes) {
          setLikedSongIds(JSON.parse(savedLikes));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch songs from API with language and mood support
  const fetchSongs = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/songs', window.location.origin);
      if (selectedMood) url.searchParams.set('moodEmoji', selectedMood);
      if (selectedLanguage && selectedLanguage !== 'All') {
        url.searchParams.set('language', selectedLanguage);
      }
      const response = await fetch(url.toString());
      const data = await response.json();
      if (response.ok) {
        setSongs(data.songs || []);
      }
    } catch (error) {
      console.error('Failed to fetch songs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, [selectedMood, selectedLanguage, refreshKey]);

  // Debounced search suggestions (queries and DB songs only)
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
        console.error('Failed to load suggestions:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener to close search suggestions
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

  // Handle Like Toggle
  const handleLike = async (songId: string) => {
    try {
      const response = await fetch(`/api/songs/${songId}/like`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setSongs((prev) =>
          prev.map((s) => (s.id === songId ? { ...s, likesCount: data.song.likesCount } : s))
        );

        if (currentUser) {
          setLikedSongIds((prev) => {
            const next = prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId];
            localStorage.setItem(`gana_likes_${currentUser.username}`, JSON.stringify(next));
            return next;
          });
        }
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  // Add / Tag Song to User's Mood Playlist
  const handleToggleSongMood = (songId: string, moodEmoji: string) => {
    if (!currentUser) return;
    const currentTags = userMoodTags[songId] || [];
    const nextTags = currentTags.includes(moodEmoji)
      ? currentTags.filter((m) => m !== moodEmoji)
      : [...currentTags, moodEmoji];

    const nextState = {
      ...userMoodTags,
      [songId]: nextTags,
    };
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

  // Delete song
  const handleDeleteSong = async (songId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this track from Gana?')) return;
    try {
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

  // Comments toggle
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
      const data = await res.json();
      if (res.ok) {
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
    const text = newCommentText;
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
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Top Singers filtered by selected Language
  const topSingers = useMemo(() => {
    if (selectedLanguage === 'All') {
      return FEATURED_ARTISTS;
    }
    return FEATURED_ARTISTS.filter(
      (a) => a.language.toLowerCase() === selectedLanguage.toLowerCase()
    );
  }, [selectedLanguage]);

  // Top Albums in the selected language
  const topAlbums = useMemo(() => {
    const albumMap = new Map<string, { album: string; artist: string; count: number; language: string }>();

    // From FEATURED_ARTISTS
    const relevantArtists = selectedLanguage === 'All'
      ? FEATURED_ARTISTS
      : FEATURED_ARTISTS.filter((a) => a.language.toLowerCase() === selectedLanguage.toLowerCase());

    relevantArtists.forEach((a) => {
      a.albums.forEach((alb) => {
        if (!albumMap.has(alb.toLowerCase())) {
          albumMap.set(alb.toLowerCase(), {
            album: alb,
            artist: a.name,
            count: 3,
            language: a.language,
          });
        }
      });
    });

    // Also include albums from database songs
    songs.forEach((s) => {
      if (!s.album || s.album === 'Single') return;
      if (selectedLanguage !== 'All' && s.language && s.language !== selectedLanguage) return;
      const key = s.album.toLowerCase();
      if (albumMap.has(key)) {
        albumMap.get(key)!.count += 1;
      } else {
        albumMap.set(key, {
          album: s.album,
          artist: s.artist,
          count: 1,
          language: s.language || 'English',
        });
      }
    });

    return Array.from(albumMap.values()).slice(0, 10);
  }, [selectedLanguage, songs]);

  // Active artist details
  const activeArtistData = useMemo(() => {
    if (!selectedArtist) return null;
    return (
      FEATURED_ARTISTS.find(
        (a) =>
          a.name.toLowerCase() === selectedArtist.toLowerCase() ||
          selectedArtist.toLowerCase().includes(a.name.toLowerCase())
      ) || null
    );
  }, [selectedArtist]);

  // Filtered Songs according to Language, Artist, Album, Mood, and User Mood Playlists
  const filteredSongs = useMemo(() => {
    return songs.filter((s) => {
      // 1. Language filter
      if (selectedLanguage !== 'All' && s.language && s.language !== selectedLanguage) {
        return false;
      }

      // 2. Only liked filter
      if (onlyLiked && !likedSongIds.includes(s.id)) {
        return false;
      }

      // 3. User mood playlist filter
      if (activeMoodPlaylist) {
        const taggedMoods = userMoodTags[s.id] || [];
        const isSongInMood = taggedMoods.includes(activeMoodPlaylist) || s.moodEmoji === activeMoodPlaylist;
        if (!isSongInMood) return false;
      }

      // 4. Mood filter
      if (selectedMood && s.moodEmoji !== selectedMood) {
        return false;
      }

      // 5. Artist filter
      if (selectedArtist) {
        const matchArtist = s.artist && s.artist.toLowerCase().includes(selectedArtist.toLowerCase());
        if (!matchArtist) return false;
      }

      // 6. Album filter
      if (selectedAlbum) {
        const matchAlbum = s.album && s.album.toLowerCase().includes(selectedAlbum.toLowerCase());
        if (!matchAlbum) return false;
      }

      // 7. Genre filter (e.g. Rap)
      if (selectedGenreFilter === 'rap') {
        const g = (s.genre || '').toLowerCase();
        const t = (s.title || '').toLowerCase();
        const a = (s.artist || '').toLowerCase();
        const isRap =
          g.includes('rap') ||
          g.includes('hip-hop') ||
          g.includes('hip hop') ||
          g.includes('trap') ||
          g.includes('drill') ||
          a.includes('eminem') ||
          a.includes('kendrick') ||
          a.includes('drake') ||
          a.includes('sidhu') ||
          a.includes('karan aujla');
        if (!isRap) return false;
      }

      // 8. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q)) ||
          (s.album && s.album.toLowerCase().includes(q)) ||
          (s.language && s.language.toLowerCase().includes(q)) ||
          (s.genre && s.genre.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [
    songs,
    selectedLanguage,
    onlyLiked,
    likedSongIds,
    activeMoodPlaylist,
    userMoodTags,
    selectedMood,
    selectedArtist,
    selectedAlbum,
    selectedGenreFilter,
    searchQuery,
  ]);

  return (
    <div className="space-y-6">
      {/* 1. LANGUAGE SELECTOR BAR */}
      <div className="p-4 rounded-2xl glass-panel border border-cyan-500/20 glow-cyan space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Select Music Language</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                  {selectedLanguage === 'All' ? 'Worldwide All' : selectedLanguage}
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Choose a language to showcase top singers, hit albums, and songs from that region.
              </p>
            </div>
          </div>

          {(selectedLanguage !== 'All' || selectedArtist || selectedAlbum || selectedMood || activeMoodPlaylist || onlyLiked) && (
            <button
              type="button"
              onClick={() => {
                setSelectedLanguage('All');
                setSelectedArtist(null);
                setSelectedAlbum(null);
                setSelectedMood(null);
                setActiveMoodPlaylist(null);
                setOnlyLiked(false);
                setSelectedGenreFilter(null);
              }}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-500/30"
            >
              <X size={12} /> Reset All Filters
            </button>
          )}
        </div>

        {/* Language Selection Pills */}
        <div className="flex flex-wrap gap-2 pt-1 select-none">
          {WORLD_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang;
            const flagMap: Record<string, string> = {
              All: '🌍',
              English: '🇺🇸',
              Hindi: '🇮🇳',
              Punjabi: '🪕',
              Spanish: '🇪🇸',
              Korean: '🇰🇷',
              Tamil: '🌴',
              Telugu: '🪘',
              French: '🇫🇷',
              Japanese: '🇯🇵',
            };

            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang);
                  setSelectedArtist(null);
                  setSelectedAlbum(null);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer select-none active:scale-95 border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/30'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-cyan-500/40 hover:text-white'
                }`}
              >
                <span>{flagMap[lang] || '🎵'}</span>
                <span>{lang === 'All' ? 'All Languages' : lang}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REAL-TIME SEARCH (Google Queries + DB Songs, without similar mood representator) */}
      <div ref={searchContainerRef} className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by song name, singer, album, or vibe... (e.g. The Weeknd, Arijit Singh, Kesariya, Blinding Lights)"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition font-semibold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown (Search queries and Library songs only) */}
        {showSuggestions && suggestions && (suggestions.queries.length > 0 || suggestions.dbSongs.length > 0) && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 animate-fade-in max-h-80 overflow-y-auto">
            {suggestions.queries.length > 0 && (
              <div className="p-2">
                <p className="text-[9px] uppercase tracking-wider font-black text-zinc-500 px-2 py-1 flex items-center gap-1">
                  <TrendingUp size={11} className="text-purple-400" />
                  Related Search Words
                </p>
                <div className="space-y-0.5">
                  {suggestions.queries.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSearchQuery(q);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-purple-500/10 flex items-center justify-between transition cursor-pointer font-medium group"
                    >
                      <span className="flex items-center gap-2">
                        <Search size={12} className="text-zinc-500 group-hover:text-purple-400" />
                        <span>{q}</span>
                      </span>
                      <ArrowRight size={11} className="text-zinc-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestions.dbSongs.length > 0 && (
              <div className="p-2 bg-purple-950/15">
                <p className="text-[9px] uppercase tracking-wider font-black text-purple-400 px-2 py-1 flex items-center gap-1">
                  <Music size={11} />
                  Matching Songs in Library
                </p>
                <div className="space-y-0.5">
                  {suggestions.dbSongs.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onPlayTrack(s);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-purple-500/20 flex items-center justify-between transition cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>{s.moodEmoji}</span>
                        <span className="font-bold text-white truncate">{s.title}</span>
                        <span className="text-zinc-400 text-[11px] truncate">• {s.artist}</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-400 font-mono shrink-0">
                        {s.language || s.genre}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. TOP SINGERS FROM ALL OVER THE WORLD */}
      <div className="p-5 rounded-2xl glass-panel border border-purple-500/20 glow-purple space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>🎤</span>
              <span>Top Singers from All Over the World</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                {topSingers.length} Artists
              </span>
            </h3>
          </div>

          {selectedArtist && (
            <button
              type="button"
              onClick={() => {
                setSelectedArtist(null);
                setSelectedAlbum(null);
              }}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <X size={12} /> Show All Singers
            </button>
          )}
        </div>

        {/* Singer Pills Grid */}
        <div className="flex flex-wrap gap-2.5 select-none">
          {topSingers.map((singer) => {
            const isSelected = selectedArtist?.toLowerCase() === singer.name.toLowerCase();
            return (
              <button
                key={singer.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedArtist(null);
                    setSelectedAlbum(null);
                  } else {
                    setSelectedArtist(singer.name);
                    setSelectedAlbum(null);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-95 border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-purple-600 text-black border-purple-400 shadow-lg shadow-purple-600/30 font-black'
                    : 'bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:border-purple-500/50 hover:text-white'
                }`}
                title={`${singer.name} (${singer.country}) - ${singer.genre}`}
              >
                <span className="text-sm">{singer.avatarEmoji}</span>
                <span>{singer.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected ? 'bg-black/20 text-black font-extrabold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {singer.albums.length} alb
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Artist Albums Sub-row */}
        {selectedArtist && activeArtistData && (
          <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 animate-fade-in space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
              <span className="flex items-center gap-1.5">
                <span>💿</span>
                <span>Albums by <span className="text-white underline">{activeArtistData.name}</span>:</span>
              </span>
              {selectedAlbum && (
                <button
                  type="button"
                  onClick={() => setSelectedAlbum(null)}
                  className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                >
                  Show all albums
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedAlbum(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedAlbum === null
                    ? 'bg-purple-500 text-black font-extrabold'
                    : 'bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800'
                }`}
              >
                All {activeArtistData.name} Tracks
              </button>
              {activeArtistData.albums.map((albumName) => {
                const isAlbumActive = selectedAlbum?.toLowerCase() === albumName.toLowerCase();
                return (
                  <button
                    key={albumName}
                    type="button"
                    onClick={() => setSelectedAlbum(isAlbumActive ? null : albumName)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border flex items-center gap-1 ${
                      isAlbumActive
                        ? 'bg-purple-500 text-black border-purple-400 font-black shadow'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-purple-500/40 hover:text-white'
                    }`}
                  >
                    <span>💿</span>
                    <span>{albumName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. TOP ALBUMS SHOWCASE IN SELECTED LANGUAGE */}
      {topAlbums.length > 0 && !selectedArtist && (
        <div className="p-5 rounded-2xl glass-panel border border-zinc-850 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Disc size={16} className="text-cyan-400" />
              <span>Top Albums {selectedLanguage !== 'All' ? `(${selectedLanguage})` : 'Worldwide'}</span>
            </h3>
            {selectedAlbum && (
              <button
                type="button"
                onClick={() => setSelectedAlbum(null)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                Clear Album Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {topAlbums.map((item) => {
              const isSelected = selectedAlbum?.toLowerCase() === item.album.toLowerCase();
              return (
                <div
                  key={item.album}
                  onClick={() => setSelectedAlbum(isSelected ? null : item.album)}
                  className={`p-3 rounded-xl border transition cursor-pointer select-none flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-950/70 border-zinc-850 hover:border-cyan-500/40 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base">
                      💿
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono">
                      {item.language}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white truncate" title={item.album}>
                      {item.album}
                    </h4>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                      {item.artist}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIBE & USER MOOD PLAYLIST FILTERS ("Add song according to mood") */}
      <div className="p-4 rounded-2xl glass-panel border border-zinc-850 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <span>🔥</span>
              <span>Filter by Vibe & Mood Playlists</span>
            </h3>
          </div>

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
            {t('feed.all_moods')}
          </button>

          {moods.map((m) => {
            const moodText = getMoodName(m.emoji, t);
            const isMoodSelected = selectedMood === m.emoji || activeMoodPlaylist === m.emoji;
            return (
              <button
                key={m.emoji}
                type="button"
                onClick={() => {
                  if (selectedMood === m.emoji) {
                    setSelectedMood(null);
                  } else {
                    setSelectedMood(m.emoji);
                  }
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

      {/* 6. SONG CARDS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
          <span>Showing {filteredSongs.length} Tracks</span>
          {(selectedArtist || selectedAlbum || selectedLanguage !== 'All' || selectedMood || onlyLiked) && (
            <span className="text-[11px] text-purple-400">
              Active filter: {[
                selectedLanguage !== 'All' ? selectedLanguage : null,
                selectedArtist,
                selectedAlbum ? `Album: ${selectedAlbum}` : null,
                selectedMood,
                onlyLiked ? 'Liked Only' : null,
              ].filter(Boolean).join(' • ')}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-purple-400" />
            <span>Loading tracks from library...</span>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl glass-panel border border-zinc-850 space-y-2">
            <p className="text-zinc-400 text-xs font-bold">No songs found matching current filters.</p>
            <p className="text-zinc-500 text-[11px]">
              Try selecting &ldquo;All Languages&rdquo; or clearing your mood/artist filter.
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
                  className={`p-4 rounded-2xl glass-panel border transition relative flex flex-col justify-between gap-3 ${
                    isCurrent
                      ? 'border-purple-500/80 bg-purple-950/25 shadow-lg shadow-purple-500/20'
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
                            {song.language || 'English'}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-semibold border border-zinc-800">
                            {song.moodEmoji} {song.genre}
                          </span>
                          {songMoods.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold flex items-center gap-1">
                              <span>Mood:</span> {songMoods.join(' ')}
                            </span>
                          )}
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
                        title="Like this song"
                      >
                        <Heart size={14} className={isLiked ? 'fill-red-400' : ''} />
                        <span className="text-[11px] font-bold">{song.likesCount}</span>
                      </button>
                    </div>
                  </div>

                  {/* Description note */}
                  {song.description && (
                    <p className="text-[11px] text-zinc-400 line-clamp-1 italic px-1">
                      &quot;{song.description}&quot;
                    </p>
                  )}

                  {/* Actions Toolbar */}
                  <div className="pt-2 border-t border-zinc-900/80 flex items-center justify-between text-xs">
                    {/* Left: User "Add to Mood" Button */}
                    <div className="relative mood-popover-container">
                      <button
                        type="button"
                        onClick={() => setMoodPickerSongId(moodPickerSongId === song.id ? null : song.id)}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-amber-300 text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                        title="Add this song according to your mood"
                      >
                        <Smile size={12} className="text-amber-400" />
                        <span>Add to Mood</span>
                      </button>

                      {/* Mood Picker Popover */}
                      {moodPickerSongId === song.id && (
                        <div className="absolute left-0 bottom-full mb-2 bg-zinc-950/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl z-40 w-64 space-y-2 animate-fade-in backdrop-blur-md">
                          <p className="text-[10px] uppercase tracking-wider font-black text-amber-400 flex items-center gap-1">
                            <span>✨</span> Save to My Mood Playlist:
                          </p>
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

                    {/* Right: Comments, Social Share & Delete */}
                    <div className="flex items-center gap-1.5">
                      {/* Comments count */}
                      <button
                        type="button"
                        onClick={() => toggleComments(song.id)}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                        title="View comments"
                      >
                        <MessageSquare size={13} />
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

                      {/* Delete Track (Creator or Admin) */}
                      {(currentUser?.username === song.creatorUsername || currentUser?.username === 'admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSong(song.id)}
                          className="p-1.5 rounded-lg hover:bg-red-950/60 text-zinc-600 hover:text-red-400 transition cursor-pointer"
                          title="Delete song"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Comments Accordion */}
                  {expandedCommentsSongId === song.id && (
                    <div className="pt-2 border-t border-zinc-900 space-y-2 animate-fade-in">
                      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {commentsLoading ? (
                          <div className="text-center py-2 text-zinc-500 text-[11px]">Loading comments...</div>
                        ) : songComments.length === 0 ? (
                          <div className="text-center py-2 text-zinc-500 text-[11px]">No comments yet. Be first!</div>
                        ) : (
                          songComments.map((c) => (
                            <div key={c.id} className="p-2 bg-zinc-900/60 rounded-lg flex items-start gap-2">
                              <span className="font-bold text-purple-400 text-[10px]">@{c.username}:</span>
                              <span className="text-zinc-300 text-[11px] flex-1">{c.text}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add comment input */}
                      <form onSubmit={(e) => handleAddComment(e, song.id)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                        />
                        <button
                          type="submit"
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
    </div>
  );
}
