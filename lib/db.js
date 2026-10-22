import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SEED } from './seed';
import { slugify } from './ui';

export const DATA_DIR = path.resolve(
  /* turbopackIgnore: true */ process.env.DATA_DIR || path.join(process.cwd(), 'data'),
);

const SCHEMA = `
create table if not exists categories (
  id integer primary key autoincrement,
  slug text not null unique,
  name text not null,
  description text not null default '',
  display_order integer not null default 0,
  published integer not null default 1
);
create table if not exists products (
  id integer primary key autoincrement,
  code text not null unique,
  slug text not null unique,
  name text not null,
  category_id integer references categories(id),
  description text not null default '',
  specifications text not null default '',
  price real,
  price_unit text not null default 'piece',
  price_display text not null default 'contact' check (price_display in ('public','contact','quote')),
  availability text not null default 'enquire' check (availability in ('available','unavailable','enquire')),
  image text,
  published integer not null default 0,
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now')),
  check (price_display <> 'public' or price is not null)
);
create index if not exists idx_products_category on products(category_id);
create table if not exists enquiries (
  id integer primary key autoincrement,
  created_at text not null default (datetime('now')),
  type text, product text, name text, contact text, company text, qty text, message text,
  status text not null default 'New' check (status in ('New','In Progress','Awaiting Customer','Responded','Closed')),
  notes text not null default '',
  emailed integer not null default 0
);
create table if not exists users (
  id integer primary key autoincrement,
  username text not null unique,
  password_hash text not null,
  role text not null default 'staff' check (role in ('administrator','staff')),
  created_at text not null default (datetime('now'))
);
`;

function hash(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}

function init(db) {
  db.exec(SCHEMA);
  // Additive migration: existing products, users and enquiries are preserved.
  const userColumns = db.prepare('pragma table_info(users)').all();
  if (!userColumns.some((column) => column.name === 'session_version')) {
    db.exec('alter table users add column session_version integer not null default 0');
  }
  if (db.prepare('select count(*) n from categories').get().n === 0) {
    const addCat = db.prepare('insert into categories (slug, name, display_order) values (?,?,?)');
    const addProd = db.prepare(
      'insert into products (code, slug, name, category_id, published) values (?,?,?,?,1)',
    );
    let n = 0;
    db.transaction(() => {
      SEED.forEach(([cat, items], i) => {
        const cid = addCat.run(slugify(cat), cat, i).lastInsertRowid;
        items.forEach((name) => {
          n += 1;
          addProd.run(
            'TT-' + String(n).padStart(3, '0'),
            `${slugify(cat)}-${slugify(name)}`,
            name,
            cid,
          );
        });
      });
    })();
  }
  if (db.prepare('select count(*) n from users').get().n === 0) {
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;
    if (ADMIN_USERNAME && ADMIN_PASSWORD) {
      db.prepare(
        "insert into users (username, password_hash, role) values (?,?, 'administrator')",
      ).run(ADMIN_USERNAME, hash(ADMIN_PASSWORD));
      console.log(`Created first administrator "${ADMIN_USERNAME}"`);
    } else {
      console.warn(
        'No admin users exist. Set ADMIN_USERNAME and ADMIN_PASSWORD in .env.local and restart.',
      );
    }
  }
}

export function getDb() {
  if (!globalThis.__ttdb) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = new Database(path.join(DATA_DIR, 'tatatex.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    db.pragma('foreign_keys = ON');
    init(db);
    globalThis.__ttdb = db;
  }
  return globalThis.__ttdb;
}
