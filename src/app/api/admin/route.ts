import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { syncWorldwideCatalog } from '@/lib/seedCatalog';
import { promises as fs } from 'fs';
import path from 'path';

// GET: Fetch all users, singers, songs, and diagnostics for admin maintenance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requester = searchParams.get('requester')?.toLowerCase();

    if (requester !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Main Admin access only.' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const songs = await prisma.song.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const totalLikes = songs.reduce((acc, s) => acc + (s.likesCount || 0), 0);
    const singerCount = users.filter((u) => u.role === 'SINGER').length;
    const listenerCount = users.filter((u) => u.role === 'USER').length;

    return NextResponse.json(
      {
        users,
        songs,
        stats: {
          totalUsers: users.length,
          singerCount,
          listenerCount,
          totalSongs: songs.length,
          totalLikes,
        },
        diagnostics: {
          dbPath: 'MongoDB Atlas Cloud Cluster (gana.mfdw87j.mongodb.net)',
          dbSize: 'Cloud Managed',
          engine: 'Prisma v6 + MongoDB Connector',
          dbStatus: 'Connected & Healthy',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin API GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Admin Actions (Sync catalog, add song, edit song, update user role)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requester = (body.requester || '').toLowerCase();

    if (requester !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access only.' }, { status: 403 });
    }

    const action = body.action;

    // 1. Sync Worldwide Catalog
    if (action === 'sync_catalog') {
      const result = await syncWorldwideCatalog();
      return NextResponse.json({
        message: `Worldwide Catalog Synchronized! Added ${result.addedCount} songs, updated ${result.updatedCount} tracks across ${result.totalArtists} top global singers.`,
        result,
      });
    }

    // 2. Add Song Directly to Database
    if (action === 'add_song') {
      const { title, artist, album, language, genre, moodEmoji, audioUrl, description } = body;
      if (!title || !artist || !audioUrl) {
        return NextResponse.json({ error: 'Title, artist, and audio URL are required' }, { status: 400 });
      }

      const song = await prisma.song.create({
        data: {
          title: title.trim(),
          artist: artist.trim(),
          album: (album || 'Single').trim(),
          language: language || 'English',
          genre: genre || 'Pop',
          moodEmoji: moodEmoji || '🔥',
          audioUrl: audioUrl.trim(),
          creatorUsername: 'admin',
          likesCount: body.likesCount ? Number(body.likesCount) : 100,
          description: description || '',
        },
      });

      return NextResponse.json({ message: 'Song added to database successfully!', song }, { status: 201 });
    }

    // 3. Update Existing Song
    if (action === 'update_song') {
      const { id, title, artist, album, language, genre, moodEmoji, audioUrl, likesCount, description } = body;
      if (!id) {
        return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
      }

      const updatedSong = await prisma.song.update({
        where: { id },
        data: {
          ...(title && { title: title.trim() }),
          ...(artist && { artist: artist.trim() }),
          ...(album && { album: album.trim() }),
          ...(language && { language }),
          ...(genre && { genre }),
          ...(moodEmoji && { moodEmoji }),
          ...(audioUrl && { audioUrl: audioUrl.trim() }),
          ...(likesCount !== undefined && { likesCount: Number(likesCount) }),
          ...(description !== undefined && { description }),
        },
      });

      return NextResponse.json({ message: 'Song updated successfully!', song: updatedSong });
    }

    // 4. Update User Role (Promote/Demote)
    if (action === 'update_user_role') {
      const { userId, role } = body;
      if (!userId || !role) {
        return NextResponse.json({ error: 'User ID and new role are required' }, { status: 400 });
      }

      const validRoles = ['USER', 'SINGER', 'ADMIN'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      return NextResponse.json({ message: `User role updated to ${role}`, user: updatedUser });
    }

    return NextResponse.json({ error: 'Unknown admin action' }, { status: 400 });
  } catch (error) {
    console.error('Admin API POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a user or a song from the database
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requester = searchParams.get('requester')?.toLowerCase();
    const deleteType = searchParams.get('type'); // "user" or "song"
    const targetId = searchParams.get('id');

    if (requester !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!targetId || !deleteType) {
      return NextResponse.json({ error: 'ID and type parameters are required' }, { status: 400 });
    }

    if (deleteType === 'user') {
      const user = await prisma.user.findUnique({ where: { id: targetId } });
      if (user?.username === 'admin') {
        return NextResponse.json({ error: 'Cannot delete the master admin account' }, { status: 400 });
      }

      await prisma.user.delete({ where: { id: targetId } });
      return NextResponse.json({ message: 'User deleted successfully from database' }, { status: 200 });
    } else if (deleteType === 'song') {
      await prisma.song.delete({ where: { id: targetId } });
      return NextResponse.json({ message: 'Song deleted successfully from database' }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Admin API DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
