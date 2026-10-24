import SubmitButton from '@/components/admin/SubmitButton';
import { getProfiles } from '@/lib/queries';
import { requireUser } from '@/lib/auth';
import { addUser, deleteUser, changePassword } from '@/lib/actions';
import Banner from '@/components/admin/Banner';

export default async function Users({ searchParams }) {
  const sp = await searchParams;
  const me = await requireUser();
  const isAdmin = me.role === 'administrator';
  const users = isAdmin ? await getProfiles() : [];
  return (
    <>
      <h1>{isAdmin ? 'Users' : 'My account'}</h1>
      <Banner sp={sp} />
      <h2 id="change-password">Change my password</h2>
      <form action={changePassword} className="admin-form inline">
        <label>
          Current password
          <input
            className="form-control"
            name="current"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        <label>
          New password (10+ characters)
          <input
            className="form-control"
            name="next"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </label>
        <SubmitButton>Change password</SubmitButton>
      </form>
      {isAdmin ? (
        <>
          <h2>Add a user</h2>
          <form action={addUser} className="admin-form inline">
            <label>
              Username
              <input
                className="form-control"
                name="username"
                required
                maxLength={30}
                autoComplete="off"
              />
            </label>
            <label>
              Email
              <input
                className="form-control"
                name="email"
                type="email"
                required
                autoComplete="off"
              />
            </label>
            <label>
              Password (10+ characters)
              <input
                className="form-control"
                name="password"
                type="password"
                minLength={10}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              Role
              <select className="form-select" name="role" defaultValue="staff">
                <option value="staff">Staff (products and enquiries)</option>
                <option value="administrator">Administrator (also manages users)</option>
              </select>
            </label>
            <SubmitButton>Add user</SubmitButton>
          </form>
          <h2>All users</h2>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="Staff accounts">
            <table className="table table-hover data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.role}</td>
                    <td>{u.created_at}</td>
                    <td>
                      {u.id !== me.id ? (
                        <details className="danger">
                          <summary>Delete</summary>
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <SubmitButton
                              className="btn btn-outline-danger"
                              pendingLabel="Deleting…"
                              confirmMessage={`Permanently delete the account “${u.username}”?`}
                            >
                              Delete {u.username}
                            </SubmitButton>
                          </form>
                        </details>
                      ) : (
                        'you'
                      )}
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
