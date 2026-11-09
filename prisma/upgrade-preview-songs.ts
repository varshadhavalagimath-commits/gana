import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: dbPath,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Scanning for 30s preview tracks in dev.db to upgrade to full songs...');

  const songs = await prisma.song.findMany();
  let upgradedCount = 0;

  for (const song of songs) {
    if (song.audioUrl.includes('itunes.apple.com') || song.audioUrl.includes('apple.com')) {
      console.log(`Upgrading preview track: "${song.title}"...`);
      try {
        // Query YouTube search for full lyrics/audio
        const cleanTitle = song.title.split(' - ')[0] || song.title;
        const artist = song.artist || '';
        const query = encodeURIComponent(`${cleanTitle} ${artist} lyrics`);
        const searchUrl = `https://www.youtube.com/results?search_query=${query}`;

        const res = await fetch(searchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });

        const html = await res.text();
        const videoMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);

        if (videoMatch && videoMatch[1]) {
          const videoId = videoMatch[1];
          await prisma.song.update({
            where: { id: song.id },
            data: { audioUrl: `youtube:${videoId}` },
          });
          console.log(`Successfully upgraded "${song.title}" -> youtube:${videoId}`);
          upgradedCount++;
        }
      } catch (err) {
        console.error(`Failed to upgrade "${song.title}":`, err);
      }
    }
  }

  console.log(`Finished upgrading! Total tracks upgraded: ${upgradedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
