'use client';
import { useState } from 'react';

function Field({ label, error, children }) {
  return (
    <label>
      {label}
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export default function EnquiryForm({ product, defaultType = 'General enquiry' }) {
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (status === 'sending') return;
    setServerError('');
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const x = {};
    if (!d.name.trim()) x.name = 'Please enter your name.';
    if (d.contact.trim().length < 3)
      x.contact = 'Please enter a valid email address or phone number.';
    if (d.qty && (!Number.isFinite(Number(d.qty)) || Number(d.qty) <= 0))
      x.qty = 'Quantity must be greater than zero.';
    if (!d.message.trim()) x.message = 'Please enter a message.';
    setErrors(x);
    if (Object.keys(x).length) {
      e.currentTarget.elements.namedItem(Object.keys(x)[0])?.focus();
      return;
    }
    setStatus('sending');
    try {
      const r = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: d.type,
          product: product ? `${product.code} ${product.name}` : 'General',
          name: d.name,
          contact: d.contact,
          company: d.company,
          qty: d.qty ? `${d.qty} ${d.unit}` : '',
          message: d.message,
          hp: d.hp,
        }),
      });
      const result = await r
        .json()
        .catch(() => ({ error: 'The server could not process your enquiry. Please try again.' }));
      if (!r.ok) throw new Error(result.error || 'Please try again.');
      setStatus('done');
    } catch (error) {
      setServerError(
        error.message === 'Failed to fetch'
          ? 'Connection failed. Please try again.'
          : error.message,
      );
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="note" role="status">
        <p>
          Thank you. Your enquiry has been received and Tata Tex will respond using the contact
          details you provided.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form">
      <Field label="Enquiry type">
        <select className="form-select" name="type" defaultValue={defaultType}>
          <option>General enquiry</option>
          <option>Product enquiry</option>
          <option>Wholesale quotation</option>
        </select>
      </Field>
      <Field label="Your name *" error={errors.name}>
        <input
          className="form-control"
          name="name"
          required
          maxLength={100}
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
        />
      </Field>
      <Field label="Email or phone *" error={errors.contact}>
        <input
          className="form-control"
          name="contact"
          required
          maxLength={120}
          aria-invalid={Boolean(errors.contact)}
          autoComplete="email"
        />
      </Field>
      <Field label="Company (optional)">
        <input
          className="form-control"
          name="company"
          maxLength={120}
          autoComplete="organization"
        />
      </Field>
      <div className="two-columns">
        <Field label="Quantity" error={errors.qty}>
          <input
            className="form-control"
            name="qty"
            type="number"
            min="0.01"
            step="any"
            aria-invalid={Boolean(errors.qty)}
          />
        </Field>
        <Field label="Unit">
          <select className="form-select" name="unit">
            <option>pieces</option>
            <option>sets</option>
            <option>metres</option>
            <option>packs</option>
          </select>
        </Field>
      </div>
      <Field label="Message *" error={errors.message}>
        <textarea
          className="form-control"
          name="message"
          required
          maxLength={2000}
          aria-invalid={Boolean(errors.message)}
          rows="4"
        />
      </Field>
      <input name="hp" className="honeypot" tabIndex="-1" autoComplete="off" aria-hidden="true" />
      {status === 'error' ? (
        <p className="field-error" role="alert">
          {serverError}
        </p>
      ) : null}
      <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </button>
    </form>
  );
}
