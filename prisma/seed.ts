import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Gana Database...');

  // Create Users with public/private accounts
  const user1 = await prisma.user.upsert({
    where: { username: 'dj_pulse' },
    update: {},
    create: {
      username: 'dj_pulse',
      email: 'dj_pulse@gana.fm',
      isPrivate: false, // Public account
    },
  });

  const user2 = await prisma.user.upsert({
    where: { username: 'lofi_vibes' },
    update: {},
    create: {
      username: 'lofi_vibes',
      email: 'lofi_vibes@gana.fm',
      isPrivate: true, // Private account (requires follow request approval)
    },
  });

  const user3 = await prisma.user.upsert({
    where: { username: 'coding_beats' },
    update: {},
    create: {
      username: 'coding_beats',
      email: 'coding_beats@gana.fm',
      isPrivate: false, // Public account
    },
  });

  console.log('Users created:', { user1, user2, user3 });

  // Create Friendship connections
  // dj_pulse and coding_beats are friends (accepted)
  await prisma.friendship.create({
    data: {
      userId: 'dj_pulse',
      friendId: 'coding_beats',
      status: 'ACCEPTED',
    },
  });

  // dj_pulse has requested to follow lofi_vibes (private account - PENDING status)
  await prisma.friendship.create({
    data: {
      userId: 'dj_pulse',
      friendId: 'lofi_vibes',
      status: 'PENDING',
    },
  });

  // Seed multi-industry library songs
  await prisma.song.createMany({
    data: [
      // HOLLYWOOD (Pop, Rock)
      {
        title: 'Midnight Highway Synth',
        genre: 'Hollywood Synthwave',
        moodEmoji: '🚀',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        creatorUsername: 'coding_beats',
        likesCount: 120,
        artist: 'The Weeknd',
        album: 'After Hours',
        description: 'Late night synth drive',
      },
      {
        title: 'Chasing the Sunset',
        genre: 'Hollywood Pop',
        moodEmoji: '🔥',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        creatorUsername: 'dj_pulse',
        likesCount: 95,
        artist: 'Taylor Swift',
        album: '1989',
        description: 'Golden hour summer pop vibes',
      },
      // BOLLYWOOD (Hindi Beat / Dance)
      {
        title: 'Desi Dhol Beats',
        genre: 'Bollywood Masala',
        moodEmoji: '💃',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        creatorUsername: 'dj_pulse',
        likesCount: 230,
        artist: 'A.R. Rahman',
        album: 'Rockstar',
        description: 'High energy festive dhol rhythms',
      },
      {
        title: 'Pyaar Lofi Acoustic',
        genre: 'Bollywood Romantic',
        moodEmoji: '💔',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        creatorUsername: 'lofi_vibes',
        likesCount: 142,
        artist: 'Arijit Singh',
        album: 'Ae Dil Hai Mushkil',
        description: 'Soothing acoustic chords and emotional whisper vocals',
      },
      // TOLLYWOOD / SOUTH BEATS (Mass Beats)
      {
        title: 'South Indian Dappankuthu',
        genre: 'Tollywood Mass',
        moodEmoji: '🔥',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        creatorUsername: 'coding_beats',
        likesCount: 310,
        artist: 'Anirudh Ravichander',
        album: 'Jawan',
        description: 'Explosive high-bass street percussion',
      },
      {
        title: 'Monsoon Raga Ambient',
        genre: 'Tollywood Classical',
        moodEmoji: '🌧️',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
        creatorUsername: 'lofi_vibes',
        likesCount: 78,
        artist: 'A.R. Rahman',
        album: 'Dil Se',
        description: 'Traditional sitar notes meeting fresh rain textures',
      },
      // K-POP (Korean Pop / Dance)
      {
        title: 'Seoul Disco Pop',
        genre: 'K-Pop Retro',
        moodEmoji: '💃',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
        creatorUsername: 'dj_pulse',
        likesCount: 185,
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        description: 'Retro disco floor filler with modern bounce',
      },
      // EDM & LOFI CHILL
      {
        title: 'Deep Bass Cyber club',
        genre: 'EDM Techno',
        moodEmoji: '🔥',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        creatorUsername: 'coding_beats',
        likesCount: 154,
        artist: 'Linkin Park',
        album: 'Meteora',
        description: 'Driving sub-bass synthesizer pulses',
      },
      {
        title: 'Rainy Cafe Study Session',
        genre: 'Lofi Chillout',
        moodEmoji: '🌧️',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
        creatorUsername: 'lofi_vibes',
        likesCount: 88,
        artist: 'Coldplay',
        album: 'Parachutes',
        description: 'Warm vinyl crackle and mellow electric piano chords',
      },
      {
        title: 'Zen Slumber Pad',
        genre: 'Sleep Ambient',
        moodEmoji: '😴',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        creatorUsername: 'lofi_vibes',
        likesCount: 45,
        artist: 'Hans Zimmer',
        album: 'Interstellar OST',
        description: 'Deep soothing drone soundscape for restorative sleep',
      },
    ],
  });

  console.log('Seed completed successfully for Gana library!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
