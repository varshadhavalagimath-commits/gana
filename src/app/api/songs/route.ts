import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

// GET: Fetch all songs, optionally filtered by mood, language, industry, and query
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moodEmoji = searchParams.get('moodEmoji');
    const language = searchParams.get('language');
    const industry = searchParams.get('industry');
    const q = searchParams.get('q');

    const whereClause: Record<string, any> = {};
    if (moodEmoji) {
      whereClause.moodEmoji = moodEmoji;
    }
    if (language && language !== 'All') {
      whereClause.language = language;
    }
    if (industry && industry !== 'All') {
      whereClause.industry = industry;
    }
    if (q) {
      whereClause.OR = [
        { title: { contains: q } },
        { artist: { contains: q } },
        { album: { contains: q } },
        { lyrics: { contains: q } },
      ];
    }

    const songs = await prisma.song.findMany({
      where: whereClause,
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ songs }, { status: 200 });
  } catch (error) {
    console.error('Songs GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Upload recorded audio or create song entry with lyrics & industry
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let title = '';
    let genre = '';
    let moodEmoji = '🔥';
    let creatorUsername = '';
    let audioUrl = '';
    let artist = 'Unknown Singer';
    let album = 'Single';
    let language = 'English';
    let industry = 'Bollywood';
    let lyrics = '';
    let description = '';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      title = json.title;
      genre = json.genre || 'Pop';
      moodEmoji = json.moodEmoji || '🔥';
      creatorUsername = json.creatorUsername || 'admin';
      audioUrl = json.audioUrl || '/uploads/fallback-beat.mp3';
      artist = json.artist || 'Unknown Singer';
      album = json.album || 'Single';
      language = json.language || 'English';
      industry = json.industry || 'Bollywood';
      lyrics = json.lyrics || '';
      description = json.description || '';
    } else {
      const formData = await request.formData();
      title = (formData.get('title') as string) || '';
      genre = (formData.get('genre') as string) || 'Pop';
      moodEmoji = (formData.get('moodEmoji') as string) || '🔥';
      creatorUsername = (formData.get('creatorUsername') as string) || 'admin';
      artist = (formData.get('artist') as string | null) || 'Unknown Singer';
      album = (formData.get('album') as string | null) || 'Single';
      language = (formData.get('language') as string | null) || 'English';
      industry = (formData.get('industry') as string | null) || 'Bollywood';
      lyrics = (formData.get('lyrics') as string | null) || '';
      description = (formData.get('description') as string | null) || '';

      const audioFile = formData.get('audio') as File | null;
      if (audioFile && audioFile.size > 0) {
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const fileExtension = audioFile.name?.split('.').pop() || 'webm';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
        const uploadPath = path.join(uploadDir, fileName);

        await fs.writeFile(uploadPath, buffer);
        audioUrl = `/uploads/${fileName}`;
      } else {
        const importedUrl = formData.get('audioUrl') as string | null;
        audioUrl = importedUrl || '/uploads/fallback-beat.mp3';
      }
    }

    if (!title || !genre || !creatorUsername) {
      return NextResponse.json({ error: 'Title, genre, and creator username are required' }, { status: 400 });
    }

    // Save song record to database
    const newSong = await prisma.song.create({
      data: {
        title: title.trim(),
        genre: genre.trim(),
        moodEmoji,
        audioUrl,
        creatorUsername: creatorUsername.toLowerCase().trim(),
        likesCount: 0,
        likedBy: [],
        artist: artist.trim(),
        album: album.trim(),
        language: language.trim(),
        industry: industry.trim(),
        lyrics: lyrics.trim(),
        description: description.trim(),
      },
    });

    return NextResponse.json({ song: newSong, message: 'Song saved successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Songs POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('id');
    const username = searchParams.get('username')?.toLowerCase();

    if (!songId || !username) {
      return NextResponse.json({ error: 'Song ID and username are required' }, { status: 400 });
    }

    const song = await prisma.song.findUnique({
      where: { id: songId },
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    // Allow deletion by the creator, admin, or for any searched/community track
    const isCreatorOrAdmin =
      song.creatorUsername === username ||
      username === 'admin' ||
      song.creatorUsername === 'searched' ||
      song.creatorUsername === 'trending' ||
      song.creatorUsername === 'listener';

    if (!isCreatorOrAdmin && username) {
      // Logged-in user deleting a track from library
      await prisma.song.delete({
        where: { id: songId },
      });
      return NextResponse.json({ message: 'Song deleted successfully' }, { status: 200 });
    }

    await prisma.song.delete({
      where: { id: songId },
    });

    return NextResponse.json({ message: 'Song deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Songs DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
