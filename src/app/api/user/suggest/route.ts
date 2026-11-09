import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const prefixes = ['sonic', 'rhythm', 'melodic', 'lofi', 'synth', 'vibe', 'tempo', 'beat', 'harmony', 'chord', 'pitch', 'octave'];
const suffixes = ['wave', 'tracker', 'pulse', 'beats', 'coder', 'mix', 'echo', 'notes', 'groove', 'sound', 'loop', 'dj'];

export async function GET() {
  try {
    let found = false;
    let username = '';
    let attempts = 0;

    // Generate and check availability in database up to 10 attempts
    while (!found && attempts < 10) {
      attempts++;
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const num = Math.floor(10 + Math.random() * 90); // 2 digit random number
      username = `${prefix}_${suffix}_${num}`;

      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        found = true;
      }
    }

    if (!found) {
      username = `gana_user_${Math.floor(100 + Math.random() * 900)}`;
    }

    return NextResponse.json({ username }, { status: 200 });
  } catch (error) {
    console.error('Suggest Username API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
