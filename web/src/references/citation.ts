import type { ReferenceSource } from '../types/references.js';

/** "<authors_or_publisher>. <title>. <year or n.d.>. Retrieved <date>. <url>", without doubled periods. */
export function formatCitation(source: ReferenceSource): string {
  const title = source.title.endsWith('.') ? source.title : `${source.title}.`;
  const year = source.publication_date ? `${source.publication_date.slice(0, 4)}.` : 'n.d.';
  return `${source.authors_or_publisher}. ${title} ${year} Retrieved ${source.retrieved_at}. ${source.url}`;
}
