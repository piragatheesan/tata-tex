import { getDb } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { addUser, deleteUser, changePassword } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function Users({ searchParams }) {
  const sp = await searchParams;
  const me = await requireUser();
  const isAdmin = me.role === 'administrator';
  const users = isAdmin ? getDb().prepare('select id, username, role, created_at from users order by id').all() : [];
  return (
    <>
      <h1>{isAdmin ? 'Users' : 'My account'}</h1>
      <Banner sp={sp} />
      <h2>Change my password</h2>
      <form action={changePassword} className="afm inline">
        <label>Current password<input name="current" type="password" autoComplete="current-password" required /></label>
        <label>New password (10+ characters)<input name="next" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button className="btn" type="submit">Change password</button>
      </form>
      {isAdmin ? (
        <>
          <h2>Add a user</h2>
          <form action={addUser} className="afm inline">
            <label>Username<input name="username" required maxLength={30} autoComplete="off" /></label>
            <label>Password (10+ characters)<input name="password" type="password" minLength={10} required autoComplete="new-password" /></label>
            <label>Role
              <select name="role" defaultValue="staff">
                <option value="staff">Staff (products and enquiries)</option>
                <option value="administrator">Administrator (also manages users)</option>
              </select>
            </label>
            <button className="btn" type="submit">Add user</button>
          </form>
          <h2>All users</h2>
          <div className="ox">
            <table className="tbl">
              <thead><tr><th>Username</th><th>Role</th><th>Created</th><th /></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td><td>{u.role}</td><td>{u.created_at}</td>
                    <td>
                      {u.id !== me.id ? (
                        <details className="danger"><summary>Delete</summary>
                          <form action={deleteUser}><input type="hidden" name="id" value={u.id} /><button className="btn" type="submit">Delete {u.username}</button></form>
                        </details>
                      ) : 'you'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
