import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

// POST: Add a new chapter / timeline episode to a Story Album
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let albumId = '';
    let title = '';
    let timelineOrder = 1;
    let duration = '10:00';
    let summary = '';
    let authorUsername = '';
    let audioUrl = '';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      albumId = json.albumId;
      title = json.title;
      timelineOrder = json.timelineOrder ? parseInt(json.timelineOrder, 10) : 1;
      duration = json.duration || '10:00';
      summary = json.summary || '';
      authorUsername = json.authorUsername;
      audioUrl = json.audioUrl || '';
    } else {
      const formData = await request.formData();
      albumId = (formData.get('albumId') as string) || '';
      title = (formData.get('title') as string) || '';
      timelineOrder = parseInt((formData.get('timelineOrder') as string) || '1', 10);
      duration = (formData.get('duration') as string) || '10:00';
      summary = (formData.get('summary') as string) || '';
      authorUsername = (formData.get('authorUsername') as string) || '';

      const audioFile = formData.get('audio') as File | null;
      if (audioFile && audioFile.size > 0) {
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const ext = audioFile.name?.split('.').pop() || 'mp3';
        const fileName = `chapter-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadPath = path.join(uploadDir, fileName);

        await fs.writeFile(uploadPath, buffer);
        audioUrl = `/uploads/${fileName}`;
      } else {
        audioUrl = (formData.get('audioUrl') as string) || '/uploads/fallback-beat.mp3';
      }
    }

    if (!albumId || !title?.trim() || !authorUsername?.trim()) {
      return NextResponse.json({ error: 'Album ID, chapter title, and author are required' }, { status: 400 });
    }

    const album = await prisma.storyAlbum.findUnique({
      where: { id: albumId },
      include: { chapters: true },
    });

    if (!album) {
      return NextResponse.json({ error: 'Story Album not found' }, { status: 404 });
    }

    if (
      authorUsername.toLowerCase() !== album.authorUsername.toLowerCase() &&
      authorUsername.toLowerCase() !== 'admin'
    ) {
      return NextResponse.json({ error: 'Unauthorized to add chapters to this album' }, { status: 403 });
    }

    // Default timeline order to next sequential index if not specified
    const nextOrder = timelineOrder || album.chapters.length + 1;

    const newChapter = await prisma.storyChapter.create({
      data: {
        albumId,
        title: title.trim(),
        timelineOrder: nextOrder,
        audioUrl: audioUrl || '/uploads/fallback-beat.mp3',
        duration,
        summary: summary.trim(),
        authorUsername: authorUsername.toLowerCase().trim(),
      },
    });

    return NextResponse.json({ chapter: newChapter }, { status: 201 });
  } catch (error) {
    console.error('Chapter POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a chapter
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let username = searchParams.get('username');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
        username = body.username;
      } catch {
        // query param
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    const existingChapter = await prisma.storyChapter.findUnique({
      where: { id },
      include: { album: true },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const isBookOwner =
      existingChapter.album &&
      username &&
      username.toLowerCase() === existingChapter.album.authorUsername.toLowerCase();
    const isChapterAuthor =
      username &&
      username.toLowerCase() === existingChapter.authorUsername.toLowerCase();
    const isAdmin = username && username.toLowerCase() === 'admin';

    if (!isBookOwner && !isChapterAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the owner of the story book or chapter author can delete this audio' },
        { status: 403 }
      );
    }

    await prisma.storyChapter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Chapter deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Chapter DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
