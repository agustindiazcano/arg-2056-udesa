import React from 'react';
import { INSTITUTIONS } from '../ui/institutions';

/** The black footer under the app: it shows only when the page is scrolled down. The four logos. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <ul className="site-logos" aria-label="Instituciones">
        {INSTITUTIONS.map(({ name, src, href }) => (
          <li key={name}>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <img src={src} alt={name} />
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
