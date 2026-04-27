export interface SearchResultEntry {
  id: string;
  title: string;
  matchedFields: string[];
  snippet: string;
}

interface SearchResultSectionProps {
  ariaLabel: string;
  heading: string;
  results: SearchResultEntry[];
  emptyMessage: string;
}

export function SearchResultSection({
  ariaLabel,
  heading,
  results,
  emptyMessage,
}: SearchResultSectionProps) {
  return (
    <section aria-label={ariaLabel}>
      <h6>{heading}</h6>
      {results.length > 0 ? (
        <ul>
          {results.map((result) => (
            <li key={result.id}>
              <strong>{result.title}</strong>
              <div>命中字段：{result.matchedFields.join("、")}</div>
              <div>命中摘要：{result.snippet}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p>{emptyMessage}</p>
      )}
    </section>
  );
}
