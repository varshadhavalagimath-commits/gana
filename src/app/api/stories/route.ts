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

    // Auto-heal any chapters that may still have broken third-party freesound URLs
    const verifiedUploads = [
      '/uploads/1785774888556-ghal7.wav',
      '/uploads/1785775794079-p5pbn.wav',
      '/uploads/1791815754139-5xcps.wav',
      '/uploads/1792164161141-5kjt8.wav',
      '/uploads/1792164266034-q3cr9.wav',
      '/uploads/1792164400818-c6z8m.wav',
      '/uploads/1792164681293-0bd6z.ogg',
      '/uploads/1792164940131-0j8rs.ogg',
    ];

    let hasHealed = false;
    for (const album of albums) {
      if (album.chapters) {
        for (let i = 0; i < album.chapters.length; i++) {
          const ch = album.chapters[i];
          if (!ch.audioUrl || ch.audioUrl.includes('freesound.org')) {
            const fallbackPath = verifiedUploads[i % verifiedUploads.length];
            ch.audioUrl = fallbackPath;
            hasHealed = true;
            prisma.storyChapter.update({
              where: { id: ch.id },
              data: { audioUrl: fallbackPath },
            }).catch(() => {});
          }
        }
      }
    }

    if (albums.length === 0 && (!genre || genre === 'All') && !author) {
      try {
        const seedAlbum1 = await prisma.storyAlbum.create({
          data: {
            title: 'Shadows of Neo-Varanasi',
            description: 'An atmospheric cyberpunk noir novel following Detective Vance as he uncovers vanishing auditory memories across neon-lit ghats.',
            authorUsername: 'storyteller_aarav',
            genre: 'Thriller & Mystery',
            likesCount: 52,
            likedBy: ['admin'],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: The Midnight Frequency',
                  timelineOrder: 1,
                  summary: 'An encrypted radio transmission arrives at 3 AM carrying a melody that was supposedly banned half a century ago.',
                  audioUrl: '/uploads/1785774888556-ghal7.wav',
                  duration: '3:20',
                  authorUsername: 'storyteller_aarav',
                  likesCount: 38,
                  likedBy: ['admin'],
                },
                {
                  title: 'Chapter 2: Whispers in the Neon Rain',
                  timelineOrder: 2,
                  summary: 'Deep inside District 9, Vance questions a rogue cyber-monk regarding the disappearing music archives.',
                  audioUrl: '/uploads/1785775794079-p5pbn.wav',
                  duration: '4:15',
                  authorUsername: 'storyteller_aarav',
                  likesCount: 29,
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
            likesCount: 64,
            likedBy: [],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: Resonance of the Ancients',
                  timelineOrder: 1,
                  summary: 'Princess Ananya hears the celestial chime call her name across the crystal mountains.',
                  audioUrl: '/uploads/1791815754139-5xcps.wav',
                  duration: '4:50',
                  authorUsername: 'celestial_scribe',
                  likesCount: 41,
                  likedBy: [],
                },
                {
                  title: 'Chapter 2: The Gateway of Starlight',
                  timelineOrder: 2,
                  summary: 'Ascending the Obsidian Citadel, Ananya and the dragon keeper align the crystal spheres.',
                  audioUrl: '/uploads/1792164266034-q3cr9.wav',
                  duration: '3:35',
                  authorUsername: 'celestial_scribe',
                  likesCount: 27,
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

        const seedAlbum3 = await prisma.storyAlbum.create({
          data: {
            title: 'The Lost Prince of Hampi',
            description: 'A historical audio epic set in the ruins of the Vijayanagara Empire. Archeologist Dev and local guide Meera follow stone inscriptions to uncover a forgotten royal lineage.',
            authorUsername: 'history_weaver',
            genre: 'Historical Drama',
            likesCount: 58,
            likedBy: ['admin'],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: Shadows Behind the Stone Chariot',
                  timelineOrder: 1,
                  summary: 'At dusk among the ruins of Vittala Temple, an ancient brass talisman falls from an unexplored pillar.',
                  audioUrl: '/uploads/1792164681293-0bd6z.ogg',
                  duration: '3:15',
                  authorUsername: 'history_weaver',
                  likesCount: 38,
                  likedBy: ['admin'],
                },
                {
                  title: 'Chapter 2: Echoes of the Tungabhadra',
                  timelineOrder: 2,
                  summary: 'Following cryptic engravings along the riverbanks, Dev encounters a cloaked guardian warning him of the royal curse.',
                  audioUrl: '/uploads/1792164940131-0j8rs.ogg',
                  duration: '3:40',
                  authorUsername: 'history_weaver',
                  likesCount: 29,
                  likedBy: [],
                },
                {
                  title: 'Chapter 3: The Royal Seal Unveiled',
                  timelineOrder: 3,
                  summary: 'Inside the subterranean chamber beneath the lotus mahal, the lost seal of Krishnadevaraya is finally discovered.',
                  audioUrl: '/uploads/1785774888556-ghal7.wav',
                  duration: '4:20',
                  authorUsername: 'history_weaver',
                  likesCount: 42,
                  likedBy: [],
                },
              ],
            },
            comments: {
              create: [
                {
                  username: 'admin',
                  text: 'The historical atmosphere in this audio drama is incredible! You can feel the wind through Hampi stones.',
                },
                {
                  username: 'listener_riya',
                  text: 'Loved Chapter 2! The music and sound effects made it so immersive.',
                },
              ],
            },
          },
          include: {
            chapters: { orderBy: { timelineOrder: 'asc' } },
            comments: { orderBy: { createdAt: 'desc' } },
          },
        });

        const seedAlbum4 = await prisma.storyAlbum.create({
          data: {
            title: 'Whispers in the Pine Valley',
            description: 'A psychological horror and supernatural audio novel. A lone writer in a secluded Himalayan cabin realizes the night winds are chanting his own unwritten poems.',
            authorUsername: 'kavya_novelist',
            genre: 'Horror & Supernatural',
            likesCount: 41,
            likedBy: [],
            chapters: {
              create: [
                {
                  title: 'Chapter 1: The Midnight Monolith',
                  timelineOrder: 1,
                  summary: 'Arriving at cottage 14 during a blizzard, Kabir finds a vintage tape recorder already running on the fireplace mantel.',
                  audioUrl: '/uploads/1792164266034-q3cr9.wav',
                  duration: '3:55',
                  authorUsername: 'kavya_novelist',
                  likesCount: 27,
                  likedBy: [],
                },
                {
                  title: 'Chapter 2: Footsteps in the Cold Fog',
                  timelineOrder: 2,
                  summary: 'The tape recorder begins playing a voice message recorded thirty seconds into the future.',
                  audioUrl: '/uploads/1792164400818-c6z8m.wav',
                  duration: '4:12',
                  authorUsername: 'kavya_novelist',
                  likesCount: 34,
                  likedBy: [],
                },
              ],
            },
            comments: {
              create: [
                {
                  username: 'storyteller_aarav',
                  text: 'Genuinely chilling atmosphere! That audio cue in Chapter 1 gave me goosebumps.',
                },
              ],
            },
          },
          include: {
            chapters: { orderBy: { timelineOrder: 'asc' } },
            comments: { orderBy: { createdAt: 'desc' } },
          },
        });

        albums = [seedAlbum1, seedAlbum2, seedAlbum3, seedAlbum4];
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
