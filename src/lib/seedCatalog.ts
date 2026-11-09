import prisma from '@/lib/prisma';
import { FEATURED_ARTISTS } from '@/lib/artists';

export async function syncWorldwideCatalog() {
  console.log('Synchronizing Worldwide Music Catalog into Database...');
  let addedCount = 0;
  let updatedCount = 0;

  for (const artist of FEATURED_ARTISTS) {
    if (!artist.topSongs || artist.topSongs.length === 0) continue;

    for (const song of artist.topSongs) {
      // Check if song already exists by title and artist
      const existing = await prisma.song.findFirst({
        where: {
          OR: [
            {
              title: song.title,
              artist: { contains: artist.name },
            },
            {
              audioUrl: song.audioUrl,
            },
          ],
        },
      });

      if (existing) {
        // Update language, album, and artist if missing or default
        await prisma.song.update({
          where: { id: existing.id },
          data: {
            artist: artist.name,
            album: song.album || existing.album || 'Single',
            language: artist.language,
            genre: song.genre || existing.genre,
            moodEmoji: song.moodEmoji || existing.moodEmoji,
            audioUrl: song.audioUrl,
          },
        });
        updatedCount++;
      } else {
        // Create new song record
        await prisma.song.create({
          data: {
            title: song.title,
            artist: artist.name,
            album: song.album || 'Single',
            genre: song.genre || artist.genre,
            language: artist.language,
            moodEmoji: song.moodEmoji || '🔥',
            audioUrl: song.audioUrl,
            creatorUsername: 'admin',
            likesCount: song.likesCount || 100,
            description: song.description || `Top worldwide hit from ${artist.name}.`,
          },
        });
        addedCount++;
      }
    }
  }

  // Also check existing songs with language 'English' that match known artists and set their language properly
  const allExistingSongs = await prisma.song.findMany();
  for (const s of allExistingSongs) {
    for (const a of FEATURED_ARTISTS) {
      if (s.artist.toLowerCase().includes(a.name.toLowerCase()) || s.title.toLowerCase().includes(a.name.toLowerCase())) {
        if (s.language !== a.language) {
          await prisma.song.update({
            where: { id: s.id },
            data: { language: a.language, artist: a.name },
          });
          updatedCount++;
        }
      }
    }
  }

  return { addedCount, updatedCount, totalArtists: FEATURED_ARTISTS.length };
}
