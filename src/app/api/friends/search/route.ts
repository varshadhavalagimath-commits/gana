import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const currentUsername = searchParams.get('currentUser')?.trim().toLowerCase() || '';

    // Search users by username, excluding current user.
    // If a query is provided, match by substring (case-insensitive in SQLite).
    // If no query is provided, return alphabetical list of other users.
    const users = await prisma.user.findMany({
      where: {
        ...(query ? { username: { contains: query } } : {}),
        ...(currentUsername ? { NOT: { username: currentUsername } } : {})
      },
      select: {
        id: true,
        username: true,
        isPrivate: true
      },
      orderBy: {
        username: 'asc'
      },
      take: 25
    });

    if (!currentUsername) {
      const usersWithStatus = users.map((u) => ({
        ...u,
        relationshipStatus: 'NONE' as const
      }));
      return NextResponse.json({ users: usersWithStatus }, { status: 200 });
    }

    const targetUsernames = users.map((u) => u.username);
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: currentUsername, friendId: { in: targetUsernames } },
          { friendId: currentUsername, userId: { in: targetUsernames } }
        ]
      }
    });

    const usersWithStatus = users.map((u) => {
      const targetName = u.username.toLowerCase();
      const existing = friendships.find(
        (f) =>
          (f.userId.toLowerCase() === currentUsername && f.friendId.toLowerCase() === targetName) ||
          (f.friendId.toLowerCase() === currentUsername && f.userId.toLowerCase() === targetName)
      );

      let relationshipStatus: 'FRIENDS' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE' = 'NONE';
      if (existing) {
        if (existing.status === 'ACCEPTED') {
          relationshipStatus = 'FRIENDS';
        } else if (existing.status === 'PENDING') {
          if (existing.userId.toLowerCase() === currentUsername) {
            relationshipStatus = 'REQUEST_SENT';
          } else {
            relationshipStatus = 'REQUEST_RECEIVED';
          }
        }
      }

      return {
        ...u,
        relationshipStatus
      };
    });

    return NextResponse.json({ users: usersWithStatus }, { status: 200 });
  } catch (error) {
    console.error('Search Users API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
