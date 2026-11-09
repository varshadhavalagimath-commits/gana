'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Play,
  Pause,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Trash2,
  Edit2,
  Upload,
  Mic,
  Square,
  Clock,
  Calendar,
  Send,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Share2,
  X,
  FileAudio,
} from 'lucide-react';
import { User, StoryAlbum, StoryChapter, StoryComment, Song } from '@/types';
import Avatar from './Avatar';

interface StoryPortalProps {
  currentUser: User | null;
  onPlayTrack: (song: Song) => void;
  currentTrack: Song | null;
  isPlaying: boolean;
}

const STORY_GENRES = [
  'All',
  'Thriller & Mystery',
  'Fantasy & Sci-Fi',
  'Romantic Fiction',
  'Historical Drama',
  'Motivation & Life',
  'Horror & Supernatural',
];

export default function StoryPortal({
  currentUser,
  onPlayTrack,
  currentTrack,
  isPlaying,
}: StoryPortalProps) {
  const [albums, setAlbums] = useState<StoryAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeAlbum, setActiveAlbum] = useState<StoryAlbum | null>(null);

  // Creation & Edit Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<StoryAlbum | null>(null);

  // Form states for Create Album
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumGenre, setAlbumGenre] = useState('Thriller & Mystery');
  const [firstChapterTitle, setFirstChapterTitle] = useState('Chapter 1: The Beginning');
  const [chapterAudioFile, setChapterAudioFile] = useState<File | null>(null);
  const [chapterAudioUrl, setChapterAudioUrl] = useState('');

  // Form states for Add Chapter
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterOrder, setNewChapterOrder] = useState<number>(2);
  const [newChapterSummary, setNewChapterSummary] = useState('');
  const [newChapterFile, setNewChapterFile] = useState<File | null>(null);
  const [newChapterUrl, setNewChapterUrl] = useState('');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isWriter =
    currentUser?.role === 'STORY_WRITER' || currentUser?.role === 'ADMIN';

  // Fetch all story albums
  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const url =
        selectedGenre === 'All'
          ? '/api/stories'
          : `/api/stories?genre=${encodeURIComponent(selectedGenre)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlbums(data.albums || []);
        // Update activeAlbum if it's currently selected
        if (activeAlbum) {
          const updatedActive = (data.albums || []).find((a: StoryAlbum) => a.id === activeAlbum.id);
          if (updatedActive) setActiveAlbum(updatedActive);
        }
      }
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, [selectedGenre]);

  // Handle Play Chapter as a Song
  const handlePlayChapter = (chapter: StoryChapter, album: StoryAlbum) => {
    const chapterAsSong: Song = {
      id: chapter.id,
      title: `${album.title} - ${chapter.title}`,
      genre: `Audio Novel / ${album.genre}`,
      moodEmoji: '📖',
      audioUrl: chapter.audioUrl,
      creatorUsername: chapter.authorUsername,
      likesCount: chapter.likesCount,
      artist: `${chapter.authorUsername} (Author)`,
      album: album.title,
      language: 'Audio Story',
      description: chapter.summary || `Timeline Chapter ${chapter.timelineOrder} of ${album.title}`,
    };
    onPlayTrack(chapterAsSong);
  };

  // Handle Like or Dislike on Album or Chapter
  const handleVote = async (
    targetType: 'album' | 'chapter',
    targetId: string,
    action: 'like' | 'dislike' | 'unlike'
  ) => {
    if (!currentUser) {
      alert('Please sign in to like or react to audio stories!');
      return;
    }

    try {
      const res = await fetch('/api/stories/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          action,
          username: currentUser.username,
        }),
      });

      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error('Reaction error:', err);
    }
  };

  // Handle Create Album
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isWriter) return;
    if (!albumTitle.trim()) {
      setErrorMsg('Please enter a Story / Novel title.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const formData = new FormData();
      formData.append('title', albumTitle.trim());
      formData.append('description', albumDesc.trim());
      formData.append('genre', albumGenre);
      formData.append('authorUsername', currentUser.username);
      formData.append('chapterTitle', firstChapterTitle.trim());

      if (chapterAudioFile) {
        formData.append('audio', chapterAudioFile);
      } else if (chapterAudioUrl.trim()) {
        formData.append('audioUrl', chapterAudioUrl.trim());
      } else {
        formData.append('audioUrl', '/uploads/fallback-beat.mp3');
      }

      const res = await fetch('/api/stories', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create story album');

      setStatusMsg('Story Album created successfully!');
      setShowCreateModal(false);
      setAlbumTitle('');
      setAlbumDesc('');
      setChapterAudioFile(null);
      setChapterAudioUrl('');
      fetchAlbums();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating story album');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Add Chapter
  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activeAlbum) return;
    if (!newChapterTitle.trim()) {
      setErrorMsg('Please enter a chapter title.');
      return;
    }

    setActionLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    try {
      const formData = new FormData();
      formData.append('albumId', activeAlbum.id);
      formData.append('title', newChapterTitle.trim());
      formData.append('timelineOrder', String(newChapterOrder));
      formData.append('summary', newChapterSummary.trim());
      formData.append('authorUsername', currentUser.username);

      if (newChapterFile) {
        formData.append('audio', newChapterFile);
      } else if (newChapterUrl.trim()) {
        formData.append('audioUrl', newChapterUrl.trim());
      } else {
        formData.append('audioUrl', '/uploads/fallback-beat.mp3');
      }

      const res = await fetch('/api/stories/chapters', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add chapter');

      setStatusMsg('New chapter added to timeline!');
      setShowAddChapterModal(false);
      setNewChapterTitle('');
      setNewChapterSummary('');
      setNewChapterFile(null);
      setNewChapterUrl('');
      fetchAlbums();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding chapter');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Chapter
  const handleDeleteChapter = async (chapterId: string) => {
    if (!currentUser || !confirm('Are you sure you want to delete this chapter from your story?')) return;
    try {
      const res = await fetch(
        `/api/stories/chapters?id=${chapterId}&username=${encodeURIComponent(currentUser.username)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error('Delete chapter error:', err);
    }
  };

  // Handle Delete Album
  const handleDeleteAlbum = async (albumId: string) => {
    if (!currentUser || !confirm('Are you sure you want to permanently delete this story album and all its chapters?')) return;
    try {
      const res = await fetch(
        `/api/stories?id=${albumId}&username=${encodeURIComponent(currentUser.username)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setActiveAlbum(null);
        fetchAlbums();
      }
    } catch (err) {
      console.error('Delete album error:', err);
    }
  };

  // Handle Post Comment on Album
  const handlePostComment = async (e: React.FormEvent, albumId: string) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim()) return;

    setCommentLoading(true);
    try {
      const res = await fetch('/api/stories/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId,
          username: currentUser.username,
          text: commentText.trim(),
        }),
      });

      if (res.ok) {
        setCommentText('');
        fetchAlbums();
      }
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(
        `/api/stories/comments?id=${commentId}&username=${encodeURIComponent(currentUser.username)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        fetchAlbums();
      }
    } catch (err) {
      console.error('Delete comment error:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 glow-amber bg-gradient-to-r from-amber-950/40 via-zinc-950 to-purple-950/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Audio Stories & Novels</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  Audiobooks Portal
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Listen to serialized audiobooks, explore chronological chapter timelines, or publish your own novels as a Story Writer.
              </p>
            </div>
          </div>

          {/* Writer / Listener Action Button */}
          {isWriter ? (
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setErrorMsg('');
                setStatusMsg('');
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 shrink-0"
            >
              <Plus size={16} strokeWidth={3} />
              <span>Create Story Album</span>
            </button>
          ) : (
            <div className="text-right">
              <span className="text-[11px] text-zinc-400 font-medium">Signed in as</span>
              <span className="text-xs font-bold text-purple-400 ml-1">
                🎧 Listener (@{currentUser?.username || 'Guest'})
              </span>
            </div>
          )}
        </div>

        {/* Genre Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/80">
          {STORY_GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGenre(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer select-none active:scale-95 border ${
                selectedGenre === g
                  ? 'bg-amber-500 text-black border-amber-400 shadow shadow-amber-500/30 font-extrabold'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:border-amber-500/40 hover:text-white'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Status Alerts */}
      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* DETAIL VIEW: ACTIVE STORY ALBUM WITH TIMELINE CHAPTERS */}
      {activeAlbum ? (
        <div className="space-y-5 animate-fade-in">
          {/* Back Button & Album Header */}
          <div className="p-6 rounded-2xl glass-panel border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveAlbum(null)}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
              >
                <span>← Back to all story albums</span>
              </button>

              {/* Author Actions */}
              {(currentUser?.username === activeAlbum.authorUsername || currentUser?.role === 'ADMIN') && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewChapterOrder((activeAlbum.chapters?.length || 0) + 1);
                      setShowAddChapterModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>Add Chapter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteAlbum(activeAlbum.id)}
                    className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-900/40 text-zinc-400 hover:text-red-400 transition cursor-pointer border border-zinc-800"
                    title="Delete entire novel album"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  {activeAlbum.genre}
                </span>
                <h1 className="text-2xl font-black text-white">{activeAlbum.title}</h1>
                <p className="text-xs text-purple-300 font-bold flex items-center gap-1.5">
                  <span>Author:</span>
                  <Avatar username={activeAlbum.authorUsername} size={18} />
                  <span>@{activeAlbum.authorUsername}</span>
                </p>
                {activeAlbum.description && (
                  <p className="text-xs text-zinc-300 leading-relaxed max-w-3xl">
                    {activeAlbum.description}
                  </p>
                )}
              </div>

              {/* Album Likes & Dislikes Reaction Controls */}
              <div className="flex items-center gap-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const isLiked = activeAlbum.likedBy?.includes(currentUser?.username || '');
                    handleVote('album', activeAlbum.id, isLiked ? 'unlike' : 'like');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeAlbum.likedBy?.includes(currentUser?.username || '')
                      ? 'bg-amber-500 text-black'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                  title="Like this story album"
                >
                  <ThumbsUp size={14} />
                  <span>{activeAlbum.likesCount}</span>
                </button>

                <div className="h-4 w-px bg-zinc-800" />

                <button
                  type="button"
                  onClick={() => {
                    const isDisliked = activeAlbum.dislikedBy?.includes(currentUser?.username || '');
                    handleVote('album', activeAlbum.id, isDisliked ? 'unlike' : 'dislike');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeAlbum.dislikedBy?.includes(currentUser?.username || '')
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                  title="Dislike this story album"
                >
                  <ThumbsDown size={14} />
                  <span>{activeAlbum.dislikesCount}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TIMELINE CHAPTERS LIST */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 px-1">
              <span>Timeline Chapters</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono">
                {activeAlbum.chapters?.length || 0} Episodes
              </span>
            </h3>

            {(!activeAlbum.chapters || activeAlbum.chapters.length === 0) ? (
              <div className="p-8 text-center glass-panel rounded-2xl border border-zinc-850 space-y-2">
                <p className="text-xs font-bold text-zinc-400">No chapters uploaded in this timeline yet.</p>
                {isWriter && (
                  <p className="text-[11px] text-zinc-500">
                    Click &ldquo;Add Chapter&rdquo; above to upload Episode 1 audio.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAlbum.chapters.map((chapter) => {
                  const isCurrentChapterPlaying =
                    currentTrack?.id === chapter.id && isPlaying;
                  const isChapterLiked = chapter.likedBy?.includes(currentUser?.username || '');
                  const isChapterDisliked = chapter.dislikedBy?.includes(currentUser?.username || '');

                  return (
                    <div
                      key={chapter.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrentChapterPlaying
                          ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-950/70 border-zinc-850 hover:border-zinc-700'
                      }`}
                    >
                      {/* Left: Play button, Timeline Order Badge, Title */}
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handlePlayChapter(chapter, activeAlbum)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 shadow active:scale-95 ${
                            isCurrentChapterPlaying
                              ? 'bg-amber-500 text-black animate-pulse'
                              : 'bg-zinc-900 hover:bg-amber-500 text-zinc-200 hover:text-black border border-zinc-800'
                          }`}
                          title={isCurrentChapterPlaying ? 'Pause story' : 'Play chapter'}
                        >
                          {isCurrentChapterPlaying ? <Pause size={18} /> : <Play size={18} className="fill-current ml-0.5" />}
                        </button>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Part {chapter.timelineOrder}
                            </span>
                            <h4 className="text-sm font-bold text-white truncate" title={chapter.title}>
                              {chapter.title}
                            </h4>
                          </div>
                          {chapter.summary && (
                            <p className="text-xs text-zinc-400 line-clamp-1">{chapter.summary}</p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono">
                            <span>⏱️ {chapter.duration || '10:00'}</span>
                            <span>📅 {new Date(chapter.createdAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Chapter Votes & Author Delete */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Chapter Like / Dislike */}
                        <div className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                          <button
                            type="button"
                            onClick={() => handleVote('chapter', chapter.id, isChapterLiked ? 'unlike' : 'like')}
                            className={`p-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                              isChapterLiked ? 'text-amber-400' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Like this chapter"
                          >
                            <ThumbsUp size={12} className={isChapterLiked ? 'fill-amber-400' : ''} />
                            <span>{chapter.likesCount}</span>
                          </button>

                          <div className="h-3 w-px bg-zinc-800 mx-0.5" />

                          <button
                            type="button"
                            onClick={() => handleVote('chapter', chapter.id, isChapterDisliked ? 'unlike' : 'dislike')}
                            className={`p-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                              isChapterDisliked ? 'text-red-400' : 'text-zinc-400 hover:text-white'
                            }`}
                            title="Dislike this chapter"
                          >
                            <ThumbsDown size={12} className={isChapterDisliked ? 'fill-red-400' : ''} />
                            <span>{chapter.dislikesCount}</span>
                          </button>
                        </div>

                        {/* Author delete chapter button */}
                        {(currentUser?.username === chapter.authorUsername || currentUser?.role === 'ADMIN') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteChapter(chapter.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900 transition cursor-pointer"
                            title="Delete this chapter"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* COMMENTS ON STORY ALBUM */}
          <div className="p-6 rounded-2xl glass-panel border border-zinc-850 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-amber-400" />
              <span>Listener Comments & Discussions ({activeAlbum.comments?.length || 0})</span>
            </h3>

            {/* Post Comment Input */}
            <form onSubmit={(e) => handlePostComment(e, activeAlbum.id)} className="flex gap-2">
              <input
                type="text"
                placeholder={currentUser ? 'Write your review or thought on this novel...' : 'Sign in to leave a comment'}
                disabled={!currentUser || commentLoading}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 font-medium"
              />
              <button
                type="submit"
                disabled={!currentUser || !commentText.trim() || commentLoading}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                {commentLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Comment</span>
              </button>
            </form>

            {/* Comment List with Delete Option */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {(!activeAlbum.comments || activeAlbum.comments.length === 0) ? (
                <p className="text-xs text-zinc-500 italic py-2">No comments yet. Share your thoughts on this story!</p>
              ) : (
                activeAlbum.comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-zinc-950/70 border border-zinc-850 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Avatar username={c.username} size={24} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-400 text-xs">@{c.username}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(c.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-200 text-xs mt-1 leading-relaxed">{c.text}</p>
                      </div>
                    </div>

                    {/* Delete Comment Option (Comment author or Admin) */}
                    {(currentUser?.username === c.username || currentUser?.role === 'ADMIN') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition cursor-pointer"
                        title="Delete your comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* GRID VIEW: ALL STORY ALBUMS */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
            <span>Showing {albums.length} Audio Story Albums</span>
          </div>

          {loading ? (
            <div className="p-12 text-center flex items-center justify-center gap-2 text-zinc-400 text-xs font-bold">
              <Loader2 size={16} className="animate-spin text-amber-400" />
              <span>Loading audio stories...</span>
            </div>
          ) : albums.length === 0 ? (
            <div className="p-12 text-center rounded-2xl glass-panel border border-zinc-850 space-y-3">
              <BookOpen size={36} className="text-amber-400/50 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">No story albums published yet in this category.</p>
              {isWriter ? (
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow cursor-pointer transition"
                >
                  Create First Story Album
                </button>
              ) : (
                <p className="text-xs text-zinc-500">
                  Switch to a different genre above or check back soon for new audio novels!
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((album) => {
                const chapterCount = album.chapters?.length || 0;
                return (
                  <div
                    key={album.id}
                    className="p-5 rounded-2xl glass-panel border border-zinc-850 hover:border-amber-500/40 transition flex flex-col justify-between gap-4 group hover:shadow-xl hover:shadow-amber-500/5"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                          {album.genre}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {chapterCount} {chapterCount === 1 ? 'Chapter' : 'Chapters'}
                        </span>
                      </div>

                      <h3
                        onClick={() => setActiveAlbum(album)}
                        className="text-base font-black text-white hover:text-amber-400 transition cursor-pointer line-clamp-1"
                        title={album.title}
                      >
                        {album.title}
                      </h3>

                      <p className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                        <span>By @{album.authorUsername}</span>
                      </p>

                      {album.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {album.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-3 border-t border-zinc-850 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-zinc-400 font-bold text-xs">
                        <span className="flex items-center gap-1">
                          <ThumbsUp size={12} className="text-amber-400" />
                          <span>{album.likesCount}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={12} className="text-cyan-400" />
                          <span>{album.comments?.length || 0}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveAlbum(album)}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-extrabold text-xs transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Listen Story</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE STORY ALBUM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen size={18} className="text-amber-400" />
                <span>Publish New Story / Novel Album</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Story / Novel Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Chronicles of Aethelgard"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Genre</label>
                <select
                  value={albumGenre}
                  onChange={(e) => setAlbumGenre(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {STORY_GENRES.filter((g) => g !== 'All').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Story Synopsis / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Write a captivating summary for your listeners..."
                  value={albumDesc}
                  onChange={(e) => setAlbumDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* First Chapter Inputs */}
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2.5">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FileAudio size={14} />
                  <span>Chapter 1 (Opening Episode)</span>
                </p>
                <input
                  type="text"
                  placeholder="Chapter Title (e.g. Chapter 1: The Beginning)"
                  value={firstChapterTitle}
                  onChange={(e) => setFirstChapterTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />

                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold block mb-1">
                    Upload Chapter Audio File (MP3, WAV, OGG)
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setChapterAudioFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
                <span>Publish Story Album</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CHAPTER TO TIMELINE */}
      {showAddChapterModal && activeAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-zinc-950 border border-purple-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus size={18} className="text-purple-400" />
                <span>Add Next Episode to &ldquo;{activeAlbum.title}&rdquo;</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChapterModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddChapter} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Chapter Title *</label>
                <input
                  type="text"
                  required
                  placeholder={`Chapter ${newChapterOrder}: Title`}
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Timeline Order #</label>
                <input
                  type="number"
                  min={1}
                  value={newChapterOrder}
                  onChange={(e) => setNewChapterOrder(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Episode Summary (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Short note about what happens in this chapter..."
                  value={newChapterSummary}
                  onChange={(e) => setNewChapterSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Audio File (MP3, WAV, OGG)</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setNewChapterFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-black hover:file:bg-purple-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-black font-extrabold text-xs rounded-xl shadow transition cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                <span>Add Chapter to Timeline</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
