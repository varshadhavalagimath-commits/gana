import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Fetch accepted friends list AND pending follow/friend requests for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username')?.trim().toLowerCase();

    if (!username) {
      return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
    }

    // 1. Fetch all accepted friendships (both ways)
    const acceptedFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: username },
          { friendId: username }
        ],
        status: 'ACCEPTED'
      }
    });

    const friendUsernames = acceptedFriendships.map(f => 
      f.userId === username ? f.friendId : f.userId
    );

    const friendsList = await prisma.user.findMany({
      where: { username: { in: friendUsernames } },
      select: { id: true, username: true, isPrivate: true }
    });

    // Compute unread messages count and latest message for each friend (WhatsApp style)
    let totalUnreadCount = 0;
    const friendsWithMeta = await Promise.all(
      friendsList.map(async (friend) => {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            senderUsername: friend.username,
            receiverUsername: username,
            isRead: false,
          },
        });

        totalUnreadCount += unreadCount;

        const latestMsg = await prisma.chatMessage.findFirst({
          where: {
            OR: [
              { senderUsername: username, receiverUsername: friend.username },
              { senderUsername: friend.username, receiverUsername: username },
            ],
          },
          orderBy: { timestamp: 'desc' },
          select: { text: true, sharedSongId: true, timestamp: true },
        });

        return {
          ...friend,
          unreadCount,
          lastMessage: latestMsg
            ? latestMsg.text || (latestMsg.sharedSongId ? '🎶 Shared a track' : '')
            : null,
          lastMessageTime: latestMsg?.timestamp || null,
        };
      })
    );

    // Sort friends list: unread messages first, then most recent message timestamp
    friendsWithMeta.sort((a, b) => {
      if ((b.unreadCount || 0) !== (a.unreadCount || 0)) {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      }
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.username.localeCompare(b.username);
    });

    // 2. Fetch incoming friend requests (where current user is receiver and status is PENDING)
    const incomingRequests = await prisma.friendship.findMany({
      where: {
        friendId: username,
        status: 'PENDING'
      },
      select: {
        id: true,
        userId: true, // The requester username
        createdAt: true
      }
    });

    // 3. Fetch outgoing friend requests (where current user is sender and status is PENDING)
    const outgoingRequests = await prisma.friendship.findMany({
      where: {
        userId: username,
        status: 'PENDING'
      },
      select: {
        id: true,
        friendId: true, // The target username
        createdAt: true
      }
    });

    return NextResponse.json({
      friends: friendsWithMeta,
      totalUnreadCount,
      incomingRequests,
      outgoingRequests,
    }, { status: 200 });
  } catch (error) {
    console.error('Friends GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Send friend request to a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const requester = (body.requesterUsername || body.username || '').trim().toLowerCase();
    const target = (body.targetUsername || body.friendUsername || '').trim().toLowerCase();

    if (!requester || !target) {
      return NextResponse.json({ error: 'Both requester and target usernames are required' }, { status: 400 });
    }

    if (requester === target) {
      return NextResponse.json({ error: 'You cannot send a friend request to yourself' }, { status: 400 });
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { username: target }
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
    }

    // Check if friendship/connection already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: requester, friendId: target },
          { userId: target, friendId: requester }
        ]
      }
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'PENDING') {
        if (existingFriendship.userId === requester) {
          return NextResponse.json({ 
            message: 'Friend request is already pending approval', 
            friendship: existingFriendship,
            isPending: true 
          }, { status: 200 });
        } else {
          // The target had already requested requester; auto-accept mutual connection!
          const acceptedFriendship = await prisma.friendship.update({
            where: { id: existingFriendship.id },
            data: { status: 'ACCEPTED' }
          });
          return NextResponse.json({ 
            message: 'Mutual request accepted! You are now friends.', 
            friendship: acceptedFriendship,
            status: 'ACCEPTED' 
          }, { status: 200 });
        }
      }
      return NextResponse.json({ 
        message: 'You are already connected as friends', 
        friendship: existingFriendship,
        isPending: false 
      }, { status: 200 });
    }

    // Create friend request with PENDING status so other person can accept or reject
    const newFriendship = await prisma.friendship.create({
      data: {
        userId: requester,
        friendId: target,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ 
      message: 'Friend request sent successfully!', 
      friendship: newFriendship,
      status: 'PENDING' 
    }, { status: 201 });
  } catch (error) {
    console.error('Friends POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH: Accept an incoming friend request
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const requester = (body.requesterUsername || body.username || '').trim().toLowerCase();
    const target = (body.targetUsername || body.friendUsername || '').trim().toLowerCase();

    if (!requester || !target) {
      return NextResponse.json({ error: 'Both requesterUsername and targetUsername are required' }, { status: 400 });
    }

    // Find the pending relationship
    const pendingRelationship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: requester, friendId: target, status: 'PENDING' },
          { userId: target, friendId: requester, status: 'PENDING' }
        ]
      }
    });

    if (!pendingRelationship) {
      return NextResponse.json({ error: 'No pending friend request found' }, { status: 404 });
    }

    // Update status to ACCEPTED
    const updatedFriendship = await prisma.friendship.update({
      where: {
        id: pendingRelationship.id
      },
      data: { status: 'ACCEPTED' }
    });

    return NextResponse.json({ 
      message: 'Friend request accepted! You can now chat and share.', 
      friendship: updatedFriendship 
    }, { status: 200 });
  } catch (error) {
    console.error('Friends PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Reject an incoming request or remove connection
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let requester = searchParams.get('requesterUsername')?.trim().toLowerCase() ||
                    searchParams.get('username')?.trim().toLowerCase() || '';
    let target = searchParams.get('targetUsername')?.trim().toLowerCase() ||
                 searchParams.get('friendUsername')?.trim().toLowerCase() || '';

    if (!requester || !target) {
      try {
        const body = await request.json();
        requester = requester || (body.requesterUsername || body.username || '').trim().toLowerCase();
        target = target || (body.targetUsername || body.friendUsername || '').trim().toLowerCase();
      } catch (e) {
        // Body was empty or not json, continue
      }
    }

    if (!requester || !target) {
      return NextResponse.json({ error: 'Both requester and target usernames are required' }, { status: 400 });
    }

    // Delete friendship
    const result = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId: requester, friendId: target },
          { userId: target, friendId: requester }
        ]
      }
    });

    return NextResponse.json({ 
      message: 'Friend request rejected / removed successfully',
      deletedCount: result.count
    }, { status: 200 });
  } catch (error) {
    console.error('Friends DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
