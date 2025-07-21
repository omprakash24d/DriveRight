
import { getAdminApp } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const sessionRequestSchema = z.object({
  idToken: z.string().min(1, 'ID token cannot be empty.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validationResult = sessionRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request: ID token is required.' },
        { status: 400 }
      );
    }
    
    const { idToken } = validationResult.data;

    const adminApp = getAdminApp();
    const adminAuth = adminApp.auth(); // Correctly get auth from the initialized app instance

    // Set session expiration to 5 days.
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
  
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    cookies().set('__session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: true, // Always use secure cookies
      path: '/',
      sameSite: 'lax', // Use 'lax' for a good balance of security and usability
    });
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error creating session cookie:', error.message, 'Code:', error.code);
    // Differentiate between invalid token and other server errors
    if (error.code?.startsWith('auth/')) {
        return NextResponse.json({ error: 'Invalid authentication token provided.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create session due to an internal server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    // For CSRF protection on logout, a real app might require a custom header.
    // For now, simply clearing the cookie is sufficient for this context.
    cookies().delete('__session');
    return NextResponse.json({ success: true });
}
