export interface User {
  id: string;
  username: string;
  email: string;
  isPrivate: boolean;
  role: 'USER' | 'SINGER' | 'STORY_WRITER' | 'ADMIN';
  createdAt?: string | Date;
}

export interface Song {
  id: string;
  title: string;
  genre: string;
  moodEmoji: string;
  audioUrl: string;
  creatorUsername: string;
  likesCount: number;
  likedBy?: string[];
  createdAt?: string | Date;
  comments?: Comment[];
  artist: string;
  album: string;
  language: string;
  industry?: string; // 'Bollywood' | 'Hollywood' | 'Tollywood' | 'Kollywood' | 'Punjabi' etc.
  lyrics?: string;
  description: string;
}

export interface Friend {
  id: string;
  username: string;
  isPrivate?: boolean;
  createdAt?: string | Date;
  unreadCount?: number;
  lastMessage?: string | null;
  lastMessageTime?: string | Date | null;
}

export interface SearchUserResult {
  id: string;
  username: string;
  isPrivate?: boolean;
  relationshipStatus: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
}

export interface ChatMessage {
  id: string;
  senderUsername: string;
  receiverUsername: string;
  text: string;
  sharedSongId: string | null;
  isRead?: boolean;
  timestamp: string | Date;
}

export interface Comment {
  id: string;
  text: string;
  username: string;
  songId: string;
  createdAt?: string | Date;
}

export interface GlobalTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  primaryGenreName: string;
  previewUrl: string;
  artworkUrl100: string;
  collectionName?: string;
}

export interface StoryChapter {
  id: string;
  title: string;
  timelineOrder: number;
  audioUrl: string;
  duration?: string | null;
  summary?: string | null;
  authorUsername: string;
  albumId: string;
  likesCount: number;
  dislikesCount: number;
  likedBy?: string[];
  dislikedBy?: string[];
  createdAt?: string | Date;
}

export interface StoryComment {
  id: string;
  text: string;
  username: string;
  albumId: string;
  createdAt?: string | Date;
}

export interface StoryAlbum {
  id: string;
  title: string;
  description: string;
  authorUsername: string;
  genre: string;
  coverUrl?: string | null;
  likesCount: number;
  dislikesCount: number;
  likedBy?: string[];
  dislikedBy?: string[];
  createdAt?: string | Date;
  chapters?: StoryChapter[];
  comments?: StoryComment[];
}
