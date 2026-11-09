import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { username, isPrivate } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    const updatedUser = await prisma.user.update({
      where: { username: cleanUsername },
      data: { isPrivate: Boolean(isPrivate) }
    });

    return NextResponse.json({ user: updatedUser, message: 'Privacy settings updated' }, { status: 200 });
  } catch (error) {
    console.error('Privacy Toggle API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
