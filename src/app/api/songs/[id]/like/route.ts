import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const songId = resolvedParams.id;

    if (!songId) {
      return NextResponse.json({ error: 'Song ID is required' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty on simple POST calls
    }

    const { action, username } = body;

    const song = await prisma.song.findUnique({
      where: { id: songId }
    });

    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    const currentLikedBy = Array.isArray(song.likedBy) ? song.likedBy : [];
    const cleanUsername = username ? String(username).toLowerCase().trim() : null;

    let shouldUnlike = false;
    if (action === 'unlike') {
      shouldUnlike = true;
    } else if (action === 'like') {
      shouldUnlike = false;
    } else if (cleanUsername && currentLikedBy.includes(cleanUsername)) {
      shouldUnlike = true;
    }

    let updatedLikedBy: string[];
    let newLikesCount: number;

    if (shouldUnlike) {
      updatedLikedBy = cleanUsername ? currentLikedBy.filter((u) => u !== cleanUsername) : currentLikedBy;
      newLikesCount = Math.max(0, song.likesCount - 1);
    } else {
      updatedLikedBy = cleanUsername && !currentLikedBy.includes(cleanUsername)
        ? [...currentLikedBy, cleanUsername]
        : currentLikedBy;
      newLikesCount = song.likesCount + 1;
    }

    const updatedSong = await prisma.song.update({
      where: { id: songId },
      data: {
        likesCount: newLikesCount,
        likedBy: updatedLikedBy,
      }
    });

    return NextResponse.json({
      song: updatedSong,
      isLiked: !shouldUnlike,
      action: shouldUnlike ? 'unliked' : 'liked'
    }, { status: 200 });
  } catch (error) {
    console.error('Like API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
