'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdminRole } from './auth';
import { createAdminClient, unwrap } from './supabase/admin';
import { uploadImage, removeImage } from './storage';
import { getHomeSlides, HOME_BUCKET } from './home-content';

export async function saveHomeSlide(form) {
  await requireAdminRole();
  const index = Number(form.get('index'));
  if (!Number.isInteger(index) || index < 0 || index > 2) throw new Error('Invalid slide');
  const title = String(form.get('title') || '')
    .trim()
    .slice(0, 100);
  const text = String(form.get('text') || '')
    .trim()
    .slice(0, 400);
  const alt = String(form.get('alt') || '')
    .trim()
    .slice(0, 180);
  let errorMessage = null;
  let uploaded = null;
  if (!title || !text || !alt)
    errorMessage = 'Complete the title, description and image description.';
  else
    try {
      const slides = await getHomeSlides({ strict: true });
      const file = form.get('image');
      if (file?.size) uploaded = await uploadImage(file);
      slides[index] = {
        title,
        text,
        alt,
        image: uploaded ? `/uploads/${uploaded}` : slides[index].image,
      };
      const client = createAdminClient();
      const bucket = await client.storage.getBucket(HOME_BUCKET);
      if (bucket.error)
        unwrap(
          await client.storage.createBucket(HOME_BUCKET, {
            public: false,
            fileSizeLimit: 65536,
            allowedMimeTypes: ['application/json'],
          }),
        );
      unwrap(
        await client.storage.from(HOME_BUCKET).upload('slides.json', JSON.stringify(slides), {
          contentType: 'application/json',
          upsert: true,
          cacheControl: '0',
        }),
      );
    } catch (error) {
      if (uploaded) await removeImage(uploaded).catch(() => {});
      errorMessage = [
        'Images must be JPG, PNG or WebP.',
        'Image must be smaller than 3 MB.',
        'That file is not a valid image.',
      ].includes(error.message)
        ? error.message
        : 'Unable to save the slideshow. Please try again.';
    }
  if (!errorMessage) {
    revalidatePath('/');
    revalidatePath('/admin/homepage');
  }
  redirect(
    `/admin/homepage?${errorMessage ? 'error' : 'ok'}=${encodeURIComponent(errorMessage || 'Slide saved.')}`,
  );
}
