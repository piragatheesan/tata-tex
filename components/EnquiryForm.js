'use client';
import { useState } from 'react';

function Field({ label, error, children }) {
  return (
    <label>
      {label}
      {children}
      {error ? <span className="er" role="alert">{error}</span> : null}
    </label>
  );
}

export default function EnquiryForm({ product, defaultType = 'General enquiry' }) {
  const [status, setStatus] = useState('idle'); // idle | sending | done | error
  const [errors, setErrors] = useState({});

  async function onSubmit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    const x = {};
    if (!d.name.trim()) x.name = 'Please enter your name.';
    if (!d.contact.trim()) x.contact = 'Please enter an email address or phone number.';
    if (!d.message.trim()) x.message = 'Please enter a message.';
    setErrors(x);
    if (Object.keys(x).length) return;
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
      if (!r.ok) throw new Error('failed');
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return <div className="note"><p>Thank you. Your enquiry has been received and Tata Tex will respond using the contact details you provided.</p></div>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="form">
      <Field label="Enquiry type">
        <select name="type" defaultValue={defaultType}>
          <option>General enquiry</option>
          <option>Product enquiry</option>
          <option>Wholesale quotation</option>
        </select>
      </Field>
      <Field label="Your name *" error={errors.name}><input name="name" autoComplete="name" /></Field>
      <Field label="Email or phone *" error={errors.contact}><input name="contact" autoComplete="email" /></Field>
      <Field label="Company (optional)"><input name="company" autoComplete="organization" /></Field>
      <div className="two">
        <Field label="Quantity"><input name="qty" type="number" min="0" /></Field>
        <Field label="Unit">
          <select name="unit"><option>pieces</option><option>sets</option><option>metres</option><option>packs</option></select>
        </Field>
      </div>
      <Field label="Message *" error={errors.message}><textarea name="message" rows="4" /></Field>
      <input name="hp" className="hp" tabIndex="-1" autoComplete="off" aria-hidden="true" />
      {status === 'error' ? <p className="er" role="alert">Sorry, we could not send your enquiry. Please try again or contact us by phone.</p> : null}
      <button className="btn" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
    </form>
  );
}
