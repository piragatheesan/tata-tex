export default function Banner({ sp }) {
  const error = typeof sp?.error === 'string' ? sp.error : '';
  const ok = typeof sp?.ok === 'string' ? sp.ok : '';
  if (error)
    return (
      <p className="alert alert-danger banner bad" role="alert">
        {error}
      </p>
    );
  if (ok)
    return (
      <p className="alert alert-success banner good" role="status">
        {ok}
      </p>
    );
  return null;
}
