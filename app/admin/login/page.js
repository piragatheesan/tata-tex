import { redirect } from 'next/navigation';
import { login } from '@/lib/actions';
import { getUser } from '@/lib/auth';
import Banner from '@/components/admin/Banner';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  if (await getUser()) redirect('/admin');
  return (
    <div className="login">
      <form action={login} className="admin-form">
        <h1>Tata Tex admin</h1>
        <Banner sp={sp} />
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}
