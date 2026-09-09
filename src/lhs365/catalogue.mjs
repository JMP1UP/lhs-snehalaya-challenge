const text = (value, limit = 200) => typeof value === "string" ? value.trim().slice(0, limit) : "";

export async function searchBooks(query, fetcher = fetch) {
  const term = text(query);
  if (!term) throw new Error("Enter a title, author or ISBN.");
  const response = await fetcher(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(term)}&maxResults=6&printType=books`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!response.ok) throw new Error("Book search is unavailable just now. You can still add your book manually below.");
  const data = await response.json();
  if (!data || (data.items !== undefined && !Array.isArray(data.items))) throw new Error("The book catalogue returned an invalid response.");
  return (data.items || []).slice(0, 6).flatMap((item) => {
    const volume = item?.volumeInfo;
    const title = text(volume?.title);
    if (!title) return [];
    return [{
      id: text(item.id), title,
      authors: Array.isArray(volume.authors) ? volume.authors.map(author => text(author)).filter(Boolean).slice(0, 10) : [],
      publisher: text(volume.publisher),
      publishedDate: text(volume.publishedDate, 40),
      pageCount: Number.isInteger(volume.pageCount) && volume.pageCount > 0 && volume.pageCount <= 20000 ? volume.pageCount : undefined,
    }];
  });
}
