import './globals.css';

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Lora:ital,wght@0,500;0,600;1,500&display=swap" rel="stylesheet" />
        <noscript><style>{'.sp{display:none}'}</style></noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
