import type { ReferenceSource } from '../types/references.js';

/** "<authors_or_publisher>. <title>. <year or s. f.>. Consultado el <date>. <url>", without doubled periods. */
export function formatCitation(source: ReferenceSource): string {
  const title = source.title.endsWith('.') ? source.title : `${source.title}.`;
  const year = source.publication_date ? `${source.publication_date.slice(0, 4)}.` : 's. f.';
  return `${source.authors_or_publisher}. ${title} ${year} Consultado el ${source.retrieved_at}. ${source.url}`;
}
