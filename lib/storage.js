import 'server-only';
import crypto from 'node:crypto';
import { createAdminClient, unwrap } from './supabase/admin';

export const IMAGE_BUCKET = 'product-images';
const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export async function uploadImage(file) {
  const extension = EXTENSIONS[file.type];
  if (!extension) throw new Error('Images must be JPG, PNG or WebP.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Image must be smaller than 3 MB.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid =
    extension === 'jpg'
      ? bytes[0] === 255 && bytes[1] === 216
      : extension === 'png'
        ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a'
        : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
  if (!valid) throw new Error('That file is not a valid image.');
  const filename = crypto.randomBytes(12).toString('hex') + '.' + extension;
  unwrap(
    await createAdminClient()
      .storage.from(IMAGE_BUCKET)
      .upload(filename, bytes, { contentType: file.type, upsert: false }),
  );
  return filename;
}
export async function removeImage(filename) {
  if (filename && /^[a-f0-9]{16,}\.(jpg|png|webp)$/.test(filename))
    unwrap(await createAdminClient().storage.from(IMAGE_BUCKET).remove([filename]));
}
