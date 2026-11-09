import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch lyrics for a song (via title/artist or general search query)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title')?.trim();
    const artist = searchParams.get('artist')?.trim();
    const q = searchParams.get('q')?.trim() || (title ? `${title} ${artist || ''}`.trim() : '');
    const songId = searchParams.get('songId');

    // 1. Check in Database by songId if provided
    if (songId) {
      const dbSong = await prisma.song.findUnique({ where: { id: songId } });
      if (dbSong && dbSong.lyrics && dbSong.lyrics.trim().length > 0) {
        return NextResponse.json({
          title: dbSong.title,
          artist: dbSong.artist,
          lyrics: dbSong.lyrics,
          source: 'database',
        });
      }
    }

    // 2. Check in Database by title / artist match
    if (title) {
      const dbMatch = await prisma.song.findFirst({
        where: {
          title: { contains: title },
          ...(artist && artist !== 'Unknown Singer' ? { artist: { contains: artist } } : {}),
        },
      });

      if (dbMatch && dbMatch.lyrics && dbMatch.lyrics.trim().length > 0) {
        return NextResponse.json({
          title: dbMatch.title,
          artist: dbMatch.artist,
          lyrics: dbMatch.lyrics,
          source: 'database',
        });
      }
    }

    // 3. Search LRCLIB public lyrics repository
    if (title && artist && artist !== 'Unknown Singer') {
      try {
        const getUrl = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
        const res = await fetch(getUrl, {
          headers: { 'User-Agent': 'GanaMusicApp/1.0 (https://gana.fm)' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.plainLyrics) {
            return NextResponse.json({
              title: data.trackName || title,
              artist: data.artistName || artist,
              lyrics: data.plainLyrics,
              source: 'lrclib',
            });
          }
        }
      } catch (e) {
        console.warn('LRCLIB get error:', e);
      }
    }

    // Search query fallback on LRCLIB
    if (q) {
      try {
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(q)}`;
        const res = await fetch(searchUrl, {
          headers: { 'User-Agent': 'GanaMusicApp/1.0 (https://gana.fm)' },
        });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            const firstWithLyrics = list.find((item: any) => item.plainLyrics);
            if (firstWithLyrics) {
              return NextResponse.json({
                title: firstWithLyrics.trackName,
                artist: firstWithLyrics.artistName,
                lyrics: firstWithLyrics.plainLyrics,
                source: 'lrclib',
              });
            }
          }
        }
      } catch (e) {
        console.warn('LRCLIB search error:', e);
      }
    }

    return NextResponse.json(
      {
        title: title || q,
        artist: artist || 'Various Artists',
        lyrics: 'Lyrics not found yet for this song. You can write or upload custom lyrics below!',
        source: 'not_found',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Lyrics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save or attach lyrics to a song in database
export async function POST(request: Request) {
  try {
    const { songId, lyrics, title, artist } = await request.json();

    if (!lyrics?.trim()) {
      return NextResponse.json({ error: 'Lyrics text is required' }, { status: 400 });
    }

    if (songId) {
      const updated = await prisma.song.update({
        where: { id: songId },
        data: { lyrics: lyrics.trim() },
      });
      return NextResponse.json({ success: true, song: updated });
    }

    // Match by title
    if (title) {
      const match = await prisma.song.findFirst({
        where: {
          title: { contains: title },
          ...(artist ? { artist: { contains: artist } } : {}),
        },
      });
      if (match) {
        const updated = await prisma.song.update({
          where: { id: match.id },
          data: { lyrics: lyrics.trim() },
        });
        return NextResponse.json({ success: true, song: updated });
      }
    }

    return NextResponse.json({ success: true, lyrics: lyrics.trim() });
  } catch (error) {
    console.error('Save lyrics error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
