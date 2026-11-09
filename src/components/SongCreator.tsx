'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Mic, Square, Sparkles, Music, Loader2, CheckCircle2, Upload, FileAudio, RotateCcw, Search, Globe, Plus, Link as LinkIcon, TrendingUp, ArrowRight } from 'lucide-react';

interface SongCreatorProps {
  creatorUsername: string;
  onSongCreated: () => void;
}
import { MOODS, getMoodName } from '@/lib/moods';
import { FEATURED_ARTISTS } from '@/lib/artists';

const moods = MOODS;

interface GlobalTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  previewUrl: string;
  artworkUrl100: string;
}

export default function SongCreator({ creatorUsername, onSongCreated }: SongCreatorProps) {
  const { t } = useLanguage();
  const [creatorMode, setCreatorMode] = useState<'record' | 'upload' | 'search'>('upload');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Bollywood Romantic');
  const [selectedMood, setSelectedMood] = useState('🔥');
  const [language, setLanguage] = useState('English');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [artist, setArtist] = useState(creatorUsername || '');
  const [album, setAlbum] = useState('Single');
  const [description, setDescription] = useState('');
  
  // Global Library Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSearchMoods, setSelectedSearchMoods] = useState<Record<number, string>>({});
  const [suggestions, setSuggestions] = useState<{ queries: string[]; dbSongs: any[] } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Debounced real-time Google/Gana suggestions
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

  // Click outside listener to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Extract YouTube ID from link
  const extractYoutubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Start Voice Recording
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSuccess(false);
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access denied. Please grant permission to record your voice snippet.');
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert rendered AudioBuffer to WAV format
  const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; 
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }
    
    const bufferLength = result.length * 2;
    const arrayBuffer = new ArrayBuffer(44 + bufferLength);
    const view = new DataView(arrayBuffer);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLength, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLength, true);
    
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });

    function interleave(inputL: Float32Array, inputR: Float32Array) {
      const length = inputL.length + inputR.length;
      const r = new Float32Array(length);
      let index = 0;
      let inputIndex = 0;
      while (index < length) {
        r[index++] = inputL[inputIndex];
        r[index++] = inputR[inputIndex];
        inputIndex++;
      }
      return r;
    }

    function writeString(v: DataView, o: number, str: string) {
      for (let i = 0; i < str.length; i++) {
        v.setUint8(o + i, str.charCodeAt(i));
      }
    }
  };

  // Mode 1: Synthesize AI track using OfflineAudioContext
  const generateAndUpload = async () => {
    if (!title) {
      alert('Please enter a song title');
      return;
    }
    setLoading(true);
    setSuccess(false);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let vocalBuffer: AudioBuffer | null = null;

      if (audioBlob) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        vocalBuffer = await audioCtx.decodeAudioData(arrayBuffer).catch(() => null);
      }

      const duration = 10;
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

      const delayNode = offlineCtx.createDelay(1.0);
      const feedbackNode = offlineCtx.createGain();
      const delayGain = offlineCtx.createGain();

      delayNode.delayTime.value = 0.3;
      feedbackNode.gain.value = 0.4;
      delayGain.gain.value = 0.25;

      delayNode.connect(feedbackNode);
      feedbackNode.connect(delayNode);

      if (selectedMood === '🔥') {
        for (let time = 0; time < duration; time += 0.5) {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(45, time + 0.15);

          gain.gain.setValueAtTime(0.8, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

          osc.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(time);
          osc.stop(time + 0.3);
        }
        const notes = [55, 65.4, 73.4, 82.4]; 
        for (let time = 0.25; time < duration; time += 0.25) {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sawtooth';
          const noteFreq = notes[Math.floor(time * 4) % notes.length];
          osc.frequency.setValueAtTime(noteFreq, time);

          gain.gain.setValueAtTime(0.2, time);
          gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

          const filter = offlineCtx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, time);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(time);
          osc.stop(time + 0.22);
        }
      } else if (selectedMood === '🌧️' || selectedMood === '😴') {
        const chordNotes = [130.81, 164.81, 196.00, 246.94]; 
        const chordNotes2 = [146.83, 174.61, 220.00, 261.63]; 

        for (let time = 0; time < duration; time += 3) {
          const notesToPlay = (time / 3) % 2 === 0 ? chordNotes : chordNotes2;
          notesToPlay.forEach((freq) => {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.12, time + 0.8);
            gain.gain.linearRampToValueAtTime(0.0, time + 2.8);

            osc.connect(gain);
            gain.connect(delayNode);
            delayGain.connect(offlineCtx.destination);
            gain.connect(offlineCtx.destination);

            osc.start(time);
            osc.stop(time + 3.0);
          });
        }
        delayNode.connect(delayGain);

        if (selectedMood === '🌧️') {
          for (let time = 1; time < duration; time += 2) {
            const noiseOsc = offlineCtx.createOscillator();
            const noiseGain = offlineCtx.createGain();
            noiseOsc.type = 'triangle';
            noiseOsc.frequency.setValueAtTime(180, time);
            noiseGain.gain.setValueAtTime(0.15, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

            noiseOsc.connect(noiseGain);
            noiseGain.connect(offlineCtx.destination);
            noiseOsc.start(time);
            noiseOsc.stop(time + 0.4);
          }
        }
      } else if (selectedMood === '💔') {
        const chord = [220.00, 261.63, 329.63, 392.00]; 
        const chord2 = [196.00, 246.94, 293.66, 349.23]; 
        
        for (let i = 0; i < duration * 2; i++) {
          const time = i * 0.5;
          const currentChord = Math.floor(time / 2) % 2 === 0 ? chord : chord2;
          const noteIndex = i % currentChord.length;

          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(currentChord[noteIndex], time);

          gain.gain.setValueAtTime(0.15, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

          osc.connect(gain);
          gain.connect(delayNode);
          delayGain.connect(offlineCtx.destination);
          gain.connect(offlineCtx.destination);

          osc.start(time);
          osc.stop(time + 0.5);
        }
        delayNode.connect(delayGain);
      } else if (selectedMood === '🚀') {
        for (let time = 0; time < duration; time += 0.25) {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sine';
          
          const pitch = 220 * (1 + ((Math.floor(time * 4) % 8) * 0.25));
          osc.frequency.setValueAtTime(pitch, time);

          gain.gain.setValueAtTime(0.08, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

          osc.connect(gain);
          gain.connect(offlineCtx.destination);
          osc.start(time);
          osc.stop(time + 0.2);
        }
      } else {
        for (let time = 0; time < duration; time += 0.468) { 
          const kick = offlineCtx.createOscillator();
          const kickGain = offlineCtx.createGain();
          kick.type = 'sine';
          kick.frequency.setValueAtTime(150, time);
          kick.frequency.exponentialRampToValueAtTime(45, time + 0.12);
          kickGain.gain.setValueAtTime(0.9, time);
          kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);
          kick.connect(kickGain);
          kickGain.connect(offlineCtx.destination);
          kick.start(time);
          kick.stop(time + 0.25);

          const synth = offlineCtx.createOscillator();
          const synthGain = offlineCtx.createGain();
          synth.type = 'sawtooth';
          synth.frequency.setValueAtTime(329.63, time + 0.2); 
          synthGain.gain.setValueAtTime(0, time + 0.2);
          synthGain.gain.linearRampToValueAtTime(0.15, time + 0.25);
          synthGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
          
          const filter = offlineCtx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.setValueAtTime(1200, time);

          synth.connect(filter);
          filter.connect(synthGain);
          synthGain.connect(offlineCtx.destination);
          synth.start(time + 0.2);
          synth.stop(time + 0.46);
        }
      }

      if (vocalBuffer) {
        const vocalSource = offlineCtx.createBufferSource();
        vocalSource.buffer = vocalBuffer;

        const vocalGain = offlineCtx.createGain();
        vocalGain.gain.value = 1.0; 

        const vocalFilter = offlineCtx.createBiquadFilter();
        vocalFilter.type = 'bandpass';
        vocalFilter.frequency.value = 1000; 
        vocalFilter.Q.value = 0.8;

        vocalSource.connect(vocalFilter);
        vocalFilter.connect(vocalGain);

        vocalGain.connect(delayNode);
        vocalGain.connect(offlineCtx.destination);

        vocalSource.loop = true;
        vocalSource.start(0);
      }

      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = bufferToWav(renderedBuffer);

      const formData = new FormData();
      formData.append('title', title);
      formData.append('genre', genre);
      formData.append('moodEmoji', selectedMood);
      formData.append('creatorUsername', creatorUsername);
      formData.append('audio', wavBlob, 'ai-track.wav');
      formData.append('artist', 'Gana AI Synthesizer');
      formData.append('album', 'AI Synthesized EP');
      formData.append('description', description);

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Failed to upload generated track');
      } else {
        setSuccess(true);
        setTitle('');
        setAudioBlob(null);
        setDescription('');
        onSongCreated();
      }
    } catch (error) {
      console.error('Synthesis failed:', error);
      alert('AI synthesis failed.');
    } finally {
      setLoading(false);
    }
  };

  // Mode 2: Direct Upload / Link Song (Supports MP3 file upload OR Youtube link streaming)
  const uploadAndPublish = async () => {
    if (!title) {
      alert('Please enter a song title');
      return;
    }
    
    if (!uploadFile && !youtubeUrl.trim()) {
      alert('Please select an audio file to upload OR paste a YouTube video link');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('genre', genre);
      formData.append('moodEmoji', selectedMood);
      formData.append('creatorUsername', creatorUsername);
      formData.append('artist', artist.trim() || creatorUsername);
      formData.append('album', album.trim() || 'Single');
      formData.append('language', language);
      formData.append('description', description.trim());

      if (youtubeUrl.trim()) {
        // Extract Youtube ID
        const ytId = extractYoutubeId(youtubeUrl);
        if (!ytId) {
          alert('Invalid YouTube Link. Please make sure the URL contains a valid 11-character video ID.');
          setLoading(false);
          return;
        }
        // Save as youtube:VIDEO_ID for full song streaming!
        formData.append('audioUrl', `youtube:${ytId}`);
      } else if (uploadFile) {
        formData.append('audio', uploadFile);
      }

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        alert(errData.error || 'Failed to publish song');
      } else {
        setSuccess(true);
        setTitle('');
        setArtist('');
        setAlbum('');
        setDescription('');
        setUploadFile(null);
        setYoutubeUrl('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onSongCreated();
      }
    } catch (error) {
      console.error('Publishing failed:', error);
      alert('Upload failed.');
    } finally {
      setLoading(false);
    }
  };

  const executeSearch = async (term: string) => {
    setSearchQuery(term);
    setShowSuggestions(false);
    setSearching(true);
    setSearchResults([]);
    setSuccess(false);

    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&media=music&limit=8`
      );
      const data = await response.json();
      if (data && data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error('Global search error:', error);
      alert('Failed to search global library. Make sure you are online.');
    } finally {
      setSearching(false);
    }
  };

  // Mode 3: Global Library Search using iTunes API
  const handleSearchGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    executeSearch(searchQuery.trim());
  };

  // Import track from global search to Gana feed
  const importGlobalTrack = async (track: GlobalTrack) => {
    setLoading(true);
    setSuccess(false);

    const mood = selectedSearchMoods[track.trackId] || '🔥';

    try {
      // Automatically fetch full YouTube stream to bypass 30s preview limits
      let streamUrl = track.previewUrl;
      try {
        const ytSearchResponse = await fetch(
          `/api/songs/youtube-search?title=${encodeURIComponent(track.trackName)}&artist=${encodeURIComponent(track.artistName)}`
        );
        if (ytSearchResponse.ok) {
          const ytData = await ytSearchResponse.json();
          if (ytData.videoId) {
            streamUrl = `youtube:${ytData.videoId}`;
          }
        }
      } catch (err) {
        console.error('Full song extraction failed, falling back to 30s preview:', err);
      }

      const formData = new FormData();
      formData.append('title', `${track.trackName} - ${track.artistName}`);
      formData.append('genre', track.primaryGenreName || 'Pop');
      formData.append('moodEmoji', mood);
      formData.append('creatorUsername', creatorUsername);
      formData.append('audioUrl', streamUrl);
      formData.append('artist', track.artistName);
      formData.append('album', (track as any).collectionName || 'Single');
      formData.append('description', 'Imported from Gana Global catalog.');

      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setSearchResults((prev) => prev.filter((t) => t.trackId !== track.trackId));
        onSongCreated();
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to import song');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import song.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (mode: 'record' | 'upload' | 'search') => {
    setCreatorMode(mode);
    setSuccess(false);
    setAudioBlob(null);
    setUploadFile(null);
    setYoutubeUrl('');
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="p-6 rounded-2xl glass-panel border border-purple-500/20 glow-purple mb-6">
      {/* Tab Switch Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Sparkles size={24} className="text-purple-400 animate-pulse" />
          <div>
            <h3 className="text-xl font-bold text-white">Music Desk</h3>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              {creatorMode === 'record'
                ? 'AI Voice Synthesizer'
                : creatorMode === 'upload'
                ? 'Publish / Link Tracks'
                : 'Search & Import Global Songs'}
            </p>
          </div>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto select-none gap-0.5 animate-pulse">
          <button
            onClick={() => handleModeChange('record')}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-black transition cursor-pointer ${
              creatorMode === 'record'
                ? 'bg-purple-600 text-black shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            AI Synth
          </button>
          <button
            onClick={() => handleModeChange('upload')}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-black transition cursor-pointer ${
              creatorMode === 'upload'
                ? 'bg-purple-600 text-black shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Link / Upload
          </button>
          <button
            onClick={() => handleModeChange('search')}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-black transition cursor-pointer ${
              creatorMode === 'search'
                ? 'bg-purple-600 text-black shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Search Global
          </button>
        </div>
      </div>

      {creatorMode !== 'search' ? (
        /* Record and Link/Upload Panel */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Song Title
              </label>
              <input
                type="text"
                required
                disabled={loading}
                placeholder={
                  creatorMode === 'record' ? 'My Ambient Beat' : 'e.g. Kesariya (Full Song)'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Genre
                </label>
                <select
                  value={genre}
                  disabled={loading}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition cursor-pointer font-bold"
                >
                  <option value="Hollywood Pop">Hollywood Pop</option>
                  <option value="Hollywood Rock">Hollywood Rock</option>
                  <option value="Bollywood Masala">Bollywood Masala</option>
                  <option value="Bollywood Romantic">Bollywood Romantic</option>
                  <option value="Punjabi Pop">Punjabi Pop</option>
                  <option value="Tollywood Mass">Tollywood Mass</option>
                  <option value="Latin Pop">Latin Pop</option>
                  <option value="K-Pop Dance">K-Pop Dance</option>
                  <option value="EDM / House">EDM / House</option>
                  <option value="Lofi Chillout">Lofi Chillout</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Language
                </label>
                <select
                  value={language}
                  disabled={loading}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition cursor-pointer font-bold"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Punjabi">Punjabi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Korean">Korean</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="French">French</option>
                  <option value="Japanese">Japanese</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Vibe (Mood)
                </label>
                <select
                  value={selectedMood}
                  disabled={loading}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition cursor-pointer font-bold"
                >
                  {moods.map((m) => {
                    const moodText = getMoodName(m.emoji, t);
                    return (
                      <option key={m.emoji} value={m.emoji}>
                        {m.emoji} {moodText}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

              {/* Optional Singer and Album fields (only for upload/link mode) */}
              {creatorMode === 'upload' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Singer / Artist
                    </label>
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="e.g. Arijit Singh, The Weeknd, Coldplay"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition font-semibold animate-fade-in"
                    />
                    <div className="flex items-center gap-1 flex-wrap mt-1.5">
                      <span className="text-[9px] text-zinc-500 font-bold">Popular:</span>
                      {FEATURED_ARTISTS.slice(0, 5).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setArtist(a.name);
                            if (a.albums[0]) setAlbum(a.albums[0]);
                          }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-purple-500/20 text-zinc-400 hover:text-purple-300 border border-zinc-850 transition cursor-pointer"
                        >
                          {a.avatarEmoji} {a.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Album Title
                    </label>
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="e.g. Brahmastra, After Hours"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition font-semibold animate-fade-in"
                    />
                    {artist && FEATURED_ARTISTS.find((a) => a.name.toLowerCase() === artist.toLowerCase())?.albums && (
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        <span className="text-[9px] text-zinc-500 font-bold">Albums:</span>
                        {FEATURED_ARTISTS.find((a) => a.name.toLowerCase() === artist.toLowerCase())?.albums.map((alb) => (
                          <button
                            key={alb}
                            type="button"
                            onClick={() => setAlbum(alb)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-purple-500/20 text-zinc-400 hover:text-purple-300 border border-zinc-850 transition cursor-pointer"
                          >
                            💿 {alb}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes / Description notes with song (visible for both tabs) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Notes with Song / Description
                </label>
                <textarea
                  disabled={loading}
                  placeholder="Add custom notes, vibe details, background info..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950/60 border border-zinc-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500 transition resize-none font-semibold"
                />
              </div>
            </div>

          <div className="flex flex-col justify-between p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
            {creatorMode === 'record' ? (
              /* Microphone recording modes */
              <>
                <div className="text-center">
                  <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block mb-2">
                    Step 1: Record Vocal Hook
                  </span>
                  <div className="flex justify-center items-center gap-3 my-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={loading}
                        className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow shadow-red-600/30 active:scale-95 disabled:opacity-50"
                      >
                        <Mic size={14} />
                        {t('creator.record_btn')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-4 py-2 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer pulse-glow-effect"
                      >
                        <Square size={14} />
                        {t('creator.stop_btn')}
                      </button>
                    )}
                  </div>

                  <div className="text-[10px] text-zinc-500 min-h-6 flex items-center justify-center font-medium">
                    {isRecording && <span className="text-red-400 animate-pulse">{t('creator.recording')}</span>}
                    {!isRecording && audioBlob && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> {t('creator.recorded')}</span>}
                    {!isRecording && !audioBlob && <span>Vocal hook is procedurally mixed</span>}
                  </div>
                </div>

                <div className="border-t border-zinc-900/80 pt-4 mt-2">
                  <span className="text-[10px] text-purple-400 font-extrabold uppercase tracking-wider block mb-2 text-center">
                    Step 2: Generate AI Music
                  </span>
                  <button
                    type="button"
                    onClick={generateAndUpload}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-bold text-xs text-black bg-purple-500 hover:bg-purple-400 cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-98 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>{t('creator.generating')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>{t('creator.generate_btn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Link YouTube Video OR Upload local MP3 file */
              <>
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {/* YouTube url input */}
                  <div>
                    <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider block mb-1">
                      Option A: Paste YouTube Video URL (Full Song Stream)
                    </span>
                    <div className="relative">
                      <LinkIcon size={12} className="absolute left-2.5 top-2.5 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        disabled={loading || !!uploadFile}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-[10px] text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-center text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                    — OR —
                  </div>

                  {/* MP3 File upload zone */}
                  <div>
                    <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider block mb-1">
                      Option B: Upload MP3 / WAV File (Direct File)
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="audio/*"
                      disabled={loading || youtubeUrl.trim().length > 0}
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="song-file-upload"
                    />

                    {!uploadFile ? (
                      <label
                        htmlFor="song-file-upload"
                        className={`flex flex-col items-center gap-1 p-2 border border-dashed border-zinc-800 hover:border-purple-500/50 rounded-lg cursor-pointer transition bg-zinc-900/10 hover:bg-zinc-900/40 w-full ${
                          youtubeUrl.trim().length > 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload size={18} className="text-zinc-500" />
                        <span className="text-[10px] text-zinc-400 font-bold">Choose audio file</span>
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-zinc-900 border border-zinc-850 rounded-lg">
                        <div className="flex items-center gap-2 overflow-hidden max-w-[80%]">
                          <FileAudio size={16} className="text-cyan-400 shrink-0" />
                          <span className="text-[10px] text-zinc-200 font-semibold truncate">
                            {uploadFile.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadFile(null)}
                          className="text-[9px] text-red-400 font-bold hover:underline shrink-0"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-zinc-900/80 pt-3 mt-3">
                  <button
                    type="button"
                    onClick={uploadAndPublish}
                    disabled={loading || (!uploadFile && !youtubeUrl.trim())}
                    className="w-full py-2.5 rounded-lg font-bold text-xs text-black bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-800 disabled:text-zinc-600 cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Publishing Track...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Publish Song to Gana</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Global Library Search panel with full vibe options label */
        <div className="space-y-4">
          <div ref={searchContainerRef} className="relative">
            <form onSubmit={handleSearchGlobal} className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search songs, artists, or keywords... (e.g. Arijit Singh, Kesariya, Diljit)"
                  value={searchQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 transition font-semibold"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-black font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span>Search</span>
              </button>
            </form>

            {/* Google-Style Autocomplete */}
            {showSuggestions && suggestions && (suggestions.queries.length > 0 || suggestions.dbSongs.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950/95 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 animate-fade-in max-h-96 overflow-y-auto">
                {/* Related Google/YouTube Search Words */}
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
                          onClick={() => executeSearch(q)}
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

                {/* Matching Songs from Gana */}
                {suggestions.dbSongs.length > 0 && (
                  <div className="p-2 bg-purple-950/10">
                    <p className="text-[9px] uppercase tracking-wider font-black text-purple-400 px-2 py-1 flex items-center gap-1">
                      <Music size={11} />
                      Matching Songs in Library
                    </p>
                    <div className="space-y-0.5">
                      {suggestions.dbSongs.map((song) => (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => executeSearch(song.title)}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-purple-500/15 flex items-center justify-between transition cursor-pointer font-medium"
                        >
                          <span className="flex items-center gap-2 truncate">
                            <span className="text-sm">{song.moodEmoji}</span>
                            <span className="font-bold text-white truncate">{song.title}</span>
                            <span className="text-zinc-500 text-[10px] truncate">• {song.artist}</span>
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono shrink-0">
                            {song.genre}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Trending Suggestions Bar */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
            <span className="text-zinc-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <TrendingUp size={11} className="text-purple-400" />
              Trending:
            </span>
            {['Kesariya', 'Arijit Singh', 'Tum Hi Ho', 'Taylor Swift', 'Coldplay', 'Toofan KGF', 'Diljit Dosanjh', 'Sanam'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => executeSearch(tag)}
                className="px-2.5 py-0.5 rounded-full bg-zinc-900 hover:bg-purple-900/40 border border-zinc-800 hover:border-purple-500/40 text-zinc-300 hover:text-white transition cursor-pointer text-[10px] font-semibold"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Results grid */}
          {searchResults.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {searchResults.map((track) => (
                <div
                  key={track.trackId}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-900 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={track.artworkUrl100}
                      alt={track.trackName}
                      className="w-10 h-10 rounded-lg object-cover bg-zinc-900 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.trackName}</p>
                      <p className="text-[10px] text-zinc-400 truncate">@{track.artistName}</p>
                      <span className="inline-block px-1.5 py-0.5 mt-0.5 rounded bg-zinc-900 text-zinc-500 text-[8px] font-mono border border-zinc-850">
                        {track.primaryGenreName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Clear Vibe assignment select block */}
                    <select
                      value={selectedSearchMoods[track.trackId] || '🔥'}
                      onChange={(e) =>
                        setSelectedSearchMoods((prev) => ({
                          ...prev,
                          [track.trackId]: e.target.value,
                        }))
                      }
                      className="bg-zinc-900 border border-zinc-850 rounded px-1.5 py-1 text-xs cursor-pointer text-zinc-300 font-bold"
                      title="Choose Vibe"
                    >
                      {moods.map((m) => {
                        const moodText = getMoodName(m.emoji, t);
                        return (
                          <option key={m.emoji} value={m.emoji}>
                            {m.emoji} {moodText}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={() => importGlobalTrack(track)}
                      disabled={loading}
                      className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600 hover:text-black transition cursor-pointer active:scale-95"
                      title="Add to Vibe Feed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} />
          <span>
            {creatorMode === 'record'
              ? t('creator.success')
              : creatorMode === 'upload'
              ? 'Track successfully added to Vibe Feed! Enjoy the full song.'
              : 'Global track imported into Gana feed successfully! Listen below.'}
          </span>
        </div>
      )}
    </div>
  );
}
