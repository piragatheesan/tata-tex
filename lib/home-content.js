import 'server-only';
import { createAdminClient } from './supabase/admin';
import { defaultSlides } from './home-slides';

export const HOME_BUCKET = 'homepage-settings';
export async function getHomeSlides({ strict = false } = {}) {
  const { data, error } = await createAdminClient()
    .storage.from(HOME_BUCKET)
    .download('slides.json');
  if (error) {
    if (strict) throw error;
    if (!['404', '400'].includes(String(error.statusCode)))
      console.warn('Homepage settings unavailable; using bundled slides.');
    return defaultSlides;
  }
  try {
    const slides = JSON.parse(await data.text());
    if (
      !Array.isArray(slides) ||
      slides.length !== 3 ||
      slides.some(
        (s) =>
          !s.title ||
          !s.alt ||
          !s.text ||
          !/^\/(?:images\/home-(?:hero|fabric)\.png|about-workshop\.png|uploads\/[a-f0-9]+\.(?:jpg|png|webp))$/.test(
            s.image,
          ),
      )
    )
      throw new Error('Invalid slides');
    return slides;
  } catch (error) {
    if (strict) throw error;
    console.warn('Invalid homepage settings; using bundled slides.');
    return defaultSlides;
  }
}
