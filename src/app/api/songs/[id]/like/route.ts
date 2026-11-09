import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    // Resolve params which might be a Promise in Next.js 15
    const resolvedParams = await params;
    const songId = resolvedParams.id;

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        likesCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ song: updatedSong }, { status: 200 });
  } catch (error) {
    console.error('Like API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
