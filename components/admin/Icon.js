export default function Icon({ name, ...props }) {
  const paths = {
    home: 'm3 10 9-7 9 7v11h-6v-7H9v7H3z',
    box: 'm12 3 9 5v9l-9 5-9-5V8zm-9 5 9 5 9-5M12 13v9',
    tag: 'M3 3h8l10 10-8 8L3 11zm4 4h.01',
    chat: 'M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-1l-5 2 2-5a9 9 0 1 1 16-5Z',
    clock: 'M12 8v5l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
    users:
      'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-4M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-4a4 4 0 0 1 0 8',
    settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M9 3h6l1 4 4 1 1 6-4 2-1 4H9l-1-4-4-1-1-6 4-2z',
    mail: 'M3 5h18v14H3zm0 0 9 8 9-8',
    plus: 'M12 4v16M4 12h16',
    edit: 'm15 4 5 5-11 11H4v-5zm-2 2 5 5',
    external: 'M14 3h7v7m0-7L10 14M10 5H3v16h16v-7',
    logout: 'M9 3H3v18h6m6-14 5 5-5 5m-7-5h12',
    menu: 'M3 6h18M3 12h18M3 18h18',
    close: 'm5 5 14 14M5 19 19 5',
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.home} />
    </svg>
  );
}
