import { tokens } from '../styles/tokens';
import { APP_TITLE } from './appTitle';

export interface Meta {
  title: string;
  description: string;
  /** the public address of the site, with a trailing slash */
  url: string;
  /** path or absolute URL of the 1200x630 preview image */
  ogImage: string;
  themeColor: string;
  /** true while the text and the address are placeholders; the release gate (scripts/check_no_mock.py --content) fails */
  placeholder: boolean;
}

/**
 * PLACEHOLDER page metadata. The human supplies the real description, the final URL and the preview image
 * (web/public/og.png, 1200x630 PNG) before the release; `placeholder: true` makes the release gate fail until then.
 */
export const META: Meta = {
  title: APP_TITLE,
  description: 'Placeholder description. Replace before release.',
  url: 'https://example.invalid/',
  ogImage: '/og.png',
  themeColor: tokens.page,
  placeholder: true
};
