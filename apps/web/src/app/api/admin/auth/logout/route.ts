import { cookies } from 'next/headers';
import { apiSuccess } from '@/lib/api-response';
import { COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/admin-auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });

  return apiSuccess({ loggedOut: true });
}
