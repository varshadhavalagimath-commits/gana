export interface IndustrySong {
  id: string;
  title: string;
  artist: string;
  album: string;
  industry: string;
  language: string;
  genre: string;
  moodEmoji: string;
  likesCount: number;
  audioUrl: string;
  lyrics?: string;
  description?: string;
}

export interface IndustryItem {
  id: string;
  name: string;
  description: string;
  badge: string;
  icon: string;
  top5: IndustrySong[];
}

export const MUSIC_INDUSTRIES: IndustryItem[] = [
  {
    id: 'all',
    name: 'All Industries (Global Trending)',
    description: 'The overall top 5 most listened to songs across all music industries today.',
    badge: 'Worldwide Trending',
    icon: '🔥',
    top5: [
      {
        id: 'trend_kesariya',
        title: 'Kesariya',
        artist: 'Arijit Singh, Pritam',
        album: 'Brahmāstra',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Romantic Melody',
        moodEmoji: '💖',
        likesCount: 14200,
        audioUrl: 'youtube:BddP6PYo2gs',
        lyrics: `Mujhko itna bataye koi
Kaise tujhse dil na lagaye koi
Rabba ne tujhko banane mein
Kardi hai husn ki khaali tijoriyan
Kajal ki siyahi se likhi
Hai tune jaane kitno ki love storiyan

Kesariya tera ishq hai piya
Rang jaaun jo main haath lagaun
Din beete saara teri fikr mein
Rain saari teri khair manaun`,
        description: 'Record-shattering Bollywood romantic masterpiece featuring Ranbir Kapoor and Alia Bhatt.',
      },
      {
        id: 'trend_naatu',
        title: 'Naatu Naatu',
        artist: 'M.M. Keeravaani, Rahul Sipligunj, Kaala Bhairava',
        album: 'RRR',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Energetic Dance',
        moodEmoji: '⚡',
        likesCount: 21500,
        audioUrl: 'youtube:OsU0CGZoV8E',
        lyrics: `Polam gattu dhummu lona pothettina thoota laaga
Gudumba baati thagatam laaga
Ratham gutti janda katti dookinattu
Naatu Naatu Naatu Naatu
Naatu Naatu Veera Naatu
Kiraaku Naatu Vachhiru choodu`,
        description: 'Oscar & Golden Globe winning infectious energetic dance hit from SS Rajamouli’s RRR.',
      },
      {
        id: 'trend_blinding',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        industry: 'Hollywood',
        language: 'English',
        genre: 'Synth-Pop / Retro',
        moodEmoji: '🕶️',
        likesCount: 18900,
        audioUrl: 'youtube:4NRXx6U8ABQ',
        lyrics: `Yeah
I've been tryna call
I've been on my own for long enough
Maybe you can show me how to love, maybe

I'm going through withdrawals
You don't even have to do too much
You can turn me on with just a touch, baby

I look around and Sin City's cold and empty
No one's around to judge me
I can't see clearly when you're gone

I said, ooh, I'm blinded by the lights
No, I can't sleep until I feel your touch`,
        description: 'Billboard #1 greatest hit of all time with irresistible 80s synthwaves.',
      },
      {
        id: 'trend_arabic',
        title: 'Arabic Kuthu - Halamithi Habibo',
        artist: 'Anirudh Ravichander, Jonita Gandhi',
        album: 'Beast',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Dance / Fusion',
        moodEmoji: '💃',
        likesCount: 12800,
        audioUrl: 'youtube:KUN5Uf9mObQ',
        lyrics: `Malama pitha pithadhey
Malama pithadhey
Halamithi Habibo
Halamithi Habibo
Balama aaha aahadhey
Balama aahadhey
Halamithi Habibo`,
        description: 'Anirudh viral dance chart-buster with Arabic-Tamil acoustic fusion.',
      },
      {
        id: 'trend_illuminati',
        title: 'Illuminati',
        artist: 'Sushin Shyam, Dabzee',
        album: 'Aavesham',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'Hip-Hop / Street Anthem',
        moodEmoji: '🔥',
        likesCount: 11400,
        audioUrl: 'youtube:tOM-nWPcR4U',
        lyrics: `Illuminati... Illuminati...
Kaathu vecha kaalam vannu
Koodikkayari kootu vannu
Otta vedi potti theernnu
Ranga Annan entry aayi!`,
        description: 'Fahadh Faasil’s thunderous Malayalam mega-hit anthem produced by Sushin Shyam.',
      },
    ],
  },
  {
    id: 'bollywood',
    name: 'Bollywood (Hindi Cinema)',
    description: 'Top 5 trending Bollywood songs loved by millions across India and the globe.',
    badge: 'Bollywood Top 5',
    icon: '🇮🇳',
    top5: [
      {
        id: 'b_kesariya',
        title: 'Kesariya',
        artist: 'Arijit Singh, Pritam',
        album: 'Brahmāstra',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Romantic',
        moodEmoji: '💖',
        likesCount: 14200,
        audioUrl: 'youtube:BddP6PYo2gs',
        lyrics: `Kesariya tera ishq hai piya
Rang jaaun jo main haath lagaun
Din beete saara teri fikr mein
Rain saari teri khair manaun`,
        description: 'Melodious romantic anthem from Brahmāstra.',
      },
      {
        id: 'b_chaleya',
        title: 'Chaleya',
        artist: 'Arijit Singh, Shilpa Rao, Anirudh',
        album: 'Jawan',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Romantic Groove',
        moodEmoji: '✨',
        likesCount: 13900,
        audioUrl: 'youtube:VAdGW7QDJUI',
        lyrics: `Ishq mein dil bana hai
Ishq mein dil fanaa hai
Jeete ji maut se kardi mulaqaat
Chaleya teri ore chaleya
Aan jahan tera pahiya ghume`,
        description: 'Shah Rukh Khan’s blockbuster upbeat romance composed by Anirudh.',
      },
      {
        id: 'b_tumhiho',
        title: 'Tum Hi Ho',
        artist: 'Arijit Singh, Mithoon',
        album: 'Aashiqui 2',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Soulful Sad / Romantic',
        moodEmoji: '💔',
        likesCount: 22800,
        audioUrl: 'youtube:Umqb9KENgmk',
        lyrics: `Hum tere bin ab reh nahi sakte
Tere bina kya wajood mera
Tujhse juda agar ho jayenge
Toh khud se hi ho jayenge judaa
Kyunki tum hi ho, ab tum hi ho
Zindagi ab tum hi ho`,
        description: 'The golden classic that defined modern Bollywood romance.',
      },
      {
        id: 'b_apnabana',
        title: 'Apna Bana Le',
        artist: 'Arijit Singh, Sachin-Jigar',
        album: 'Bhediya',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Acoustic Love',
        moodEmoji: '🌸',
        likesCount: 11800,
        audioUrl: 'youtube:ElZfdU54Cp8',
        lyrics: `Tu mera koi na hoke bhi kuch laage
Tu mera koi na hoke bhi kuch laage
Apna bana le piya, apna bana le piya
Dil ke nagar mein shehar tu basa le piya`,
        description: 'Heartwarming acoustic ballad featuring Varun Dhawan & Kriti Sanon.',
      },
      {
        id: 'b_raataan',
        title: 'Raataan Lambiyan',
        artist: 'Jubin Nautiyal, Asees Kaur, Tanishk Bagchi',
        album: 'Shershaah',
        industry: 'Bollywood',
        language: 'Hindi',
        genre: 'Soulful Love',
        moodEmoji: '🌙',
        likesCount: 16500,
        audioUrl: 'youtube:gvyUuxdRdR4',
        lyrics: `Teri meri gallan ho gayi mashhoor
Kar na kabhi tu mujhe nazron se door
Kithe chaliye tu kithe chaliye
Kaate kate na re raataan lambiyan
Suno re sajan ve lambiyan lambiyan`,
        description: 'Soulful melodic hit depicting timeless love and dedication.',
      },
    ],
  },
  {
    id: 'tollywood',
    name: 'Tollywood (Telugu Cinema)',
    description: 'Top 5 high-energy and soulful Telugu chart-busters dominating the screens.',
    badge: 'Tollywood Top 5',
    icon: '🎬',
    top5: [
      {
        id: 't_naatu',
        title: 'Naatu Naatu',
        artist: 'Rahul Sipligunj, Kaala Bhairava, M.M. Keeravaani',
        album: 'RRR',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Folk Dance',
        moodEmoji: '⚡',
        likesCount: 21500,
        audioUrl: 'youtube:OsU0CGZoV8E',
        lyrics: `Polam gattu dhummu lona pothettina thoota laaga
Naatu Naatu Naatu Naatu
Naatu Naatu Veera Naatu!`,
        description: 'The Oscar-winning energetic sensation by Ram Charan and Jr NTR.',
      },
      {
        id: 't_ooantava',
        title: 'Oo Antava Mava.. Oo Oo Antava',
        artist: 'Indravathi Chauhan, Devi Sri Prasad',
        album: 'Pushpa: The Rise',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Sensational Groove',
        moodEmoji: '🔥',
        likesCount: 17200,
        audioUrl: 'youtube:1kvyOgNssz4',
        lyrics: `Koka koka kadithe oka thodu
Cheera cheera katte oka thodu
Oo antava mava.. Oo oo antava mava!`,
        description: 'Samantha Ruth Prabhu’s viral dance anthem composed by DSP.',
      },
      {
        id: 't_srivalli',
        title: 'Srivalli',
        artist: 'Sid Sriram, Devi Sri Prasad',
        album: 'Pushpa: The Rise',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Melodic Hook',
        moodEmoji: '💃',
        likesCount: 19400,
        audioUrl: 'youtube:hcMzwMrr1tE',
        lyrics: `Choope bangaramayene srivalli
Maate manikyamayene
Nee chupulatho na gunde thadise`,
        description: 'Allu Arjun signature hook step with Sid Sriram’s velvet vocals.',
      },
      {
        id: 't_samaja',
        title: 'Samajavaragamana',
        artist: 'Sid Sriram, Thaman S',
        album: 'Ala Vaikunthapurramuloo',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Classy Melody',
        moodEmoji: '✨',
        likesCount: 15800,
        audioUrl: 'youtube:19m9qf5j0jY',
        lyrics: `Kallathone champesave samajavaragamana
Neetho nadavaga aasa padane manasa
Samajavaragamana ninnu chusina kshanamuna`,
        description: 'Classical fusion masterpiece with over a billion streams.',
      },
      {
        id: 't_buttabomma',
        title: 'Butta Bomma',
        artist: 'Armaan Malik, Thaman S',
        album: 'Ala Vaikunthapurramuloo',
        industry: 'Tollywood',
        language: 'Telugu',
        genre: 'Peppy Dance',
        moodEmoji: '🎧',
        likesCount: 16100,
        audioUrl: 'youtube:2mDCVzruYzQ',
        lyrics: `Inkem inkem inkem kaavaale
Chalu idhe chalu neekai
Butta bomma butta bomma nannu suthukuntive`,
        description: 'Infectious rhythm by Armaan Malik and Thaman S.',
      },
    ],
  },
  {
    id: 'hollywood',
    name: 'Hollywood & Global Pop',
    description: 'Top 5 worldwide English hits streamed by millions every single day.',
    badge: 'Hollywood Top 5',
    icon: '🌟',
    top5: [
      {
        id: 'h_blinding',
        title: 'Blinding Lights',
        artist: 'The Weeknd',
        album: 'After Hours',
        industry: 'Hollywood',
        language: 'English',
        genre: 'Synth-Pop',
        moodEmoji: '🕶️',
        likesCount: 18900,
        audioUrl: 'youtube:4NRXx6U8ABQ',
        lyrics: `I said, ooh, I'm blinded by the lights
No, I can't sleep until I feel your touch`,
        description: 'Global retro-synth phenomenon by The Weeknd.',
      },
      {
        id: 'h_shapeofyou',
        title: 'Shape of You',
        artist: 'Ed Sheeran',
        album: '÷ (Divide)',
        industry: 'Hollywood',
        language: 'English',
        genre: 'Pop / Dancehall',
        moodEmoji: '🔥',
        likesCount: 24500,
        audioUrl: 'youtube:JGwWNGJdvx8',
        lyrics: `The club isn't the best place to find a lover
So the bar is where I go
I'm in love with the shape of you
We push and pull like a magnet do`,
        description: 'Record-breaking multi-platinum track by Ed Sheeran.',
      },
      {
        id: 'h_cruelsummer',
        title: 'Cruel Summer',
        artist: 'Taylor Swift',
        album: 'Lover',
        industry: 'Hollywood',
        language: 'English',
        genre: 'Dream Pop / Synth',
        moodEmoji: '💖',
        likesCount: 17400,
        audioUrl: 'youtube:ic8j13piAhQ',
        lyrics: `Fever dream high in the quiet of the night
You know that I caught it
It's blue, the feeling I've got
And it's ooh, whoa, oh
It's a cruel summer`,
        description: 'Taylor Swift’s electric bridge and summer anthem.',
      },
      {
        id: 'h_asitwas',
        title: 'As It Was',
        artist: 'Harry Styles',
        album: "Harry's House",
        industry: 'Hollywood',
        language: 'English',
        genre: 'Indie Pop',
        moodEmoji: '🎧',
        likesCount: 16800,
        audioUrl: 'youtube:H5v3kku4y6Q',
        lyrics: `Hold on, as it was
You know it's not the same as it was
In this world, it's just us
You know it's not the same as it was`,
        description: 'Grammy-winning melodic indie pop earworm.',
      },
      {
        id: 'h_levitating',
        title: 'Levitating',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        industry: 'Hollywood',
        language: 'English',
        genre: 'Nu-Disco',
        moodEmoji: '⚡',
        likesCount: 15300,
        audioUrl: 'youtube:TUVcZfQe-Kw',
        lyrics: `If you wanna run away with me, I know a galaxy
And I can take you for a ride
I had a premonition that we fell into a rhythm
Where the music don't stop for life`,
        description: 'High-energy nu-disco dance favorite by Dua Lipa.',
      },
    ],
  },
  {
    id: 'kollywood',
    name: 'Kollywood (Tamil Cinema)',
    description: 'Top 5 Tamil bangers by Anirudh, AR Rahman, and top composers.',
    badge: 'Kollywood Top 5',
    icon: '🥁',
    top5: [
      {
        id: 'k_arabic',
        title: 'Arabic Kuthu - Halamithi Habibo',
        artist: 'Anirudh Ravichander, Jonita Gandhi',
        album: 'Beast',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Dance',
        moodEmoji: '💃',
        likesCount: 12800,
        audioUrl: 'youtube:KUN5Uf9mObQ',
        lyrics: `Malama pitha pithadhey
Halamithi Habibo
Halamithi Habibo`,
        description: 'Anirudh and Thalapathy Vijay’s explosive dance track.',
      },
      {
        id: 'k_hukum',
        title: 'Hukum - Thalaivar Alappara',
        artist: 'Anirudh Ravichander, Super Subu',
        album: 'Jailer',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Mass Anthem',
        moodEmoji: '🔥',
        likesCount: 16200,
        audioUrl: 'youtube:1F3hm6cEt4c',
        lyrics: `Alappara kelaparom thalaivar nirandharam!
Hukum tiger ka hukum!
Kedaikkaradha pudichu thinnu
Poraadra rathathil irukku!`,
        description: 'Rajinikanth’s roaring mass anthem from Jailer.',
      },
      {
        id: 'k_rowdy',
        title: 'Rowdy Baby',
        artist: 'Dhanush, Dhee, Yuvan Shankar Raja',
        album: 'Maari 2',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Folk Pop',
        moodEmoji: '✨',
        likesCount: 18400,
        audioUrl: 'youtube:x6Q7c9RyMzk',
        lyrics: `Hey en rowdy baby
Un kooda naan serndha
Kuthu paatu kekkum kaadhukulla
Rowdy baby!`,
        description: 'Over 1.5 billion views dance craze by Prabhu Deva, Dhanush and Sai Pallavi.',
      },
      {
        id: 'k_enjaami',
        title: 'Enjoy Enjaami',
        artist: 'Dhee, Arivu, Santhosh Narayanan',
        album: 'Single',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Indie Folk',
        moodEmoji: '🌿',
        likesCount: 14700,
        audioUrl: 'youtube:eYq7WapuDLU',
        lyrics: `Enjoy enjaami vaango vaango onnaagi
Amma ambaari aada varum kaalathila
Kallum mullum kadandhu vanthom`,
        description: 'Celebrated indie folk anthem connecting roots, earth, and music.',
      },
      {
        id: 'k_vaathi',
        title: 'Vaathi Coming',
        artist: 'Anirudh Ravichander, Gana Balachandar',
        album: 'Master',
        industry: 'Kollywood',
        language: 'Tamil',
        genre: 'Kuthu Beats',
        moodEmoji: '⚡',
        likesCount: 15900,
        audioUrl: 'youtube:fRD_3vJagxk',
        lyrics: `Vaathi coming othukko!
Step-u pottu adichukko!
Gana paattu oruthukko!`,
        description: 'Shoulder-drop dance steps that swept across sports stadiums and clubs.',
      },
    ],
  },
  {
    id: 'punjabi',
    name: 'Punjabi Music (Pollywood)',
    description: 'Top 5 high-bass, viral Punjabi anthems and chart-toppers.',
    badge: 'Punjabi Top 5',
    icon: '🔥',
    top5: [
      {
        id: 'p_295',
        title: '295',
        artist: 'Sidhu Moose Wala',
        album: 'Moosetape',
        industry: 'Punjabi',
        language: 'Punjabi',
        genre: 'Desi Hip-Hop',
        moodEmoji: '🔥',
        likesCount: 26000,
        audioUrl: 'youtube:n_FCrCQ6-bA',
        lyrics: `Dass ki banuga jithe sach bolna paap ho gaya
Hass ke bolna tussi gallan sachiyan sunaunde ho
Karde aish 295 lagg jau!`,
        description: 'The legendary chart-topping anthem by Sidhu Moose Wala.',
      },
      {
        id: 'p_brownmunde',
        title: 'Brown Munde',
        artist: 'AP Dhillon, Gurinder Gill, Shinda Kahlon',
        album: 'Single',
        industry: 'Punjabi',
        language: 'Punjabi',
        genre: 'Trap / Hip-Hop',
        moodEmoji: '🕶️',
        likesCount: 19800,
        audioUrl: 'youtube:VNs_cCtdbPc',
        lyrics: `Desi munde desi look
Saare shehar ch saada khauf
Brown Munde! Brown Munde!`,
        description: 'Global breakthrough trap anthem representing South Asian youth.',
      },
      {
        id: 'p_borntoshine',
        title: 'Born to Shine',
        artist: 'Diljit Dosanjh',
        album: 'G.O.A.T.',
        industry: 'Punjabi',
        language: 'Punjabi',
        genre: 'Bhangra Urban',
        moodEmoji: '✨',
        likesCount: 17300,
        audioUrl: 'youtube:cl0a3i2wFcc',
        lyrics: `Born to shine!
O baaba ji da hath saade sir te
Kise to darrde ni kade piche mud de ni
Born to shine!`,
        description: 'High-energy celebration of success and confidence by Diljit Dosanjh.',
      },
      {
        id: 'p_lover',
        title: 'Lover',
        artist: 'Diljit Dosanjh, Intense',
        album: 'MoonChild Era',
        industry: 'Punjabi',
        language: 'Punjabi',
        genre: 'Synth Pop',
        moodEmoji: '💖',
        likesCount: 15400,
        audioUrl: 'youtube:mH_LFkWxpI0',
        lyrics: `Tera ni mai lover, ho gaya ni lover
Jado da mai takkeya tenu
Bhul gaya jagg sara`,
        description: 'Smooth 80s synth-pop love confession by Diljit.',
      },
      {
        id: 'p_excuses',
        title: 'Excuses',
        artist: 'AP Dhillon, Gurinder Gill, Intense',
        album: 'Single',
        industry: 'Punjabi',
        language: 'Punjabi',
        genre: 'Melancholic Trap',
        moodEmoji: '💔',
        likesCount: 18200,
        audioUrl: 'youtube:vX2cDW8LUWk',
        lyrics: `Kehndi hundi si chan tak raah bana de
Taare ne pasand mainu hethaan saare laa de
Dil tera jad tutuga ta pata laguga`,
        description: 'The viral "Kehndi Hundi Si" heartbreak earworm.',
      },
    ],
  },
  {
    id: 'sandalwood',
    name: 'Sandalwood (Kannada Cinema)',
    description: 'Top 5 high-voltage Kannada anthems and deep folk melodies.',
    badge: 'Sandalwood Top 5',
    icon: '⚜️',
    top5: [
      {
        id: 's_singara',
        title: 'Singara Siriye',
        artist: 'Vijay Prakash, Ananya Bhat, Ajaneesh Loknath',
        album: 'Kantara',
        industry: 'Sandalwood',
        language: 'Kannada',
        genre: 'Folk Romance',
        moodEmoji: '💖',
        likesCount: 14600,
        audioUrl: 'youtube:2kL3p0vYk8c',
        lyrics: `Singara siriye kenneya thoreye
Nanna preetiya chiguru neene
Kantara da haadu nanna usiru`,
        description: 'Magical evergreen folk romance from Rishab Shetty’s Kantara.',
      },
      {
        id: 's_varaha',
        title: 'Varaha Roopam',
        artist: 'Sai Vignesh, Ajaneesh Loknath',
        album: 'Kantara',
        industry: 'Sandalwood',
        language: 'Kannada',
        genre: 'Devotional / Classical',
        moodEmoji: '⚡',
        likesCount: 18900,
        audioUrl: 'youtube:l4T_M8B5e4s',
        lyrics: `Varaha roopam daiva varenyam
Sathyam shivam sundaram
Daiva narthana bhoomi ithu`,
        description: 'Soul-stirring divine climax anthem of Kantara.',
      },
      {
        id: 's_sulthana',
        title: 'Sulthana',
        artist: 'Ravi Basrur, Mohan Krishna',
        album: 'KGF Chapter 2',
        industry: 'Sandalwood',
        language: 'Kannada',
        genre: 'Heavy Mass Beats',
        moodEmoji: '🔥',
        likesCount: 19500,
        audioUrl: 'youtube:4gDcsYV2xJ4',
        lyrics: `Sulthan sulthan dharani dharani
Rocky bhai garjana nodu
KGF raajya nannadu`,
        description: 'Thunderous background mass anthem of Rocky Bhai in KGF.',
      },
      {
        id: 's_rakkamma',
        title: 'Ra Ra Rakkamma',
        artist: 'Sunidhi Chauhan, Nakash Aziz, Ajaneesh Loknath',
        album: 'Vikrant Rona',
        industry: 'Sandalwood',
        language: 'Kannada',
        genre: 'Party Dance',
        moodEmoji: '💃',
        likesCount: 13200,
        audioUrl: 'youtube:78o6i0iU2v0',
        lyrics: `Ra Ra Rakkamma gadang rathiyamma!
Hejjeya nodamma, jaadhe bidthamma!`,
        description: 'Jacqueline Fernandez & Kiccha Sudeep’s sensational party hook.',
      },
      {
        id: 's_tagaru',
        title: 'Tagaru Banthu Tagaru',
        artist: 'Anthony Daasan, Charan Raj',
        album: 'Tagaru',
        industry: 'Sandalwood',
        language: 'Kannada',
        genre: 'Cult Folk Rock',
        moodEmoji: '⚡',
        likesCount: 11200,
        audioUrl: 'youtube:8WvU5yM7h2k',
        lyrics: `Tagaru banthu tagaru!
Shivarajkumar entry nodu!
Charan Raj thumping beats!`,
        description: 'Shivarajkumar’s cult energetic police anthem.',
      },
    ],
  },
  {
    id: 'mollywood',
    name: 'Mollywood (Malayalam Cinema)',
    description: 'Top 5 Malayalam street anthems and soul-stirring melodies.',
    badge: 'Mollywood Top 5',
    icon: '🌴',
    top5: [
      {
        id: 'm_illuminati',
        title: 'Illuminati',
        artist: 'Sushin Shyam, Dabzee',
        album: 'Aavesham',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'Hip-Hop Anthem',
        moodEmoji: '🔥',
        likesCount: 16800,
        audioUrl: 'youtube:tOM-nWPcR4U',
        lyrics: `Illuminati... Illuminati...
Kaathu vecha kaalam vannu
Ranga Annan entry aayi!`,
        description: 'Mega-viral street hip-hop anthem from Aavesham.',
      },
      {
        id: 'm_darshana',
        title: 'Darshana',
        artist: 'Hesham Abdul Wahab, Pranav Mohanlal',
        album: 'Hridayam',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'College Romance',
        moodEmoji: '💖',
        likesCount: 15900,
        audioUrl: 'youtube:tCwt_O-4nZ8',
        lyrics: `Darshana...
Kaarmukil varnane kande njan
En hridayam thudikkuvaan thudangi
Darshana...`,
        description: 'College nostalgic romantic anthem from Hridayam.',
      },
      {
        id: 'm_jaada',
        title: 'Jaada',
        artist: 'Sushin Shyam, Sreenath Bhasi',
        album: 'Aavesham',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'Funky Grooves',
        moodEmoji: '✨',
        likesCount: 12400,
        audioUrl: 'youtube:X2fQ4O5jL1Q',
        lyrics: `Jaada jaada jaada thanne
Aavesham kootti njan vannu
Vibe ithaanu!`,
        description: 'Addictive quirky bassline track by Sushin Shyam.',
      },
      {
        id: 'm_pavizha',
        title: 'Pavizha Mazha',
        artist: 'KS Harisankar, PS Jayhari',
        album: 'Athiran',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'Rain Romance',
        moodEmoji: '🌙',
        likesCount: 13600,
        audioUrl: 'youtube:kOQ1z7n5F5M',
        lyrics: `Pavizha mazhaye nee peyyumo
Ente priyane thazhukaan
Oro thulliyilum sneham niraye`,
        description: 'Ethereal rain melody with KS Harisankar’s magical vocals.',
      },
      {
        id: 'm_kalyana',
        title: 'Kalyana Kacheri',
        artist: 'Jassie Gift, Sayanora Philip',
        album: 'Madhura Manohara Moham',
        industry: 'Mollywood',
        language: 'Malayalam',
        genre: 'Festive Beats',
        moodEmoji: '🎉',
        likesCount: 10800,
        audioUrl: 'youtube:3vF8w9mO2xY',
        lyrics: `Kalyana kacheri paadu
Aaravam koottu
Utsavam thudangukayaayi!`,
        description: 'Festive energetic celebration song.',
      },
    ],
  },
];
