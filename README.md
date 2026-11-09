Gana – Social Music Streaming & Audio Novel Platform

Project Overview

Gana is a full-stack social music streaming and audio storytelling platform that brings music discovery, audio novel publishing, vocal recording, and social networking together in one application.

The platform enables listeners to discover music, singers to upload or record original tracks, and writers to publish episodic audio novels. It also provides interactive community features, direct messaging, and an integrated music player.

Key Features

 Music Discovery & Streaming
- Explore music across Bollywood, Tollywood, Hollywood, Kollywood, Punjabi, Sandalwood, and Mollywood.
- Search songs by title, artist, genre, and lyrics.
- Dynamic industry-based Top 5 trending charts.
- Integrated music player with autoplay and next-track functionality.
- Like, unlike, and comment on songs.

 In-Browser Vocal Studio
- Record vocals and melodies directly through the browser microphone.
- Upload MP3 and WAV audio files.
- Search and attach verified lyrics using LRCLIB API.
- Playback support through HTML5 Audio and YouTube IFrame integration.

 Audio Stories & Novels
- Create and publish audio story albums.
- Organize stories into chronological chapters.
- Add descriptions, summaries, and genre categories.
- Support likes, dislikes, and community comments.
- Integrated playback for audio chapters.

 Social Networking & Chat
- Send, accept, and reject friend requests.
- Direct messaging with unread message indicators.
- Share interactive song cards through chat.
- Public and private profile controls.

 Smart Playback Experience
- Persistent bottom music player.
- Audio playback using HTML5 Audio.
- YouTube-based playback integration.
- Automatic next-track playback through a queue system.

 Technology Stack

| Category | Technologies |

| Frontend | Next.js 16, React 19 |
| Programming Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Backend | Next.js API Route Handlers |
| Database | MongoDB Atlas |
| ORM | Prisma ORM |
| Audio Recording | MediaRecorder API |
| Audio Playback | HTML5 Audio, YouTube IFrame |
| External APIs | LRCLIB, Apple/iTunes Search API |
| Icons | Lucide React |

System Architecture

The application follows a full-stack architecture:

1. Frontend Layer:Next.js and React provide the interactive user interface.
2. API Layer: Next.js API routes handle authentication, songs, stories, friends, chat, and administrative operations.
3. Database Layer: Prisma ORM manages application data stored in MongoDB Atlas.
4. External Integration Layer: LRCLIB and Apple/iTunes provide lyrics and music catalog information.
5. Media Layer: HTML5 Audio, MediaRecorder, and YouTube IFrame support recording and playback.

 Main API Modules

- `/api/auth` – User registration and authentication.
- `/api/songs` – Song retrieval and publishing.
- `/api/songs/lyrics` – Lyrics search and management.
- `/api/songs/comments` – Song comments.
- `/api/stories` – Audio story management.
- `/api/stories/chapters` – Chapter management.
- `/api/friends` – Friend request management.
- `/api/chat` – Direct messaging.
- `/api/user/privacy` – Profile privacy management.
- `/api/admin` – Administrative operations.

Database Models

The Prisma schema includes core entities such as:

- User
- Song
- StoryAlbum
- StoryChapter
- Comment
- ChatMessage

These models support user profiles, music publishing, story management, community interactions, and messaging.

Project Highlights

- Combines music streaming, audio storytelling, and social networking in one platform.
- Supports independent singers and story writers.
- Provides regional music industry-based discovery.
- Enables browser-based vocal recording without requiring separate recording software.
- Integrates lyrics search and interactive song sharing.
- Provides a unified playback experience for music and audio stories.

Project Objective

To develop an integrated audio entertainment ecosystem where users can discover music, create original audio content, publish serialized stories, and connect with other creators and listeners through social interaction.
