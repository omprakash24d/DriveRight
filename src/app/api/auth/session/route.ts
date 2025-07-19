
import { getAdminApp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { idToken } = await req.json();

  const adminApp = getAdminApp();
  if (!adminApp) {
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Set session expiration to 5 days.
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
  try {
    const sessionCookie = await getAdminApp()?.auth().createSessionCookie(idToken, { expiresIn });
    if (sessionCookie) {
        cookies().set('__session', sessionCookie, {
          maxAge: expiresIn,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          path: '/',
        });
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Failed to create session cookie.' }, { status: 500 });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    cookies().delete('__session');
    return NextResponse.json({ success: true });
}
