import { cookies } from 'next/headers';
import { apiSuccess, apiError } from '@/lib/api-response';
import {
  COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  timingSafeEqual,
} from '@/lib/admin-auth';

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!password || !secret) {
    return apiError('Admin auth not configured', 500);
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  if (!body.password || typeof body.password !== 'string') {
    return apiError('Password is required', 400);
  }

  const valid = await timingSafeEqual(body.password, password);
  if (!valid) {
    return apiError('Invalid password', 401);
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);

  return apiSuccess({ authenticated: true });
}
