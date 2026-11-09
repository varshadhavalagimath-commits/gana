'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { getMoodName } from '@/lib/moods';
import { Play, Pause, Volume2, VolumeX, Share2, Heart, Music, SkipBack, SkipForward } from 'lucide-react';
import { Song } from '@/types';
import Avatar from './Avatar';

interface BottomPlayerProps {
  currentTrack: Song | null;
  isPlaying: boolean;
  onPlayPauseToggle: (playing: boolean) => void;
  onLikeToggle: (songId: string) => void;
  onNextTrack?: () => void;
  onPreviousTrack?: () => void;
}

export default function BottomPlayer({
  currentTrack,
  isPlaying,
  onPlayPauseToggle,
  onLikeToggle,
  onNextTrack,
  onPreviousTrack,
}: BottomPlayerProps) {
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const lastTrackIdRef = useRef<string | null>(null);
  const lastAudioUrlRef = useRef<string | null>(null);
  const lastPreviewCheckTrackIdRef = useRef<string | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upgradedYoutubeUrl, setUpgradedYoutubeUrl] = useState<string | null>(null);

  // Automatically upgrade 30s preview tracks (like Apple/iTunes) to full YouTube streams
  useEffect(() => {
    if (!currentTrack) {
      setUpgradedYoutubeUrl(null);
      return;
    }

    // Avoid clearing or re-checking if the track has not changed
    if (lastPreviewCheckTrackIdRef.current === currentTrack.id) {
      return;
    }
    lastPreviewCheckTrackIdRef.current = currentTrack.id;
    setUpgradedYoutubeUrl(null);

    if (
      currentTrack.audioUrl.includes('itunes.apple.com') ||
      currentTrack.audioUrl.includes('apple.com') ||
      currentTrack.audioUrl.endsWith('.m4a')
    ) {
      const cleanTitle = currentTrack.title.split(' - ')[0] || currentTrack.title;
      const artist = currentTrack.artist || '';
      fetch(`/api/songs/youtube-search?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(artist)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.videoId) {
            setUpgradedYoutubeUrl(`youtube:${data.videoId}`);
            if (data.duration && data.duration > 0) {
              setDuration(data.duration);
            }
          }
        })
        .catch((err) => console.warn('Could not auto-upgrade preview track to full song:', err));
    } else if (currentTrack.audioUrl.startsWith('youtube:')) {
      // Stream is YouTube: fetch authentic duration from metadata if available
      const cleanTitle = currentTrack.title.split(' - ')[0] || currentTrack.title;
      const artist = currentTrack.artist || '';
      fetch(`/api/songs/youtube-search?title=${encodeURIComponent(cleanTitle)}&artist=${encodeURIComponent(artist)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.duration && data.duration > 0) {
            setDuration(data.duration);
          }
        })
        .catch(() => {});
    }
  }, [currentTrack?.id]);

  // Determine effective audio URL and streaming mode
  const effectiveAudioUrl = upgradedYoutubeUrl || currentTrack?.audioUrl || '';
  const isYoutube = effectiveAudioUrl.startsWith('youtube:');
  const youtubeVideoId = isYoutube ? effectiveAudioUrl.replace('youtube:', '').trim() : '';

  // Trigger next track when a song completes
  const handleAudioEnded = () => {
    if (onNextTrack) {
      onNextTrack(); // Automatically play next song in feed!
    } else {
      onPlayPauseToggle(false);
      setCurrentTime(0);
    }
  };

  // Unified audio playback controller (prevents looping restarts on re-renders)
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isYoutube) {
      audioRef.current.pause();
      return;
    }

    // Only reload source and reset time if track or source URL actually changed
    const isNewTrack =
      lastTrackIdRef.current !== currentTrack.id ||
      lastAudioUrlRef.current !== effectiveAudioUrl;

    if (isNewTrack && effectiveAudioUrl) {
      lastTrackIdRef.current = currentTrack.id;
      lastAudioUrlRef.current = effectiveAudioUrl;
      audioRef.current.src = effectiveAudioUrl;
      audioRef.current.load();
      setCurrentTime(0);
      setDuration(0);
    }

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn('Audio play request interrupted/prevented:', err);
      });
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack?.id, effectiveAudioUrl, isYoutube, isPlaying]);

  // Synchronize play/pause with YouTube iframe via postMessage without remounting
  useEffect(() => {
    if (!isYoutube || !iframeRef.current?.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: isPlaying ? 'playVideo' : 'pauseVideo',
          args: [],
        }),
        '*'
      );
    } catch {
      // Ignore cross-origin errors
    }
  }, [isPlaying, isYoutube]);

  // Custom elapsed-time ticker for YouTube video plays (Advances to next song when finished!)
  useEffect(() => {
    if (!currentTrack || !isYoutube || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        // When song reaches authentic original duration, automatically play next song!
        if (duration > 0 && next >= duration) {
          handleAudioEnded();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, isYoutube, duration]);

  // Synchronize playback with System Media Session (mobile background control)
  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;

    try {
      const creatorName = currentTrack.creatorUsername === 'global_library' ? 'Global Catalog' : `@${currentTrack.creatorUsername}`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: creatorName,
        album: 'Gana Music',
        artwork: [
          {
            src: 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=256&h=256&fit=crop',
            sizes: '256x256',
            type: 'image/jpeg'
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        onPlayPauseToggle(true);
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        onPlayPauseToggle(false);
      });
      if (onNextTrack) {
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          onNextTrack();
        });
      }
      if (onPreviousTrack) {
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          onPreviousTrack();
        });
      }
    } catch (error) {
      console.error('MediaSession API error:', error);
    }
  }, [currentTrack, onPlayPauseToggle, onNextTrack, onPreviousTrack]);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying, currentTrack]);

  // Synchronize exact authentic duration and auto-play next track when YouTube video ends
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        if (data && data.event === 'infoDelivery' && data.info) {
          // Sync exact real YouTube video duration (matching audio file size/time)
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setDuration(Math.round(data.info.duration));
          }
          if (typeof data.info.currentTime === 'number') {
            setCurrentTime(Math.round(data.info.currentTime));
          }
          // Player state 0 = ENDED: automatically play next song!
          if (data.info.playerState === 0) {
            handleAudioEnded();
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNextTrack, onPlayPauseToggle]);

  // Audio Events for HTML5 <audio>
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
      setDuration(Math.round(audioRef.current.duration));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (isYoutube) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [val, true] }),
          '*'
        );
      }
    } else if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handlePrevious = () => {
    if (currentTime > 3) {
      if (isYoutube) {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
            '*'
          );
        }
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
    } else if (onPreviousTrack) {
      onPreviousTrack();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (audioRef.current) {
      audioRef.current.muted = nextMute;
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    onPlayPauseToggle(!isPlaying);
  };

  // Canvas waveform visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numBars = 40;
      const barWidth = canvas.width / numBars - 2;
      const midY = canvas.height / 2;

      ctx.fillStyle = 'rgba(168, 85, 247, 0.45)'; 
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';

      for (let i = 0; i < numBars; i++) {
        let amplitude = 0;
        if (isPlaying) {
          amplitude = Math.sin(i * 0.15 + phase) * Math.cos(i * 0.05 + phase * 0.5) * (canvas.height * 0.4);
          amplitude += Math.sin(i * 0.8 + phase * 2) * (canvas.height * 0.1);
          amplitude = Math.abs(amplitude);
        } else {
          amplitude = 2 + Math.sin(i * 0.3) * 1.5;
        }

        const x = i * (barWidth + 2);
        const y = midY - amplitude / 2;
        
        const grad = ctx.createLinearGradient(0, y, 0, y + amplitude);
        grad.addColorStop(0, '#a855f7'); 
        grad.addColorStop(1, '#06b6d4'); 
        
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, Math.max(2, amplitude));
      }

      phase += 0.07;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Copy shareable song link to clipboard
  const handleCopyLink = () => {
    if (!currentTrack) return;
    const shareUrl = `${window.location.origin}/?play=${currentTrack.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 border-t border-zinc-900 px-6 py-4 glass-panel flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={handleLoadedMetadata}
        onCanPlay={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
        {currentTrack ? (
          isYoutube ? (
            /* Mini Video player thumbnail (bypasses browser autoplay blocks!) */
            <div className="w-16 h-10 rounded overflow-hidden shrink-0 bg-black border border-zinc-800 flex items-center justify-center relative shadow-md shadow-black/40">
              <iframe
                ref={iframeRef}
                key={youtubeVideoId}
                src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&enablejsapi=1&origin=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}&widget_referrer=${typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : ''}&playsinline=1`}
                allow="autoplay; encrypted-media"
                className="w-full h-full border-0 absolute inset-0"
                onLoad={() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    JSON.stringify({ event: 'listening' }),
                    '*'
                  );
                }}
              />
            </div>
          ) : (
            <Avatar username={currentTrack.creatorUsername} size={40} />
          )
        ) : (
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full">
            <Music size={18} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {currentTrack ? (
            <>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base">{currentTrack.moodEmoji}</span>
                {getMoodName(currentTrack.moodEmoji, t) && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/25">
                    {getMoodName(currentTrack.moodEmoji, t)}
                  </span>
                )}
                <h4 className="text-sm font-bold text-white truncate leading-none">{currentTrack.title}</h4>
                {isYoutube ? (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Full Song
                  </span>
                ) : currentTrack.genre?.includes('Audio Novel') ? (
                  <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Audio Story
                  </span>
                ) : null}
              </div>
              <p className="text-[10px] text-zinc-300 font-extrabold truncate mt-0.5 leading-none">
                {currentTrack.genre?.includes('Audio Novel') || currentTrack.language === 'Audio Story'
                  ? `Author: ${currentTrack.artist?.replace(' (Author)', '') || currentTrack.creatorUsername} • Story: ${currentTrack.album || 'Novel'}`
                  : `Singer: ${currentTrack.artist || 'Unknown Singer'} • Album: ${currentTrack.album || 'Single'}`}
              </p>
              <p className="text-[9px] text-zinc-450 truncate mt-1 leading-none">
                By: {currentTrack.creatorUsername === 'global_library' ? 'Global Catalog' : `@${currentTrack.creatorUsername}`} • {currentTrack.genre}
              </p>
            </>
          ) : (
            <p className="text-xs text-zinc-500">{t('player.not_playing')}</p>
          )}
        </div>
      </div>

      {/* Player Controls & Scrubber */}
      <div className="flex flex-col items-center gap-2 w-full md:w-2/4">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={!currentTrack}
            className="p-2 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
            title="Previous Track"
          >
            <SkipBack size={18} />
          </button>

          <button
            disabled={!currentTrack}
            onClick={handlePlayPause}
            className="p-3 bg-purple-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-black hover:bg-purple-400 hover:scale-105 active:scale-95 transition rounded-full cursor-pointer disabled:cursor-not-allowed shadow-md shadow-purple-500/20"
          >
            {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" />}
          </button>

          <button
            onClick={onNextTrack}
            disabled={!onNextTrack || !currentTrack}
            className="p-2 text-zinc-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90"
            title="Next Track (Autoplay)"
          >
            <SkipForward size={18} />
          </button>
        </div>

        {/* Progress Bar scrubber */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={!currentTrack}
            className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-[10px] font-mono text-zinc-500 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Visualizer Canvas, Volume & Extra controls */}
      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-1/4">
        <canvas
          ref={canvasRef}
          width={120}
          height={32}
          className="bg-transparent opacity-80 h-8 hidden sm:block"
        />

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} disabled={!currentTrack} className="text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50">
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            disabled={!currentTrack}
            className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 border-l border-zinc-850 pl-4">
          <button
            onClick={() => currentTrack && onLikeToggle(currentTrack.id)}
            disabled={!currentTrack}
            className="p-1.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-red-500 transition disabled:opacity-50 cursor-pointer"
          >
            <Heart size={16} className={currentTrack && currentTrack.likesCount > 0 ? 'fill-red-500 text-red-500' : ''} />
          </button>
          
          <button
            onClick={handleCopyLink}
            disabled={!currentTrack}
            className="p-1.5 rounded hover:bg-zinc-900 text-zinc-400 hover:text-cyan-400 transition disabled:opacity-50 cursor-pointer relative"
          >
            <Share2 size={16} />
            {copied && (
              <span className="absolute bottom-8 right-0 bg-cyan-600 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                Copied!
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
