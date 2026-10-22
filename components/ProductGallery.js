'use client';
import { useRef, useState } from 'react';
import { productImages } from '@/lib/product-images';
import { ProductImage } from './ProductCard';
export default function ProductGallery({ product }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = useRef(null);
  const touchStart = useRef(null);
  const bundled = productImages[product.slug] || [];
  const photos = product.image
    ? [{ src: `/uploads/${product.image}`, alt: product.name }, ...bundled]
    : bundled;
  if (!photos.length) return <ProductImage p={product} height={480} />;
  const nextIndex = (selectedIndex + 1) % photos.length;
  const move = (delta) =>
    setSelectedIndex((index) => (index + delta + photos.length) % photos.length);
  function openZoom(index) {
    setZoomIndex(index);
    zoom.current.showModal();
  }
  return (
    <div className="product-gallery">
      <div
        className={'gallery-pair' + (photos.length === 1 ? ' single' : '')}
        onTouchStart={(event) => {
          touchStart.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touchStart.current !== null) {
            const distance = touchStart.current - event.changedTouches[0].clientX;
            if (Math.abs(distance) > 50) move(distance > 0 ? 1 : -1);
          }
          touchStart.current = null;
        }}
      >
        <button
          className="gallery-photo-button"
          type="button"
          aria-label="Zoom product photo"
          onClick={() => openZoom(selectedIndex)}
        >
          <img
            className="gallery-main"
            src={photos[selectedIndex].src}
            alt={`${product.name}, view ${selectedIndex + 1}`}
            width="640"
            height="800"
          />
          <span className="zoom-hint">Zoom +</span>
        </button>
        {photos.length > 1 && (
          <button
            className="gallery-photo-button gallery-secondary"
            type="button"
            aria-label="Zoom next product photo"
            onClick={() => openZoom(nextIndex)}
          >
            <img
              className="gallery-main"
              src={photos[nextIndex].src}
              alt={`${product.name}, view ${nextIndex + 1}`}
              width="640"
              height="800"
            />
          </button>
        )}
      </div>
      {photos.length > 1 && (
        <>
          <div className="gallery-controls">
            <button type="button" onClick={() => move(-1)} aria-label="Previous photo">
              ←
            </button>
            <span aria-live="polite">
              {selectedIndex + 1} / {photos.length}
            </span>
            <button type="button" onClick={() => move(1)} aria-label="Next photo">
              →
            </button>
          </div>
          <div className="gallery-thumbnails" role="group" aria-label="Choose a product photo">
            {photos.map((photo, index) => (
              <button
                key={`${photo.src}-${index}`}
                type="button"
                aria-pressed={index === selectedIndex}
                aria-label={`Show photo ${index + 1}`}
                onClick={() => setSelectedIndex(index)}
              >
                <img src={photo.src} alt="" width="72" height="88" loading="lazy" />
              </button>
            ))}
          </div>
        </>
      )}
      <dialog
        ref={zoom}
        className="zoom-dialog"
        aria-label={`${product.name} enlarged photo`}
        onClick={(event) => {
          if (event.target === event.currentTarget) zoom.current.close();
        }}
      >
        <button
          type="button"
          className="dialog-close"
          aria-label="Close enlarged photo"
          onClick={() => zoom.current.close()}
        >
          ×
        </button>
        <img src={photos[zoomIndex].src} alt={product.name} />
      </dialog>
    </div>
  );
}
