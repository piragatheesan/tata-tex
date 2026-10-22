'use client';
import { useEffect, useRef } from 'react';
import EnquiryForm from './EnquiryForm';
export default function EnquiryDialog({ product }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (window.location.hash === '#enquire') element.showModal();
    const previousOverflow = document.body.style.overflow;
    const observer = new MutationObserver(() => {
      document.body.style.overflow = element.open ? 'hidden' : previousOverflow;
    });
    observer.observe(element, { attributes: true, attributeFilter: ['open'] });
    return () => {
      observer.disconnect();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return (
    <>
      <div className="product-enquiry-action" id="enquire">
        <button className="btn" type="button" onClick={() => dialog.current.showModal()}>
          Enquire Now
        </button>
      </div>
      <dialog
        ref={dialog}
        className="enquiry-dialog"
        aria-labelledby="enquiry-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current.close();
        }}
      >
        <div className="dialog-content">
          <div className="dialog-heading">
            <h2 id="enquiry-title">Product Enquiry</h2>
            <button
              className="dialog-close"
              type="button"
              aria-label="Close enquiry"
              onClick={() => dialog.current.close()}
            >
              ×
            </button>
          </div>
          <p>
            {product.name} · {product.code}
          </p>
          <EnquiryForm product={product} defaultType="Product enquiry" />
        </div>
      </dialog>
    </>
  );
}
