import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';

    if (!query || query.length < 2) {
      return NextResponse.json({
        queries: [],
        dbSongs: [],
        similar: [],
      });
    }

    // 1. Fetch real-time Google/YouTube keyword autocomplete suggestions
    let googleQueries: string[] = [];
    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
        query + ' song'
      )}`;
      const res = await fetch(suggestUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[1])) {
          // Clean up suggestions and strip extra redundant words
          googleQueries = data[1]
            .map((item: string) => item.replace(/\s+song(s)?/gi, '').trim())
            .filter((item: string) => item.length > 0 && item.toLowerCase() !== query.toLowerCase())
            .slice(0, 6);
        }
      }
    } catch (e) {
      console.warn('Google suggest fetch error:', e);
    }

    // 2. Fetch matching songs, artists, and albums from Gana's database
    let dbSongs: any[] = [];
    let matchedArtists: { artist: string; albums: string[]; count: number }[] = [];
    let matchedAlbums: { album: string; artist: string; count: number }[] = [];

    try {
      dbSongs = await prisma.song.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { artist: { contains: query } },
            { album: { contains: query } },
            { genre: { contains: query } },
          ],
        },
        take: 6,
        orderBy: { likesCount: 'desc' },
      });

      // Find matching artists
      const artistMatches = await prisma.song.findMany({
        where: {
          artist: { contains: query },
        },
        select: {
          artist: true,
          album: true,
        },
        take: 12,
      });

      const artistMap: Record<string, { artist: string; albums: Set<string>; count: number }> = {};
      artistMatches.forEach((s) => {
        if (!s.artist || s.artist === 'Unknown Singer') return;
        if (!artistMap[s.artist]) {
          artistMap[s.artist] = { artist: s.artist, albums: new Set(), count: 0 };
        }
        artistMap[s.artist].count += 1;
        if (s.album && s.album !== 'Single') {
          artistMap[s.artist].albums.add(s.album);
        }
      });

      matchedArtists = Object.values(artistMap)
        .map((item) => ({
          artist: item.artist,
          albums: Array.from(item.albums),
          count: item.count,
        }))
        .slice(0, 3);

      // Find matching albums
      const albumMatches = await prisma.song.findMany({
        where: {
          album: { contains: query },
        },
        select: {
          album: true,
          artist: true,
        },
        take: 12,
      });

      const albumMap: Record<string, { album: string; artist: string; count: number }> = {};
      albumMatches.forEach((s) => {
        if (!s.album || s.album === 'Single') return;
        if (!albumMap[s.album]) {
          albumMap[s.album] = { album: s.album, artist: s.artist, count: 0 };
        }
        albumMap[s.album].count += 1;
      });

      matchedAlbums = Object.values(albumMap).slice(0, 3);
    } catch (e) {
      console.warn('DB song search error:', e);
    }

    return NextResponse.json({
      queries: googleQueries,
      dbSongs,
      matchedArtists,
      matchedAlbums,
    });
  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
