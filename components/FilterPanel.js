'use client';
import { useState } from 'react';

// Wraps the filter form. On phones the filters sit behind a "Show filters" button.
export default function FilterPanel({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className={'fpanel' + (open ? ' open' : '')}>
      <button type="button" className="fbtn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? 'Hide filters' : 'Show filters'}
      </button>
      <div className="fbody">{children}</div>
    </aside>
  );
}
