import React from 'react';
import { INSTITUTIONS } from '../ui/institutions';

/** The black footer under the app: it shows only when the page is scrolled down. The four logos, and under them the buttons to the sources and to the methodology. */
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
      <nav className="site-links" aria-label="Fuentes y metodología">
        <a className="site-btn" href="references.html">
          Fuentes
        </a>
        <a className="site-btn" href="references.html#metodologia">
          Metodología
        </a>
      </nav>
    </footer>
  );
}
