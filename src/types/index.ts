export interface User {
  id: string;
  username: string;
  email: string;
  isPrivate: boolean;
  role: 'USER' | 'SINGER' | 'ADMIN';
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
  createdAt?: string | Date;
  comments?: Comment[];
  artist: string;
  album: string;
  language: string;
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
