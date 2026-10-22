import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

// Real PostgreSQL semantics in an isolated WASM engine; no live project or keys.
const database = new PGlite();
await database.exec(`
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth; create schema storage;
  create table auth.users(id uuid primary key,email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
`);
await database.exec(fs.readFileSync('supabase/schema.sql', 'utf8'));
await database.exec(fs.readFileSync('supabase/security-hardening.sql', 'utf8'));

test('signup creates a pending profile rather than a staff account', async () => {
  await database.exec(
    "insert into auth.users(id,email) values('11111111-1111-1111-1111-111111111111','first@example.com')",
  );
  const result = await database.query('select role from public.profiles');
  assert.equal(result.rows[0].role, 'pending');
});
test('public keys cannot read private tables or invoke imports', async () => {
  const result = await database.query(
    "select has_table_privilege('anon','public.enquiries','SELECT') as enquiries,has_table_privilege('anon','public.products','SELECT') as products,has_table_privilege('anon','public.security_rate_limits','SELECT') as rate_limits,has_function_privilege('anon','public.import_catalogue(jsonb)','EXECUTE') as import,has_function_privilege('anon','public.consume_rate_limit(text,text,integer,integer)','EXECUTE') as rate_rpc",
  );
  assert.deepEqual(result.rows[0], {
    enquiries: false,
    products: false,
    rate_limits: false,
    import: false,
    rate_rpc: false,
  });
});
test('server-only rate limit RPCs share quotas and clear them after login', async () => {
  const hash = 'a'.repeat(64);
  await database.exec('set role service_role');
  assert.equal(
    (
      await database.query("select public.consume_rate_limit('enquiry',$1,2,3600) as allowed", [
        hash,
      ])
    ).rows[0].allowed,
    true,
  );
  assert.equal(
    (
      await database.query("select public.consume_rate_limit('enquiry',$1,2,3600) as allowed", [
        hash,
      ])
    ).rows[0].allowed,
    true,
  );
  assert.equal(
    (
      await database.query("select public.consume_rate_limit('enquiry',$1,2,3600) as allowed", [
        hash,
      ])
    ).rows[0].allowed,
    false,
  );
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal(
      (
        await database.query("select public.consume_rate_limit('login',$1,5,900) as allowed", [
          hash,
        ])
      ).rows[0].allowed,
      true,
    );
  }
  assert.equal(
    (await database.query("select public.consume_rate_limit('login',$1,5,900) as allowed", [hash]))
      .rows[0].allowed,
    false,
  );
  await database.query("select public.clear_rate_limit('login',$1)", [hash]);
  assert.equal(
    (await database.query("select public.consume_rate_limit('login',$1,5,900) as allowed", [hash]))
      .rows[0].allowed,
    true,
  );
  await database.exec('reset role');
});
test('row policies allow a signed-in user to read only their own profile', async () => {
  await database.exec(
    "insert into auth.users(id,email) values('22222222-2222-2222-2222-222222222222','second@example.com'); grant usage on schema auth to authenticated;",
  );
  await database.exec(
    "set role authenticated; set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';",
  );
  const result = await database.query('select id from public.profiles');
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].id, '11111111-1111-1111-1111-111111111111');
  await database.exec('reset role');
});
test('last administrator cannot be deleted or demoted', async () => {
  await database.exec(
    "update profiles set role='administrator' where id='11111111-1111-1111-1111-111111111111'",
  );
  await assert.rejects(
    database.exec("delete from profiles where role='administrator'"),
    /at least one administrator/,
  );
  await assert.rejects(
    database.exec("update profiles set role='staff' where role='administrator'"),
    /at least one administrator/,
  );
});
test('import is atomic and advances identity counters', async () => {
  const invalid = {
    categories: [{ id: 10, slug: 'hospital', name: 'Hospital' }],
    products: [{ id: 20, code: 'TT-20', slug: 'coat', name: 'Coat', category_id: 999 }],
  };
  await assert.rejects(
    database.query('select public.import_catalogue($1::jsonb)', [JSON.stringify(invalid)]),
  );
  assert.equal(
    (await database.query('select count(*)::int as count from categories')).rows[0].count,
    0,
  );
  const valid = {
    categories: [{ id: 10, slug: 'hospital', name: 'Hospital' }],
    products: [
      { id: 20, code: 'TT-20', slug: 'coat', name: 'Coat', category_id: 10, published: true },
    ],
    enquiries: [],
  };
  await database.query('select public.import_catalogue($1::jsonb)', [JSON.stringify(valid)]);
  const created = await database.query(
    "insert into products(code,slug,name) values('TT-21','apron','Apron') returning id",
  );
  assert.equal(Number(created.rows[0].id), 21);
  await assert.rejects(
    database.query('select public.import_catalogue($1::jsonb)', [JSON.stringify(valid)]),
    /empty/,
  );
});
test('negative/public missing prices and nonempty category deletion are rejected', async () => {
  await assert.rejects(
    database.exec("insert into products(code,slug,name,price) values('bad','bad','Bad',-1)"),
  );
  await assert.rejects(
    database.exec(
      "insert into products(code,slug,name,price_display) values('missing','missing','Missing','public')",
    ),
  );
  await assert.rejects(database.exec('delete from categories where id=10'));
});
test.after(async () => database.close());
