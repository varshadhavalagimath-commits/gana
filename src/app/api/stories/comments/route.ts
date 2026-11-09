import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch comments for a Story Album
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');

    if (!albumId) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    const comments = await prisma.storyComment.findMany({
      where: { albumId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ comments }, { status: 200 });
  } catch (error) {
    console.error('Story Comments GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Add a comment to a story album
export async function POST(request: Request) {
  try {
    const { albumId, username, text } = await request.json();

    if (!albumId || !username || !text?.trim()) {
      return NextResponse.json({ error: 'Album ID, username, and comment text are required' }, { status: 400 });
    }

    const comment = await prisma.storyComment.create({
      data: {
        albumId,
        username: username.toLowerCase().trim(),
        text: text.trim(),
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Story Comment POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a story comment (by author or admin)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let username = searchParams.get('username');

    if (!id) {
      try {
        const body = await request.json();
        id = body.id;
        username = body.username;
      } catch {
        // query param
      }
    }

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const existing = await prisma.storyComment.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (
      username &&
      username.toLowerCase() !== existing.username.toLowerCase() &&
      username.toLowerCase() !== 'admin'
    ) {
      return NextResponse.json({ error: 'Unauthorized to delete this comment' }, { status: 403 });
    }

    await prisma.storyComment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Comment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Story Comment DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
