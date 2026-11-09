import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch message history between two users and mark incoming messages as read
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userA = searchParams.get('sender')?.toLowerCase();
    const userB = searchParams.get('receiver')?.toLowerCase();

    if (!userA || !userB) {
      return NextResponse.json({ error: 'Both sender and receiver usernames are required' }, { status: 400 });
    }

    // Automatically mark all unread messages sent by userB to userA as read (WhatsApp style)
    await prisma.chatMessage.updateMany({
      where: {
        senderUsername: userB,
        receiverUsername: userA,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderUsername: userA, receiverUsername: userB },
          { senderUsername: userB, receiverUsername: userA },
        ],
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Chat GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Send a message to a friend
export async function POST(request: Request) {
  try {
    const { senderUsername, receiverUsername, text, sharedSongId } = await request.json();

    if (!senderUsername || !receiverUsername) {
      return NextResponse.json({ error: 'Sender and receiver usernames are required' }, { status: 400 });
    }

    if (!text && !sharedSongId) {
      return NextResponse.json({ error: 'Cannot send an empty message' }, { status: 400 });
    }

    const sender = senderUsername.trim().toLowerCase();
    const receiver = receiverUsername.trim().toLowerCase();

    // Verify friendship exists before sending messages (accepted friendships only)
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: sender, friendId: receiver },
          { userId: receiver, friendId: sender },
        ],
        status: 'ACCEPTED',
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'You must be friends to chat' }, { status: 403 });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        senderUsername: sender,
        receiverUsername: receiver,
        text: text || '',
        sharedSongId: sharedSongId || null,
        isRead: false,
      },
    });

    return NextResponse.json({ message: newMessage }, { status: 201 });
  } catch (error) {
    console.error('Chat POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Mark messages from a specific friend as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const sender = (body.senderUsername || body.sender || '').trim().toLowerCase();
    const receiver = (body.receiverUsername || body.receiver || '').trim().toLowerCase();

    if (!sender || !receiver) {
      return NextResponse.json({ error: 'Both sender and receiver are required' }, { status: 400 });
    }

    await prisma.chatMessage.updateMany({
      where: {
        senderUsername: sender,
        receiverUsername: receiver,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Chat PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
