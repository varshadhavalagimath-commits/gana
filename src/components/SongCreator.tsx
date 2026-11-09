'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import {
  Mic,
  Square,
  Music,
  Loader2,
  CheckCircle2,
  Upload,
  FileAudio,
  RotateCcw,
  Search,
  Globe,
  Plus,
  Link as LinkIcon,
  TrendingUp,
  ArrowRight,
  BookOpen,
  Copy,
  Check,
  Radio,
  Sparkles,
} from 'lucide-react';
import { MOODS, getMoodName } from '@/lib/moods';
import { MUSIC_INDUSTRIES } from '@/lib/industries';

interface SongCreatorProps {
  creatorUsername: string;
  onSongCreated: () => void;
}

interface GlobalTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  previewUrl: string;
  artworkUrl100: string;
  collectionName?: string;
}

export default function SongCreator({ creatorUsername, onSongCreated }: SongCreatorProps) {
  const { t } = useLanguage();
  const [creatorMode, setCreatorMode] = useState<'record' | 'upload' | 'lyrics' | 'search'>('record');

  // Common Form States
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Bollywood Romantic');
  const [selectedMood, setSelectedMood] = useState('🔥');
  const [language, setLanguage] = useState('Hindi');
  const [industry, setIndustry] = useState('Bollywood');
  const [artist, setArtist] = useState(creatorUsername || '');
  const [album, setAlbum] = useState('Single');
  const [description, setDescription] = useState('');
  const [lyrics, setLyrics] = useState('');

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrlPreview, setAudioUrlPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // File Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Status & Loading
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Lyrics Search States
  const [lyricsSearchQuery, setLyricsSearchQuery] = useState('');
  const [lyricsSearchArtist, setLyricsSearchArtist] = useState('');
  const [searchingLyrics, setSearchingLyrics] = useState(false);
  const [foundLyrics, setFoundLyrics] = useState<{ title: string; artist: string; lyrics: string; source: string } | null>(null);
  const [lyricsCopied, setLyricsCopied] = useState(false);

  // Global Track Search States (iTunes / YouTube Import)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSearchMoods, setSelectedSearchMoods] = useState<Record<number, string>>({});
  const [suggestions, setSuggestions] = useState<{ queries: string[]; dbSongs: any[] } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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
        console.warn('Autocomplete fetch failed:', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start microphone recording
  const startRecording = async () => {
    setErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrlPreview(URL.createObjectURL(blob));
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Microphone access denied. Please allow microphone permissions in your browser.');
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrlPreview(null);
    setRecordingSeconds(0);
  };

  // Handle Publishing Recorded Tune / Vocals
  const handlePublishRecording = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a song / tune title.');
      return;
    }
    if (!audioBlob) {
      setErrorMsg('Please record your tune or vocal melody before publishing.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('genre', genre);
      formData.append('moodEmoji', selectedMood);
      formData.append('language', language);
      formData.append('industry', industry);
      formData.append('artist', artist.trim() || creatorUsername);
      formData.append('album', album.trim() || 'Single');
      formData.append('description', description.trim());
      formData.append('lyrics', lyrics.trim());
      formData.append('creatorUsername', creatorUsername || 'artist');
      formData.append('audio', audioBlob, `${title.replace(/\s+/g, '_')}.webm`);

      const res = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish recording');
      }

      setSuccessMsg('Your original tune and lyrics have been published to Gana!');
      setTitle('');
      setLyrics('');
      resetRecording();
      onSongCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing track');
    } finally {
      setLoading(false);
    }
  };

  // Handle Uploading MP3/WAV Audio File
  const handlePublishUpload = async () => {
    if (!title.trim()) {
      setErrorMsg('Please enter a track title.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('genre', genre);
      formData.append('moodEmoji', selectedMood);
      formData.append('language', language);
      formData.append('industry', industry);
      formData.append('artist', artist.trim() || creatorUsername);
      formData.append('album', album.trim() || 'Single');
      formData.append('description', description.trim());
      formData.append('lyrics', lyrics.trim());
      formData.append('creatorUsername', creatorUsername || 'artist');

      if (uploadFile) {
        formData.append('audio', uploadFile);
      } else if (youtubeUrl.trim()) {
        const match = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (match && match[1]) {
          formData.append('audioUrl', `youtube:${match[1]}`);
        } else {
          formData.append('audioUrl', youtubeUrl.trim());
        }
      } else {
        throw new Error('Please select an audio file (MP3/WAV) or provide a valid YouTube link.');
      }

      const res = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish track');
      }

      setSuccessMsg('Song and lyrics published successfully!');
      setTitle('');
      setLyrics('');
      setUploadFile(null);
      setYoutubeUrl('');
      onSongCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error publishing upload');
    } finally {
      setLoading(false);
    }
  };

  // Handle Search for Lyrics
  const handleSearchLyrics = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lyricsSearchQuery.trim()) return;

    setSearchingLyrics(true);
    setFoundLyrics(null);
    setLyricsCopied(false);

    try {
      const url = `/api/songs/lyrics?title=${encodeURIComponent(lyricsSearchQuery.trim())}&artist=${encodeURIComponent(lyricsSearchArtist.trim())}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.lyrics) {
        setFoundLyrics(data);
      } else {
        setFoundLyrics({
          title: lyricsSearchQuery,
          artist: lyricsSearchArtist || 'Unknown Artist',
          lyrics: 'No lyrics found for this title. You can write your own in the Creator tab!',
          source: 'not_found',
        });
      }
    } catch (err) {
      console.error('Lyrics search error:', err);
    } finally {
      setSearchingLyrics(false);
    }
  };

  // Copy lyrics to clipboard
  const handleCopyLyrics = (text: string) => {
    navigator.clipboard.writeText(text);
    setLyricsCopied(true);
    setTimeout(() => setLyricsCopied(false), 2000);
  };

  // Transfer found lyrics to the song creator
  const handleUseLyricsInSong = (text: string, trackTitle?: string, trackArtist?: string) => {
    setLyrics(text);
    if (trackTitle && !title) setTitle(trackTitle);
    if (trackArtist && (!artist || artist === creatorUsername)) setArtist(trackArtist);
    setCreatorMode('record');
    setSuccessMsg('Lyrics loaded into your Song Studio! You can now record or upload your tune.');
  };

  // Global Library Search (Apple / iTunes catalog)
  const executeSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setSearching(true);
    setShowSuggestions(false);
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(queryText)}&media=music&entity=song&limit=20`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setSearching(false);
    }
  };

  // Import track from search results
  const importTrackToDatabase = async (track: GlobalTrack) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const trackMood = selectedSearchMoods[track.trackId] || '🔥';
      const cleanTitle = track.trackName;

      // Scrape authentic YouTube video stream
      let streamUrl = track.previewUrl;
      try {
        const ytRes = await fetch(
          `/api/songs/youtube-search?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(track.artistName)}`
        );
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          if (ytData.videoId) {
            streamUrl = `youtube:${ytData.videoId}`;
          }
        }
      } catch (e) {
        console.warn('Could not auto-link YouTube stream, falling back to preview:', e);
      }

      const payload = {
        title: cleanTitle,
        artist: track.artistName,
        album: track.collectionName || 'Single',
        genre: track.primaryGenreName || 'Pop',
        language: 'English',
        industry: 'Hollywood',
        moodEmoji: trackMood,
        audioUrl: streamUrl,
        creatorUsername: creatorUsername || 'admin',
        description: `Imported hit track: ${cleanTitle} by ${track.artistName}.`,
      };

      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to import song');
      }

      setSuccessMsg(`"${cleanTitle}" imported and ready to play!`);
      onSongCreated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Import error');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-purple-500/30 glow-purple space-y-6">
      {/* Studio Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Music className="text-purple-400" size={22} />
            <span>Singer Studio & Lyrics Center</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Record your original tune, attach your custom lyrics, or search authentic song lyrics worldwide.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => { setCreatorMode('record'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              creatorMode === 'record'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic size={14} />
            <span>Record Tune</span>
          </button>

          <button
            type="button"
            onClick={() => { setCreatorMode('upload'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              creatorMode === 'upload'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload size={14} />
            <span>Upload Audio</span>
          </button>

          <button
            type="button"
            onClick={() => { setCreatorMode('lyrics'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              creatorMode === 'lyrics'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen size={14} />
            <span>Search Lyrics</span>
          </button>

          <button
            type="button"
            onClick={() => { setCreatorMode('search'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              creatorMode === 'search'
                ? 'bg-purple-600 text-black shadow-md shadow-purple-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Search size={14} />
            <span>Import Songs</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* MODE 1: RECORD YOUR OWN TUNE OR VOICE */}
      {creatorMode === 'record' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-5 rounded-xl bg-gradient-to-r from-purple-950/30 to-zinc-900 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic size={16} className="text-purple-400" />
                  <span>Microphone Tune & Vocal Recording</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Sing your vocals, hum your melody, or record an acoustic tune directly with your microphone.
                </p>
              </div>

              {/* Recording Status Badge */}
              {isRecording && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-500/40 rounded-full animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-mono font-bold text-red-400">
                    REC {formatTimer(recordingSeconds)}
                  </span>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isRecording && !audioBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Mic size={15} />
                  <span>Start Recording Tune</span>
                </button>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-black font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 animate-bounce active:scale-95"
                >
                  <Square size={14} className="fill-black" />
                  <span>Stop Recording</span>
                </button>
              )}

              {audioBlob && !isRecording && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <audio src={audioUrlPreview || ''} controls className="h-9 w-64 rounded-lg" />
                  <button
                    type="button"
                    onClick={resetRecording}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                    title="Record Again"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Song Details & Lyrics Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Track Title *</label>
              <input
                type="text"
                placeholder="e.g. My Midnight Melody"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Artist / Singer Name</label>
              <input
                type="text"
                placeholder="e.g. Varsha / Your Name"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Music Industry Section</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
              >
                {MUSIC_INDUSTRIES.filter((i) => i.id !== 'all').map((ind) => (
                  <option key={ind.id} value={ind.name.split(' ')[0]}>
                    {ind.icon} {ind.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Genre & Vibe</label>
              <input
                type="text"
                placeholder="e.g. Acoustic Indie / Bollywood Melody"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 font-semibold cursor-pointer"
              >
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Spanish">Spanish</option>
                <option value="Korean">Korean</option>
                <option value="French">French</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Mood Category</label>
              <div className="flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.emoji}
                    type="button"
                    onClick={() => setSelectedMood(m.emoji)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      selectedMood === m.emoji
                        ? 'bg-purple-600 text-black'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <span>{m.emoji}</span>
                    <span>{getMoodName(m.emoji, t)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lyrics Input Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <BookOpen size={14} className="text-purple-400" />
                <span>Upload or Write Your Own Lyrics</span>
              </label>
              <button
                type="button"
                onClick={() => setCreatorMode('lyrics')}
                className="text-[11px] text-purple-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
              >
                <Search size={12} />
                <span>Search lyrics online</span>
              </button>
            </div>
            <textarea
              rows={5}
              placeholder="Type, write, or paste your song lyrics line by line here..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handlePublishRecording}
            disabled={loading || !audioBlob}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Music size={16} />}
            <span>Publish Original Recording to Gana</span>
          </button>
        </div>
      )}

      {/* MODE 2: UPLOAD AUDIO FILE & LYRICS */}
      {creatorMode === 'upload' && (
        <div className="space-y-5 animate-fade-in">
          {/* File Picker or YouTube URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <FileAudio size={16} className="text-purple-400" />
                <span>Upload Audio File (MP3, WAV, OGG)</span>
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-black hover:file:bg-purple-500 file:cursor-pointer cursor-pointer"
              />
              {uploadFile && (
                <p className="text-[11px] text-emerald-400 font-semibold truncate">
                  Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <LinkIcon size={16} className="text-cyan-400" />
                <span>Or Enter YouTube Video URL / Stream</span>
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
              <p className="text-[10px] text-zinc-500">
                Direct YouTube stream integration enables full audio player visualization.
              </p>
            </div>
          </div>

          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Song Title *</label>
              <input
                type="text"
                placeholder="e.g. Kesariya"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Artist / Singer</label>
              <input
                type="text"
                placeholder="e.g. Arijit Singh"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Album Name</label>
              <input
                type="text"
                placeholder="e.g. Brahmāstra"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Industry Section</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {MUSIC_INDUSTRIES.filter((i) => i.id !== 'all').map((ind) => (
                  <option key={ind.id} value={ind.name.split(' ')[0]}>
                    {ind.icon} {ind.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Genre</label>
              <input
                type="text"
                placeholder="e.g. Romantic Pop"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
                <option value="Spanish">Spanish</option>
                <option value="Korean">Korean</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>

          {/* Custom Lyrics */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <BookOpen size={14} className="text-purple-400" />
              <span>Attach Song Lyrics</span>
            </label>
            <textarea
              rows={4}
              placeholder="Paste or write lyrics for this track..."
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handlePublishUpload}
            disabled={loading || (!uploadFile && !youtubeUrl.trim())}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>Upload and Publish Track</span>
          </button>
        </div>
      )}

      {/* MODE 3: SEARCH LYRICS ONLINE */}
      {creatorMode === 'lyrics' && (
        <div className="space-y-5 animate-fade-in">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <span>Search Verified Song Lyrics</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                Search verified lyrics for any song worldwide, copy them, or use them directly in your recordings.
              </p>
            </div>

            <form onSubmit={handleSearchLyrics} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Song title (e.g. Yellow, Kesariya, Blinding Lights, Naatu Naatu)..."
                value={lyricsSearchQuery}
                onChange={(e) => setLyricsSearchQuery(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-medium"
              />
              <input
                type="text"
                placeholder="Singer / Artist (optional)..."
                value={lyricsSearchArtist}
                onChange={(e) => setLyricsSearchArtist(e.target.value)}
                className="w-full sm:w-48 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-medium"
              />
              <button
                type="submit"
                disabled={searchingLyrics || !lyricsSearchQuery.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {searchingLyrics ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Find Lyrics</span>
              </button>
            </form>
          </div>

          {/* Found Lyrics Display Card */}
          {foundLyrics && (
            <div className="p-5 rounded-2xl bg-zinc-950/90 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-black text-white">{foundLyrics.title}</h4>
                  <p className="text-xs text-purple-400 font-semibold">{foundLyrics.artist}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLyrics(foundLyrics.lyrics)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    {lyricsCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{lyricsCopied ? 'Copied!' : 'Copy Lyrics'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseLyricsInSong(foundLyrics.lyrics, foundLyrics.title, foundLyrics.artist)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-xs font-bold text-black rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Use in My Recording</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 rounded-xl max-h-96 overflow-y-auto border border-zinc-800/80">
                <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">
                  {foundLyrics.lyrics}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 4: SEARCH & IMPORT TRACKS FROM GLOBAL CATALOG */}
      {creatorMode === 'search' && (
        <div className="space-y-4 animate-fade-in">
          <div className="relative" ref={searchContainerRef}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSearch(searchQuery);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search global iTunes & YouTube music catalog (e.g. Diljit Dosanjh, Taylor Swift, Anirudh)..."
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Search</span>
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions && suggestions.queries.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-purple-500/30 rounded-xl shadow-2xl z-50 p-2 space-y-1">
                <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 px-2">Suggestions</p>
                {suggestions.queries.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(q);
                      executeSearch(q);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-purple-600/15 flex items-center gap-2 cursor-pointer"
                  >
                    <Search size={12} className="text-zinc-500" />
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Grid */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {searchResults.map((track) => (
                <div
                  key={track.trackId}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-purple-500/40 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.artworkUrl100}
                      alt={track.trackName}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.trackName}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{track.artistName}</p>
                      <p className="text-[10px] text-purple-400 font-semibold">{track.primaryGenreName}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => importTrackToDatabase(track)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-black font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Plus size={13} />
                    <span>Import</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
