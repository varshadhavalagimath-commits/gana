import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'auto'; // 'signin' | 'signup' | 'auto'

    // 1. Explicit SIGN IN flow
    if (action === 'signin') {
      const identifier = (body.identifier || body.username || body.email || '').trim().toLowerCase();

      if (!identifier) {
        return NextResponse.json(
          { error: 'Please enter your username or email address to sign in' },
          { status: 400 }
        );
      }

      // Look up user by either username or email
      let user = await prisma.user.findFirst({
        where: {
          OR: [{ username: identifier }, { email: identifier }],
        },
      });

      // Special auto-provision for admin if not found
      if (!user && (identifier === 'admin' || identifier === 'admin@gana.fm')) {
        user = await prisma.user.create({
          data: {
            username: 'admin',
            email: 'admin@gana.fm',
            isPrivate: false,
            role: 'ADMIN',
          },
        });
      }

      if (!user) {
        return NextResponse.json(
          {
            error: `No account found for "${identifier}". Please check your details or click "Sign Up" to create an account.`,
          },
          { status: 404 }
        );
      }

      const roleBadge = user.role === 'SINGER' ? '🎤 Singer' : user.role === 'ADMIN' ? '👑 Main Admin' : '🎧 Listener';
      return NextResponse.json(
        { user, message: `Welcome back, @${user.username} (${roleBadge})!` },
        { status: 200 }
      );
    }

    // 2. Explicit SIGN UP flow
    if (action === 'signup') {
      const { email, username, isPrivate } = body;
      const requestedRole = (body.role || 'USER').toUpperCase();
      const role = requestedRole === 'SINGER' ? 'SINGER' : requestedRole === 'ADMIN' ? 'ADMIN' : 'USER';

      if (!email || !username) {
        return NextResponse.json(
          { error: 'Both email address and username are required to sign up' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanUsername = username.trim().toLowerCase();

      // Verify username formatting (alphanumeric and underscores, 3-15 chars)
      if (!/^[a-z0-9_]{3,15}$/.test(cleanUsername)) {
        return NextResponse.json(
          { error: 'Username must be 3-15 alphanumeric characters or underscores' },
          { status: 400 }
        );
      }

      // Verify email formatting
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { error: 'Please enter a valid email address' },
          { status: 400 }
        );
      }

      // Check if email already registered
      const existingEmail = await prisma.user.findUnique({
        where: { email: cleanEmail },
      });

      if (existingEmail) {
        return NextResponse.json(
          {
            error: `This email is already registered to @${existingEmail.username}. Switch to "Sign In" to access your account.`,
          },
          { status: 409 }
        );
      }

      // Check if username already taken
      const existingUsername = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (existingUsername) {
        return NextResponse.json(
          {
            error: `Username @${cleanUsername} is already taken. Click "Suggest Username" for a unique name!`,
          },
          { status: 409 }
        );
      }

      // Create new user account with role
      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          isPrivate: !!isPrivate,
          role,
        },
      });

      const roleBadge = role === 'SINGER' ? '🎤 Singer' : '🎧 Listener';
      return NextResponse.json(
        {
          user: newUser,
          message: `Account created successfully! Welcome to Gana as a ${roleBadge}, @${newUser.username}!`,
        },
        { status: 201 }
      );
    }

    // 3. Fallback backward-compatible auto flow
    const { email, username, isPrivate } = body;

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,15}$/.test(cleanUsername)) {
      return NextResponse.json(
        { error: 'Username must be 3-15 alphanumeric characters or underscores' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    let message = 'Logged in successfully';
    let status = 200;

    if (user) {
      if (user.username !== cleanUsername) {
        return NextResponse.json(
          {
            error: `This email is already registered to @${user.username}. Please enter the correct username to log in.`,
          },
          { status: 400 }
        );
      }
    } else {
      const usernameExists = await prisma.user.findUnique({
        where: { username: cleanUsername },
      });

      if (usernameExists) {
        return NextResponse.json(
          {
            error: `Username @${cleanUsername} is already taken. Try generating a unique one!`,
          },
          { status: 400 }
        );
      }

      user = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          isPrivate: !!isPrivate,
          role: cleanUsername === 'admin' ? 'ADMIN' : (body.role || 'USER').toUpperCase() === 'SINGER' ? 'SINGER' : 'USER',
        },
      });
      message = 'Account created successfully';
      status = 201;
    }

    return NextResponse.json({ user, message }, { status });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
