import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Like, Dislike, or Unlike a Story Album or Chapter
export async function POST(request: Request) {
  try {
    const { targetType, targetId, action, username } = await request.json();

    if (!targetId || !username || !targetType) {
      return NextResponse.json(
        { error: 'targetType (album | chapter), targetId, action (like | dislike | unlike), and username are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.toLowerCase().trim();

    if (targetType === 'album') {
      const album = await prisma.storyAlbum.findUnique({ where: { id: targetId } });
      if (!album) {
        return NextResponse.json({ error: 'Album not found' }, { status: 404 });
      }

      let likedBy = Array.isArray(album.likedBy) ? [...album.likedBy] : [];
      let dislikedBy = Array.isArray(album.dislikedBy) ? [...album.dislikedBy] : [];

      if (action === 'like') {
        if (!likedBy.includes(cleanUsername)) likedBy.push(cleanUsername);
        dislikedBy = dislikedBy.filter((u) => u !== cleanUsername);
      } else if (action === 'dislike') {
        if (!dislikedBy.includes(cleanUsername)) dislikedBy.push(cleanUsername);
        likedBy = likedBy.filter((u) => u !== cleanUsername);
      } else if (action === 'unlike') {
        likedBy = likedBy.filter((u) => u !== cleanUsername);
        dislikedBy = dislikedBy.filter((u) => u !== cleanUsername);
      }

      const updated = await prisma.storyAlbum.update({
        where: { id: targetId },
        data: {
          likesCount: likedBy.length,
          dislikesCount: dislikedBy.length,
          likedBy,
          dislikedBy,
        },
      });

      return NextResponse.json({ success: true, album: updated }, { status: 200 });
    } else {
      // chapter
      const chapter = await prisma.storyChapter.findUnique({ where: { id: targetId } });
      if (!chapter) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }

      let likedBy = Array.isArray(chapter.likedBy) ? [...chapter.likedBy] : [];
      let dislikedBy = Array.isArray(chapter.dislikedBy) ? [...chapter.dislikedBy] : [];

      if (action === 'like') {
        if (!likedBy.includes(cleanUsername)) likedBy.push(cleanUsername);
        dislikedBy = dislikedBy.filter((u) => u !== cleanUsername);
      } else if (action === 'dislike') {
        if (!dislikedBy.includes(cleanUsername)) dislikedBy.push(cleanUsername);
        likedBy = likedBy.filter((u) => u !== cleanUsername);
      } else if (action === 'unlike') {
        likedBy = likedBy.filter((u) => u !== cleanUsername);
        dislikedBy = dislikedBy.filter((u) => u !== cleanUsername);
      }

      const updated = await prisma.storyChapter.update({
        where: { id: targetId },
        data: {
          likesCount: likedBy.length,
          dislikesCount: dislikedBy.length,
          likedBy,
          dislikedBy,
        },
      });

      return NextResponse.json({ success: true, chapter: updated }, { status: 200 });
    }
  } catch (error) {
    console.error('Story Like API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
