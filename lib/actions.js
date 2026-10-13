'use server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { redirect } from 'next/navigation';
import { getDb, DATA_DIR } from './db';
import {
  getUser, requireUser, requireAdminRole, hashPassword, verifyPassword,
  setSession, clearSession, clientIp, loginBlocked, recordFail, clearFails,
} from './auth';
import { slugify, STATUSES } from './ui';

const str = (f, k, max = 500) => String(f.get(k) ?? '').trim().slice(0, max);
const go = (url, kind, msg) => redirect(`${url}${url.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}`);
const UPLOADS = path.join(DATA_DIR, 'uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const DUMMY = hashPassword('not-a-real-password');

function removeImage(name) {
  if (name && /^[a-f0-9]{16,}\.(jpg|png|webp)$/.test(name)) fs.rmSync(path.join(UPLOADS, name), { force: true });
}
async function saveImage(file) {
  const ext = EXT[file.type];
  if (!ext) throw new Error('Images must be JPG, PNG or WebP.');
  if (file.size > 3 * 1024 * 1024) throw new Error('Image must be smaller than 3 MB.');
  const buf = Buffer.from(await file.arrayBuffer());
  const ok =
    (ext === 'jpg' && buf[0] === 0xff && buf[1] === 0xd8) ||
    (ext === 'png' && buf.subarray(0, 4).toString('hex') === '89504e47') ||
    (ext === 'webp' && buf.subarray(8, 12).toString() === 'WEBP');
  if (!ok) throw new Error('That file is not a valid image.');
  fs.mkdirSync(UPLOADS, { recursive: true });
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(UPLOADS, name), buf);
  return name;
}

/* ---------- login ---------- */
export async function login(f) {
  const ip = await clientIp();
  if (loginBlocked(ip)) go('/admin/login', 'error', 'Too many failed attempts. Please try again in 15 minutes.');
  const u = getDb().prepare('select * from users where username = ?').get(str(f, 'username', 60));
  const pw = String(f.get('password') ?? '');
  const ok = u ? verifyPassword(pw, u.password_hash) : (verifyPassword(pw, DUMMY), false);
  if (!ok) { recordFail(ip); go('/admin/login', 'error', 'Invalid username or password.'); }
  clearFails(ip);
  await setSession(u.id);
  redirect('/admin');
}
export async function logout() {
  await clearSession();
  redirect('/admin/login');
}

/* ---------- products ---------- */
export async function saveProduct(f) {
  await requireUser();
  const id = Number(f.get('id')) || 0;
  const back = id ? `/admin/products/${id}` : '/admin/products/new';
  const name = str(f, 'name', 120), code = str(f, 'code', 30);
  const category_id = Number(f.get('category_id')) || null;
  const price_display = str(f, 'price_display', 10), availability = str(f, 'availability', 12);
  const priceRaw = str(f, 'price', 20);
  const price = priceRaw === '' ? null : Number(priceRaw);
  const price_unit = str(f, 'price_unit', 20) || 'piece';
  const published = f.get('published') === 'on' ? 1 : 0;
  if (!name || !code) go(back, 'error', 'Name and product code are required.');
  if (!['public', 'contact', 'quote'].includes(price_display)) go(back, 'error', 'Choose how the price is shown.');
  if (!['available', 'unavailable', 'enquire'].includes(availability)) go(back, 'error', 'Choose an availability.');
  if (price !== null && (!Number.isFinite(price) || price < 0)) go(back, 'error', 'Price must be a number, zero or more.');
  if (price_display === 'public' && price === null) go(back, 'error', 'Enter a price, or choose "Contact for Price".');
  const db = getDb();
  if (category_id && !db.prepare('select 1 from categories where id = ?').get(category_id)) go(back, 'error', 'Choose a valid category.');

  let err = null, newId = id, newImage = null;
  const file = f.get('image');
  try {
    const cur = id ? db.prepare('select image from products where id = ?').get(id) : null;
    if (id && !cur) throw new Error('Product not found.');
    let image = cur ? cur.image : null;
    if (f.get('remove_image') === 'on') { removeImage(image); image = null; }
    if (file && typeof file === 'object' && file.size > 0) { newImage = await saveImage(file); removeImage(image); image = newImage; }
    const description = str(f, 'description', 3000), specifications = str(f, 'specifications', 1000);
    if (id) {
      db.prepare(
        `update products set code=?, name=?, category_id=?, description=?, specifications=?, price=?, price_unit=?,
         price_display=?, availability=?, image=?, published=?, updated_at=datetime('now') where id=?`
      ).run(code, name, category_id, description, specifications, price, price_unit, price_display, availability, image, published, id);
    } else {
      let slug = slugify(name), n = 1;
      while (db.prepare('select 1 from products where slug = ?').get(slug)) slug = `${slugify(name)}-${++n}`;
      newId = Number(
        db.prepare(
          `insert into products (code, slug, name, category_id, description, specifications, price, price_unit, price_display, availability, image, published)
           values (?,?,?,?,?,?,?,?,?,?,?,?)`
        ).run(code, slug, name, category_id, description, specifications, price, price_unit, price_display, availability, image, published).lastInsertRowid
      );
    }
  } catch (e) {
    if (newImage) removeImage(newImage);
    err = /UNIQUE/.test(e.message) ? 'That product code is already in use.' : e.message;
  }
  if (err) go(back, 'error', err);
  go(`/admin/products/${newId}`, 'ok', 'Saved.');
}
export async function deleteProduct(f) {
  await requireUser();
  const id = Number(f.get('id'));
  const db = getDb();
  const cur = db.prepare('select image from products where id = ?').get(id);
  db.prepare('delete from products where id = ?').run(id);
  if (cur) removeImage(cur.image);
  go('/admin/products', 'ok', 'Product deleted.');
}

/* ---------- categories ---------- */
export async function addCategory(f) {
  await requireUser();
  const name = str(f, 'name', 80);
  if (!name) go('/admin/categories', 'error', 'Enter a category name.');
  const db = getDb();
  let slug = slugify(name), n = 1;
  while (db.prepare('select 1 from categories where slug = ?').get(slug)) slug = `${slugify(name)}-${++n}`;
  const order = db.prepare('select coalesce(max(display_order), 0) + 1 as n from categories').get().n;
  db.prepare('insert into categories (slug, name, description, display_order) values (?,?,?,?)').run(slug, name, str(f, 'description', 300), order);
  go('/admin/categories', 'ok', 'Category added.');
}
export async function saveCategory(f) {
  await requireUser();
  const name = str(f, 'name', 80);
  if (!name) go('/admin/categories', 'error', 'A category needs a name.');
  getDb()
    .prepare('update categories set name=?, description=?, display_order=?, published=? where id=?')
    .run(name, str(f, 'description', 300), Math.trunc(Number(f.get('display_order'))) || 0, f.get('published') === 'on' ? 1 : 0, Number(f.get('id')));
  go('/admin/categories', 'ok', 'Category saved.');
}
export async function deleteCategory(f) {
  await requireUser();
  const id = Number(f.get('id'));
  const n = getDb().prepare('select count(*) as n from products where category_id = ?').get(id).n;
  if (n) go('/admin/categories', 'error', `Move or delete the ${n} product(s) in this category first.`);
  getDb().prepare('delete from categories where id = ?').run(id);
  go('/admin/categories', 'ok', 'Category deleted.');
}

/* ---------- enquiries ---------- */
export async function updateEnquiry(f) {
  await requireUser();
  const status = str(f, 'status', 30);
  const back = str(f, 'back', 200).startsWith('/admin/enquiries') ? str(f, 'back', 200) : '/admin/enquiries';
  if (!STATUSES.includes(status)) go(back, 'error', 'Invalid status.');
  getDb().prepare('update enquiries set status = ?, notes = ? where id = ?').run(status, str(f, 'notes', 2000), Number(f.get('id')));
  go(back, 'ok', 'Enquiry updated.');
}
export async function deleteEnquiry(f) {
  await requireAdminRole();
  getDb().prepare('delete from enquiries where id = ?').run(Number(f.get('id')));
  go('/admin/enquiries', 'ok', 'Enquiry deleted.');
}

/* ---------- users ---------- */
export async function addUser(f) {
  await requireAdminRole();
  const username = str(f, 'username', 30), pw = String(f.get('password') ?? ''), role = str(f, 'role', 15);
  if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) go('/admin/users', 'error', 'Username: 3 to 30 letters, numbers, dots, dashes or underscores.');
  if (pw.length < 10) go('/admin/users', 'error', 'Password must be at least 10 characters.');
  if (!['administrator', 'staff'].includes(role)) go('/admin/users', 'error', 'Choose a role.');
  let err = null;
  try {
    getDb().prepare('insert into users (username, password_hash, role) values (?,?,?)').run(username, hashPassword(pw), role);
  } catch (e) {
    err = /UNIQUE/.test(e.message) ? 'That username already exists.' : e.message;
  }
  if (err) go('/admin/users', 'error', err);
  go('/admin/users', 'ok', 'User added.');
}
export async function deleteUser(f) {
  const me = await requireAdminRole();
  const id = Number(f.get('id'));
  const db = getDb();
  const target = db.prepare('select * from users where id = ?').get(id);
  if (!target) go('/admin/users', 'error', 'User not found.');
  if (id === me.id) go('/admin/users', 'error', 'You cannot delete your own account.');
  if (target.role === 'administrator' && db.prepare("select count(*) as n from users where role = 'administrator'").get().n <= 1)
    go('/admin/users', 'error', 'There must be at least one administrator.');
  db.prepare('delete from users where id = ?').run(id);
  go('/admin/users', 'ok', 'User deleted.');
}
export async function changePassword(f) {
  const me = await requireUser();
  const cur = String(f.get('current') ?? ''), next = String(f.get('next') ?? '');
  const row = getDb().prepare('select * from users where id = ?').get(me.id);
  if (!verifyPassword(cur, row.password_hash)) go('/admin/users', 'error', 'Your current password is not correct.');
  if (next.length < 10) go('/admin/users', 'error', 'New password must be at least 10 characters.');
  getDb().prepare('update users set password_hash = ? where id = ?').run(hashPassword(next), me.id);
  go('/admin/users', 'ok', 'Password changed.');
}
