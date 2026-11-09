import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: dbPath,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Gana recommendation songs with artists and albums...');

  const recommendations = [
    // ARIJIT SINGH
    {
      title: 'Kesariya',
      artist: 'Arijit Singh & Pritam',
      album: 'Brahmastra',
      genre: 'Bollywood Romantic',
      moodEmoji: '❤️',
      audioUrl: 'youtube:BddP6PYo2gs',
      creatorUsername: 'global_library',
      likesCount: 560,
      description: '🔥 #1 Trending: Soulful romantic melody featuring Indian classical notes.',
    },
    {
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh',
      album: 'Aashiqui 2',
      genre: 'Bollywood Soul',
      moodEmoji: '🎵',
      audioUrl: 'youtube:IJq0ywWFlG0',
      creatorUsername: 'global_library',
      likesCount: 490,
      description: 'Recommendation: Melancholic masterpiece that touches the deepest emotions.',
    },
    {
      title: 'Channa Mereya',
      artist: 'Arijit Singh',
      album: 'Ae Dil Hai Mushkil',
      genre: 'Bollywood Emotional',
      moodEmoji: '💔',
      audioUrl: 'youtube:284Ov7ysmfA',
      creatorUsername: 'global_library',
      likesCount: 420,
      description: 'Recommendation: The ultimate heartbreak song of longing and farewell.',
    },

    // THE WEEKND
    {
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      genre: 'Hollywood Pop',
      moodEmoji: '💃',
      audioUrl: 'youtube:fHI8X4OX3eg',
      creatorUsername: 'global_library',
      likesCount: 540,
      description: '🔥 Top Hit: Retro 80s synth-pop masterpiece for late night city drives.',
    },
    {
      title: 'Starboy',
      artist: 'The Weeknd & Daft Punk',
      album: 'Starboy',
      genre: 'Hollywood Pop',
      moodEmoji: '😎',
      audioUrl: 'youtube:34Na4j8AVgA',
      creatorUsername: 'global_library',
      likesCount: 480,
      description: 'Recommendation: Slick swagger, electric bassline, and electro-pop groove.',
    },

    // COLDPLAY
    {
      title: 'Fix You',
      artist: 'Coldplay',
      album: 'X&Y',
      genre: 'British Rock',
      moodEmoji: '🫂',
      audioUrl: 'youtube:k4V3Mo61fJM',
      creatorUsername: 'global_library',
      likesCount: 460,
      description: 'Recommendation: A gentle warm embrace in times of vulnerability and hope.',
    },
    {
      title: 'The Scientist',
      artist: 'Coldplay',
      album: 'A Rush of Blood to the Head',
      genre: 'Alternative Rock',
      moodEmoji: '🤔',
      audioUrl: 'youtube:RB-RcX5DS5A',
      creatorUsername: 'global_library',
      likesCount: 410,
      description: 'Recommendation: Introspective and contemplative piano ballad.',
    },
    {
      title: 'Yellow',
      artist: 'Coldplay',
      album: 'Parachutes',
      genre: 'Alternative Rock',
      moodEmoji: '🌈',
      audioUrl: 'youtube:yKNxeF4KMsY',
      creatorUsername: 'global_library',
      likesCount: 430,
      description: 'Recommendation: Timeless acoustic warmth and stellar melodies.',
    },

    // ED SHEERAN
    {
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      album: 'Divide',
      genre: 'Hollywood Pop',
      moodEmoji: '💃',
      audioUrl: 'youtube:JGwWNGJdvx8',
      creatorUsername: 'global_library',
      likesCount: 530,
      description: '🔥 Global Hit: Infectious dancehall-infused pop beat with acoustic rhythm.',
    },
    {
      title: 'Perfect',
      artist: 'Ed Sheeran',
      album: 'Divide',
      genre: 'Hollywood Pop',
      moodEmoji: '❤️',
      audioUrl: 'youtube:2Vv-BfVoq4g',
      creatorUsername: 'global_library',
      likesCount: 470,
      description: 'Recommendation: Ultimate love song of the generation with acoustic guitar.',
    },

    // RAP & HIP-HOP ANTHEMS
    {
      title: 'Lose Yourself',
      artist: 'Eminem',
      album: 'Curtain Call',
      genre: 'Hip-Hop / Rap',
      moodEmoji: '🔥',
      audioUrl: 'youtube:_Yhyp-_hX2s',
      creatorUsername: 'global_library',
      likesCount: 610,
      description: '👑 #1 Top Rap Song: Legendary Oscar & Grammy-winning motivational rap anthem with relentless rhyme schemes.',
    },
    {
      title: 'HUMBLE.',
      artist: 'Kendrick Lamar',
      album: 'DAMN.',
      genre: 'Hip-Hop / Rap',
      moodEmoji: '👑',
      audioUrl: 'youtube:tvTRZJ-4EyI',
      creatorUsername: 'global_library',
      likesCount: 570,
      description: '🔥 Top Rap Hit: Hard-hitting piano trap beat, razor-sharp delivery, and iconic chorus.',
    },
    {
      title: 'Kohinoor',
      artist: 'DIVINE',
      album: 'Kohinoor',
      genre: 'Desi Hip-Hop / Gully Rap',
      moodEmoji: '🎤',
      audioUrl: 'youtube:7kpy9o_8wXU',
      creatorUsername: 'global_library',
      likesCount: 540,
      description: '🔥 Gully Rap Anthem: Raw authentic Mumbai street hip-hop storytelling from the Gullies of 59.',
    },
    {
      title: 'SICKO MODE',
      artist: 'Travis Scott & Drake',
      album: 'ASTROWORLD',
      genre: 'Hip-Hop / Trap',
      moodEmoji: '😎',
      audioUrl: 'youtube:6ONRf7h3Mdk',
      creatorUsername: 'global_library',
      likesCount: 535,
      description: '🔥 Multi-part beat switch trap epic that redefined modern hip-hop production.',
    },
    {
      title: 'Without Me',
      artist: 'Eminem',
      album: 'The Eminem Show',
      genre: 'Hip-Hop / Rap',
      moodEmoji: '😎',
      audioUrl: 'youtube:YVkUvmDQ3HY',
      creatorUsername: 'global_library',
      likesCount: 525,
      description: '🔥 Funky, tongue-in-cheek hip-hop classic with incredible speed and satire.',
    },
    {
      title: 'Namastute',
      artist: 'Seedhe Maut & Sez on the Beat',
      album: 'Nayaab',
      genre: 'Desi Hip-Hop / Drill',
      moodEmoji: '⚡',
      audioUrl: 'youtube:yVn6E04s4L8',
      creatorUsername: 'global_library',
      likesCount: 515,
      description: '🔥 Underground Desi Drill: Unmatched rapid-fire dual flow and explosive 808s.',
    },

    // DRAKE
    {
      title: "God's Plan",
      artist: 'Drake',
      album: 'Scorpion',
      genre: 'Hip-Hop / Trap',
      moodEmoji: '👑',
      audioUrl: 'youtube:xpVfcZ0ZcFM',
      creatorUsername: 'global_library',
      likesCount: 450,
      description: 'Recommendation: Unstoppable confidence, uplifting flow, and iconic hook.',
    },

    // ADELE
    {
      title: 'Someone Like You',
      artist: 'Adele',
      album: '21',
      genre: 'Hollywood Ballad',
      moodEmoji: '😢',
      audioUrl: 'youtube:hLQl3WQQoQ0',
      creatorUsername: 'global_library',
      likesCount: 440,
      description: 'Recommendation: Heartrending piano ballad of nostalgic sorrow and closure.',
    },
    {
      title: 'Rolling in the Deep',
      artist: 'Adele',
      album: '21',
      genre: 'Soul / Pop Rock',
      moodEmoji: '🔥',
      audioUrl: 'youtube:rYEDA3JcQqw',
      creatorUsername: 'global_library',
      likesCount: 460,
      description: 'Recommendation: Fiery rhythm, gospel stomps, and powerhouse vocals.',
    },

    // A.R. RAHMAN
    {
      title: 'Kun Faya Kun',
      artist: 'A.R. Rahman',
      album: 'Rockstar',
      genre: 'Sufi / Classical Fusion',
      moodEmoji: '👑',
      audioUrl: 'youtube:T94PHkuydcw',
      creatorUsername: 'global_library',
      likesCount: 510,
      description: '👑 Spiritual Masterpiece: Divine Sufi qawwali recorded at Hazrat Nizamuddin.',
    },

    // ANIRUDH RAVICHANDER
    {
      title: 'Chaleya',
      artist: 'Anirudh Ravichander',
      album: 'Jawan',
      genre: 'Bollywood Masala',
      moodEmoji: '❤️',
      audioUrl: 'youtube:VAdGW7QDJUI',
      creatorUsername: 'global_library',
      likesCount: 525,
      description: '🔥 Trending: Romantic peppy beat loved by millions worldwide.',
    },
    {
      title: 'Hukum',
      artist: 'Anirudh Ravichander',
      album: 'Jailer',
      genre: 'Tollywood Mass',
      moodEmoji: '🔥',
      audioUrl: 'youtube:1F3hm6MfR1k',
      creatorUsername: 'global_library',
      likesCount: 505,
      description: '🔥 Mass Anthem: High-voltage adrenaline percussion and mass brass.',
    },

    // TAYLOR SWIFT
    {
      title: 'Blank Space',
      artist: 'Taylor Swift',
      album: '1989',
      genre: 'Hollywood Pop',
      moodEmoji: '😎',
      audioUrl: 'youtube:e-ORhEE9VVg',
      creatorUsername: 'global_library',
      likesCount: 475,
      description: 'Recommendation: Sparkling synth-pop satire with unforgettable hooks.',
    },

    // DUA LIPA
    {
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      genre: 'Disco Pop',
      moodEmoji: '💃',
      audioUrl: 'youtube:TUVcZfQe-Kw',
      creatorUsername: 'global_library',
      likesCount: 465,
      description: 'Recommendation: Roller-disco bassline that keeps you moving all night.',
    },

    // LINKIN PARK
    {
      title: 'In The End',
      artist: 'Linkin Park',
      album: 'Hybrid Theory',
      genre: 'Nu-Metal / Rock',
      moodEmoji: '😡',
      audioUrl: 'youtube:eVTXPUF4Oz4',
      creatorUsername: 'global_library',
      likesCount: 485,
      description: 'Recommendation: Intense emotional angst and driving alt-rock guitars.',
    },
    {
      title: 'Numb',
      artist: 'Linkin Park',
      album: 'Meteora',
      genre: 'Nu-Metal / Rock',
      moodEmoji: '😡',
      audioUrl: 'youtube:kXYiU_JCYtU',
      creatorUsername: 'global_library',
      likesCount: 495,
      description: 'Recommendation: Iconic generational anthem of defiance and raw emotion.',
    },

    // HARRY STYLES
    {
      title: 'Watermelon Sugar',
      artist: 'Harry Styles',
      album: 'Fine Line',
      genre: 'Pop / Funk',
      moodEmoji: '🌈',
      audioUrl: 'youtube:E07s5ZYygMg',
      creatorUsername: 'global_library',
      likesCount: 445,
      description: 'Recommendation: Vibrant, colorful and uplifting sunshine vibes.',
    },

    // HANS ZIMMER
    {
      title: 'Interstellar Theme',
      artist: 'Hans Zimmer',
      album: 'Interstellar OST',
      genre: 'Cinematic Ambient',
      moodEmoji: '🌌',
      audioUrl: 'youtube:UDVtMYqUAyw',
      creatorUsername: 'global_library',
      likesCount: 460,
      description: 'Recommendation: Expansive cosmic soundscape traversing infinite space.',
    },

    // SANAM
    {
      title: 'Yeh Raaten Yeh Mausam',
      artist: 'Sanam',
      album: 'Sanam Single',
      genre: 'Bollywood Masala',
      moodEmoji: '❤️',
      audioUrl: 'youtube:h7n7_b4Xo2E',
      creatorUsername: 'global_library',
      likesCount: 415,
      description: 'Recommendation: Acoustic rendition of the golden vintage classic.',
    },

    // RAVI BASRUR
    {
      title: 'Toofan',
      artist: 'Ravi Basrur',
      album: 'K.G.F Chapter 2',
      genre: 'Sandalwood Mass',
      moodEmoji: '🔥',
      audioUrl: 'youtube:jJ1FjrsJ694',
      creatorUsername: 'global_library',
      likesCount: 495,
      description: 'Recommendation: High-octane energetic background score from Sandalwood.',
    },

    // PUSHPA
    {
      title: 'Oo Antava Mava Oo Oo Antava',
      artist: 'Indravathi Chauhan & Devi Sri Prasad',
      album: 'Pushpa',
      genre: 'Tollywood Mass',
      moodEmoji: '💃',
      audioUrl: 'youtube:9T4m_pCHHsg',
      creatorUsername: 'global_library',
      likesCount: 480,
      description: 'Recommendation: Viral dance beats with sensational folk instruments.',
    },

    // AMBIENT & CLASSIC
    {
      title: 'Ocean Waves & Ambient Rain',
      artist: 'Zen Soundscapes',
      album: 'Deep Calm',
      genre: 'Ambient Relax',
      moodEmoji: '🌊',
      audioUrl: 'youtube:bn9F19Hi1Lk',
      creatorUsername: 'global_library',
      likesCount: 310,
      description: 'Recommendation: Serene waves for deep relaxation and unwinding.',
    },
    {
      title: 'Kal Ho Naa Ho',
      artist: 'Sonu Nigam & Shankar-Ehsaan-Loy',
      album: 'Kal Ho Naa Ho',
      genre: 'Bollywood Classic',
      moodEmoji: '🫀',
      audioUrl: 'youtube:g0eO74UmRBs',
      creatorUsername: 'global_library',
      likesCount: 490,
      description: 'Recommendation: Deep heartfelt celebration of love, life, and today.',
    },
    {
      title: 'Lofi Study Session Chill',
      artist: 'Lofi Chill Hip Hop',
      album: 'Study Beats Vol. 1',
      genre: 'Lofi Chillout',
      moodEmoji: '🌧️',
      audioUrl: 'youtube:5qap5aO4i9A',
      creatorUsername: 'global_library',
      likesCount: 350,
      description: 'Recommendation: Ambient low fidelity chill loops for focusing.',
    }
  ];

  for (const song of recommendations) {
    const exists = await prisma.song.findFirst({
      where: {
        OR: [
          { title: song.title, artist: song.artist },
          { title: song.title }
        ]
      }
    });

    if (!exists) {
      await prisma.song.create({
        data: song
      });
      console.log(`Added: ${song.title} by ${song.artist} [Album: ${song.album}]`);
    } else {
      await prisma.song.update({
        where: { id: exists.id },
        data: {
          artist: song.artist,
          album: song.album,
          genre: song.genre,
          likesCount: song.likesCount,
          moodEmoji: song.moodEmoji,
          description: song.description,
          audioUrl: song.audioUrl,
        }
      });
      console.log(`Updated: ${song.title} by ${song.artist} [Album: ${song.album}]`);
    }
  }

  console.log('Recommendations seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
