import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch all comments for a song
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { songId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Comments GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

const BAD_WORDS_BLACKLIST = [
  'fuck', 'shit', 'ass', 'bitch', 'bastard', 'crap', 'dick', 'pussy', 'cunt',
  'asshole', 'faggot', 'nigger', 'retard', 'whore', 'slut', 'idiot', 'stupid',
  'dumbass', 'motherfucker', 'cock', 'piss'
];

// POST: Add a comment to a song
export async function POST(request: Request) {
  try {
    const { songId, username, text } = await request.json();

    if (!songId || !username || !text?.trim()) {
      return NextResponse.json({ error: 'Song ID, username, and comment text are required' }, { status: 400 });
    }

    const cleanText = text.toLowerCase().trim();
    // Filter profanity word boundaries
    const hasBadWord = BAD_WORDS_BLACKLIST.some((badWord) => {
      const regex = new RegExp(`\\b${badWord}\\b`, 'i');
      return regex.test(cleanText);
    });

    if (hasBadWord) {
      return NextResponse.json({
        error: 'Comment contains restricted language/profanity. Please keep comments respectful and positive!'
      }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        songId,
        username: username.toLowerCase().trim(),
        text: text.trim()
      }
    });

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error('Comments POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
