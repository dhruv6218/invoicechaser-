import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as 'signup' | 'recovery' | 'invite' | 'magiclink' | null;
  const next = requestUrl.searchParams.get('next') ?? '/app';

  // If no token hash, just redirect (manual navigation or fallback)
  if (!tokenHash || !type) {
    return NextResponse.redirect(`${requestUrl.origin}/login`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange the code for a session
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type,
  });

  if (error) {
    // Redirect to login with error
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Success — redirect to app (or recovery page if password reset)
  const redirectTo = type === 'recovery' ? '/reset-password' : next;
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
}
