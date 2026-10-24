'use server';
import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient, unwrap } from './supabase/admin';
import { createSessionClient } from './supabase/server';
import { requireUser, requireAdminRole, clientIp } from './auth';
import { uploadImage, removeImage } from './storage';
import { slugify, STATUSES } from './ui';
import { clearRateLimit, consumeRateLimit } from './security-rate-limit';

const readText = (formData, key, maximum = 500) =>
  String(formData.get(key) ?? '')
    .trim()
    .slice(0, maximum);
function finish(path, kind, message) {
  if (kind === 'ok') {
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
  }
  redirect(`${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(message)}`);
}
function friendlyError(error) {
  console.error('Admin data operation failed:', error?.code || 'unknown error');
  if (
    [
      'Images must be JPG, PNG or WebP.',
      'Image must be smaller than 3 MB.',
      'That file is not a valid image.',
    ].includes(error?.message)
  )
    return error.message;
  if (error?.code === '23505') return 'That name or code is already in use.';
  if (error?.code === '23503') return 'This item is still used by another record.';
  return 'Unable to save. Please try again.';
}
async function quietlyRemoveImage(filename) {
  try {
    await removeImage(filename);
  } catch {
    console.warn('Image cleanup failed; it can be retried in Supabase Storage.');
  }
}

export async function login(formData) {
  let address;
  try {
    address = await clientIp();
  } catch (error) {
    console.error('Login IP configuration error:', error.message);
    finish('/admin/login', 'error', 'Sign-in is temporarily unavailable. Please try again later.');
  }
  let allowed;
  try {
    allowed = await consumeRateLimit('login', address, 5, 900);
  } catch (error) {
    console.error('Login rate limit could not be checked:', error.message);
    finish('/admin/login', 'error', 'Sign-in is temporarily unavailable. Please try again later.');
  }
  if (!allowed)
    finish('/admin/login', 'error', 'Too many sign-in attempts. Try again in 15 minutes.');
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: readText(formData, 'email', 254),
    password: String(formData.get('password') || ''),
  });
  if (error) {
    finish('/admin/login', 'error', 'Invalid email or password.');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? unwrap(
        await createAdminClient().from('profiles').select('role').eq('id', user.id).maybeSingle(),
      )
    : null;
  if (!profile || !['administrator', 'staff'].includes(profile.role)) {
    await supabase.auth.signOut();
    finish('/admin/login', 'error', 'This account does not have staff access.');
  }
  await clearRateLimit('login', address);
  redirect('/admin');
}
export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut({ scope: 'local' });
  redirect('/admin/login');
}

export async function saveProduct(formData) {
  await requireUser();
  const id = Number(formData.get('id')) || 0;
  const back = id ? `/admin/products/${id}` : '/admin/products/new';
  const name = readText(formData, 'name', 120),
    code = readText(formData, 'code', 30);
  const category_id = Number(formData.get('category_id')) || null;
  const price_display = readText(formData, 'price_display', 10),
    availability = readText(formData, 'availability', 12);
  const rawPrice = readText(formData, 'price', 20),
    price = rawPrice === '' ? null : Number(rawPrice);
  if (!name || !code) finish(back, 'error', 'Name and product code are required.');
  if (!['public', 'contact', 'quote'].includes(price_display))
    finish(back, 'error', 'Choose how the price is shown.');
  if (!['available', 'unavailable', 'enquire'].includes(availability))
    finish(back, 'error', 'Choose an availability.');
  if (price !== null && (!Number.isFinite(price) || price < 0))
    finish(back, 'error', 'Price must be zero or more.');
  if (price_display === 'public' && price === null)
    finish(back, 'error', 'Enter a public price or choose Contact for Price.');
  let newImage = null,
    savedId = id,
    errorMessage = null;
  const database = createAdminClient();
  try {
    const previous = id
      ? unwrap(await database.from('products').select('image').eq('id', id).single())
      : null;
    let image = previous?.image || null;
    if (formData.get('remove_image') === 'on') image = null;
    const file = formData.get('image');
    if (file && typeof file === 'object' && file.size > 0) {
      newImage = await uploadImage(file);
      image = newImage;
    }
    const product = {
      name,
      code,
      category_id,
      price,
      price_display,
      availability,
      image,
      description: readText(formData, 'description', 3000),
      specifications: readText(formData, 'specifications', 1000),
      price_unit: readText(formData, 'price_unit', 20) || 'piece',
      published: formData.get('published') === 'on',
      updated_at: new Date().toISOString(),
    };
    const result = id
      ? database.from('products').update(product).eq('id', id).select('id').single()
      : database
          .from('products')
          .insert({ ...product, slug: `${slugify(name)}-${crypto.randomBytes(4).toString('hex')}` })
          .select('id')
          .single();
    savedId = unwrap(await result).id;
    // Preserve the original image until the database confirms the save.
    if (previous?.image && previous.image !== image) await quietlyRemoveImage(previous.image);
  } catch (error) {
    if (newImage) await quietlyRemoveImage(newImage);
    errorMessage = friendlyError(error);
  }
  if (errorMessage) finish(back, 'error', errorMessage);
  finish(`/admin/products/${savedId}`, 'ok', 'Saved.');
}
export async function deleteProduct(formData) {
  await requireUser();
  const id = Number(formData.get('id'));
  const database = createAdminClient();
  let errorMessage;
  try {
    const product = unwrap(
      await database.from('products').delete().eq('id', id).select('image').single(),
    );
    await quietlyRemoveImage(product.image);
  } catch (error) {
    errorMessage = friendlyError(error);
  }
  finish('/admin/products', errorMessage ? 'error' : 'ok', errorMessage || 'Product deleted.');
}
export async function addCategory(formData) {
  await requireUser();
  const name = readText(formData, 'name', 80);
  if (!name) finish('/admin/categories', 'error', 'Enter a category name.');
  let errorMessage;
  try {
    const database = createAdminClient();
    const last = unwrap(
      await database
        .from('categories')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1),
    );
    unwrap(
      await database.from('categories').insert({
        name,
        slug: `${slugify(name)}-${crypto.randomBytes(3).toString('hex')}`,
        description: readText(formData, 'description', 300),
        display_order: (last[0]?.display_order || 0) + 1,
      }),
    );
  } catch (error) {
    errorMessage = friendlyError(error);
  }
  finish('/admin/categories', errorMessage ? 'error' : 'ok', errorMessage || 'Category added.');
}
export async function saveCategory(formData) {
  await requireUser();
  const name = readText(formData, 'name', 80);
  if (!name) finish('/admin/categories', 'error', 'A category needs a name.');
  const { error } = await createAdminClient()
    .from('categories')
    .update({
      name,
      description: readText(formData, 'description', 300),
      display_order: Math.trunc(Number(formData.get('display_order'))) || 0,
      published: formData.get('published') === 'on',
    })
    .eq('id', Number(formData.get('id')));
  finish(
    '/admin/categories',
    error ? 'error' : 'ok',
    error ? friendlyError(error) : 'Category saved.',
  );
}
export async function deleteCategory(formData) {
  await requireUser();
  const { error } = await createAdminClient()
    .from('categories')
    .delete()
    .eq('id', Number(formData.get('id')));
  finish(
    '/admin/categories',
    error ? 'error' : 'ok',
    error ? 'Move or delete the products in this category first.' : 'Category deleted.',
  );
}
export async function updateEnquiry(formData) {
  await requireUser();
  const status = readText(formData, 'status', 30);
  if (!STATUSES.includes(status)) finish('/admin/enquiries', 'error', 'Invalid status.');
  const { error } = await createAdminClient()
    .from('enquiries')
    .update({ status, notes: readText(formData, 'notes', 2000) })
    .eq('id', Number(formData.get('id')));
  const back = readText(formData, 'back', 300);
  const destination = /^\/admin\/enquiries(?:\?[a-zA-Z0-9%=&+_-]*)?$/.test(back)
    ? back
    : '/admin/enquiries';
  finish(destination, error ? 'error' : 'ok', error ? friendlyError(error) : 'Enquiry updated.');
}
export async function deleteEnquiry(formData) {
  await requireAdminRole();
  const { error } = await createAdminClient()
    .from('enquiries')
    .delete()
    .eq('id', Number(formData.get('id')));
  finish(
    '/admin/enquiries',
    error ? 'error' : 'ok',
    error ? friendlyError(error) : 'Enquiry deleted.',
  );
}
export async function addUser(formData) {
  await requireAdminRole();
  const email = readText(formData, 'email', 254),
    username = readText(formData, 'username', 30),
    password = String(formData.get('password') || ''),
    role = readText(formData, 'role', 15);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    finish('/admin/users', 'error', 'Enter a valid email address.');
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username))
    finish(
      '/admin/users',
      'error',
      'Username: 3–30 letters, numbers, dots, dashes or underscores.',
    );
  if (password.length < 10 || !['staff', 'administrator'].includes(role))
    finish('/admin/users', 'error', 'Use a password of at least 10 characters and choose a role.');
  const database = createAdminClient();
  let createdId = null,
    errorMessage = null;
  try {
    const result = unwrap(
      await database.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username },
      }),
    );
    createdId = result.user.id;
    unwrap(
      await database
        .from('profiles')
        .update({ username, role })
        .eq('id', createdId)
        .select('id')
        .single(),
    );
  } catch (error) {
    if (createdId) await database.auth.admin.deleteUser(createdId);
    errorMessage = friendlyError(error);
  }
  finish(
    '/admin/users',
    errorMessage ? 'error' : 'ok',
    errorMessage || 'User added. They can log in with their email.',
  );
}
export async function deleteUser(formData) {
  const current = await requireAdminRole();
  const id = readText(formData, 'id', 36);
  if (id === current.id) finish('/admin/users', 'error', 'You cannot delete your own account.');
  const database = createAdminClient();
  const profile = unwrap(await database.from('profiles').select('role').eq('id', id).maybeSingle());
  if (!profile) finish('/admin/users', 'error', 'User not found.');
  // The database trigger also protects the last administrator against concurrent deletion.
  const { error } = await database.auth.admin.deleteUser(id);
  finish(
    '/admin/users',
    error ? 'error' : 'ok',
    error ? 'Cannot delete this account. Keep at least one administrator.' : 'User deleted.',
  );
}
export async function changePassword(formData) {
  const user = await requireUser();
  const password = String(formData.get('next') || ''),
    current = String(formData.get('current') || '');
  if (password.length < 10)
    finish('/admin/users', 'error', 'New password must be at least 10 characters.');
  const session = await createSessionClient();
  const verified = await session.auth.signInWithPassword({ email: user.email, password: current });
  if (verified.error) finish('/admin/users', 'error', 'Your current password is not correct.');
  const { error } = await session.auth.updateUser({ password });
  if (error) finish('/admin/users', 'error', error.message);
  await session.auth.signOut({ scope: 'others' });
  finish('/admin/users', 'ok', 'Password changed. Other sessions cannot refresh.');
}
