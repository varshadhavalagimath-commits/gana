import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';

// GET: Fetch all Story Albums with chapters and comments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const author = searchParams.get('author');

    const where: any = {};
    if (genre && genre !== 'All') {
      where.genre = genre;
    }
    if (author) {
      where.authorUsername = author.toLowerCase().trim();
    }

    let albums = await prisma.storyAlbum.findMany({
      where,
      include: {
        chapters: {
          orderBy: { timelineOrder: 'asc' },
        },
        comments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (albums.length === 0 && (!genre || genre === 'All') && !author) {
      try {
        const seedAlbum1 = await prisma.storyAlbum.create({
          data: {
            title: 'Shadows of Neo-Varanasi',
            description: 'An atmospheric cyberpunk noir novel following Detective Vance as he uncovers vanishing auditory memories across neon-lit ghats.',
            authorUsername: 'storyteller_aarav',
            genre: 'Thriller & Mystery',
            likesCount: 32,
            likedBy: ['admin'],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: The Midnight Frequency',
                  timelineOrder: 1,
                  summary: 'An encrypted radio transmission arrives at 3 AM carrying a melody that was supposedly banned half a century ago.',
                  audioUrl: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
                  duration: '3:30',
                  authorUsername: 'storyteller_aarav',
                  likesCount: 22,
                  likedBy: ['admin'],
                },
                {
                  title: 'Chapter 2: Whispers Beneath the Rain',
                  timelineOrder: 2,
                  summary: 'Deep inside District 9, Vance questions a rogue cyber-monk regarding the disappearing music archives.',
                  audioUrl: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
                  duration: '4:10',
                  authorUsername: 'storyteller_aarav',
                  likesCount: 15,
                  likedBy: [],
                },
              ],
            },
            comments: {
              create: [
                {
                  username: 'admin',
                  text: 'The voice acting and ambient score in Chapter 1 are phenomenal! Looking forward to Chapter 3.',
                },
              ],
            },
          },
          include: {
            chapters: { orderBy: { timelineOrder: 'asc' } },
            comments: { orderBy: { createdAt: 'desc' } },
          },
        });

        const seedAlbum2 = await prisma.storyAlbum.create({
          data: {
            title: 'Chronicles of the Celestial Kingdom',
            description: 'An epic high-fantasy audio drama chronicling the quest for the sacred chime that holds reality together.',
            authorUsername: 'celestial_scribe',
            genre: 'Fantasy & Sci-Fi',
            likesCount: 45,
            likedBy: [],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: Resonance of the Ancients',
                  timelineOrder: 1,
                  summary: 'Princess Ananya hears the celestial chime call her name across the crystal mountains.',
                  audioUrl: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
                  duration: '4:50',
                  authorUsername: 'celestial_scribe',
                  likesCount: 31,
                  likedBy: [],
                },
              ],
            },
            comments: {
              create: [
                {
                  username: 'listener_riya',
                  text: 'Immersive world building. Loved every second of the narration!',
                },
              ],
            },
          },
          include: {
            chapters: { orderBy: { timelineOrder: 'asc' } },
            comments: { orderBy: { createdAt: 'desc' } },
          },
        });

        albums = [seedAlbum1, seedAlbum2];
      } catch (seedErr) {
        console.warn('Story seeding skipped:', seedErr);
      }
    }

    return NextResponse.json({ albums }, { status: 200 });
  } catch (error) {
    console.error('Story Albums GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new Story Album
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let title = '';
    let description = '';
    let authorUsername = '';
    let genre = 'Fiction';
    let initialChapterTitle = '';
    let audioUrl = '';

    if (contentType.includes('application/json')) {
      const json = await request.json();
      title = json.title;
      description = json.description || '';
      authorUsername = json.authorUsername;
      genre = json.genre || 'Fiction';
      initialChapterTitle = json.chapterTitle || 'Chapter 1: The Beginning';
      audioUrl = json.audioUrl || '';
    } else {
      const formData = await request.formData();
      title = (formData.get('title') as string) || '';
      description = (formData.get('description') as string) || '';
      authorUsername = (formData.get('authorUsername') as string) || '';
      genre = (formData.get('genre') as string) || 'Fiction';
      initialChapterTitle = (formData.get('chapterTitle') as string) || 'Chapter 1: The Beginning';

      const audioFile = formData.get('audio') as File | null;
      if (audioFile && audioFile.size > 0) {
        const bytes = await audioFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const ext = audioFile.name?.split('.').pop() || 'mp3';
        const fileName = `story-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
        const uploadPath = path.join(uploadDir, fileName);

        await fs.writeFile(uploadPath, buffer);
        audioUrl = `/uploads/${fileName}`;
      } else {
        audioUrl = (formData.get('audioUrl') as string) || '/uploads/fallback-beat.mp3';
      }
    }

    if (!title?.trim() || !authorUsername?.trim()) {
      return NextResponse.json({ error: 'Story title and author username are required' }, { status: 400 });
    }

    // Verify author role if user exists
    const authorUser = await prisma.user.findUnique({
      where: { username: authorUsername.toLowerCase().trim() },
    });

    if (authorUser && authorUser.role !== 'STORY_WRITER' && authorUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only registered Story Writers can create and publish audio novels' },
        { status: 403 }
      );
    }

    // Create Story Album
    const newAlbum = await prisma.storyAlbum.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        authorUsername: authorUsername.toLowerCase().trim(),
        genre: genre.trim(),
        chapters: {
          create: [
            {
              title: initialChapterTitle.trim(),
              timelineOrder: 1,
              audioUrl: audioUrl || '/uploads/fallback-beat.mp3',
              duration: '10:00',
              summary: 'Opening Chapter',
              authorUsername: authorUsername.toLowerCase().trim(),
            },
          ],
        },
      },
      include: {
        chapters: true,
        comments: true,
      },
    });

    return NextResponse.json({ album: newAlbum }, { status: 201 });
  } catch (error) {
    console.error('Story Album POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Edit / rename Story Album
export async function PATCH(request: Request) {
  try {
    const { id, title, description, genre, username } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    const existingAlbum = await prisma.storyAlbum.findUnique({
      where: { id },
    });

    if (!existingAlbum) {
      return NextResponse.json({ error: 'Story Album not found' }, { status: 404 });
    }

    if (
      username &&
      username.toLowerCase() !== existingAlbum.authorUsername.toLowerCase() &&
      username.toLowerCase() !== 'admin'
    ) {
      return NextResponse.json({ error: 'Unauthorized to modify this story album' }, { status: 403 });
    }

    const updated = await prisma.storyAlbum.update({
      where: { id },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(genre ? { genre: genre.trim() } : {}),
      },
      include: {
        chapters: { orderBy: { timelineOrder: 'asc' } },
        comments: true,
      },
    });

    return NextResponse.json({ album: updated }, { status: 200 });
  } catch (error) {
    console.error('Story Album PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a Story Album
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
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    const existingAlbum = await prisma.storyAlbum.findUnique({
      where: { id },
    });

    if (!existingAlbum) {
      return NextResponse.json({ error: 'Story Album not found' }, { status: 404 });
    }

    if (
      username &&
      username.toLowerCase() !== existingAlbum.authorUsername.toLowerCase() &&
      username.toLowerCase() !== 'admin'
    ) {
      return NextResponse.json({ error: 'Unauthorized to delete this story album' }, { status: 403 });
    }

    await prisma.storyAlbum.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Story Album deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Story Album DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
