'use client';
import { useEffect, useState } from 'react';
import { defaultSlides } from '@/lib/home-slides';
import Link from 'next/link';
import styles from '@/app/(site)/Home.module.css';
export default function HomeHero({ slides = defaultSlides }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (paused || preference.matches || slides.length < 2) return;
    const timer = setInterval(() => {
      if (!document.hidden) setActive((index) => (index + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);
  const slide = slides[active % slides.length];
  return (
    <section
      className={styles.hero}
      aria-label="Uniform collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <img
        className={styles.heroImage}
        src={slide.image}
        alt={slide.alt}
        width="1672"
        height="941"
        fetchPriority="high"
      />
      <div className={styles.heroFade} />
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>
            QUALITY <span>•</span> COMFORT <span>•</span> PROFESSIONALISM
          </p>
          <h1 style={{ whiteSpace: 'pre-line' }}>{slide.title}</h1>
          <p className={styles.heroDescription}>{slide.text}</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/products">
              Explore Products
            </Link>
            <Link className={styles.outlineButton} href="/contact?type=quote">
              Get a Quote
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
