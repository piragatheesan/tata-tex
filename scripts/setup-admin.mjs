import { scriptClient, check } from './supabase-client.mjs';
const database = scriptClient();
const { ADMIN_EMAIL, ADMIN_USERNAME = 'admin', ADMIN_PASSWORD } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10)
  throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (10+ characters) in .env.local.');
const existing = await database
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('role', 'administrator');
check(existing);
if (existing.count)
  throw new Error('An administrator already exists. Use Admin > Users to create more accounts.');
const result = check(
  await database.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
  }),
);
try {
  check(
    await database
      .from('profiles')
      .update({ username: ADMIN_USERNAME, role: 'administrator' })
      .eq('id', result.user.id)
      .select('id')
      .single(),
  );
} catch (error) {
  await database.auth.admin.deleteUser(result.user.id);
  throw error;
}
console.log(
  'Administrator created. Log in with ADMIN_EMAIL. Remove ADMIN_PASSWORD from .env.local.',
);
