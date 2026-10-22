import { createAdminClient } from '@/lib/supabase/admin';
import { IMAGE_BUCKET } from '@/lib/storage';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
  const { file } = await params;
  if (!/^[a-f0-9]{16,}\.(jpg|png|webp)$/.test(file))
    return new Response('Not found', { status: 404 });
  const { data } = createAdminClient().storage.from(IMAGE_BUCKET).getPublicUrl(file);
  return Response.redirect(data.publicUrl, 307);
}
