const text = (value, limit = 200) => typeof value === "string" ? value.trim().slice(0, limit) : "";

async function searchGoogle(query, fetcher) {
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

async function searchOpenLibrary(query, fetcher) {
  const response = await fetcher(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6&fields=key,title,author_name,number_of_pages_median,first_publish_year`,
    { signal: AbortSignal.timeout(12000) },
  );
  if (!response.ok) throw new Error("Book search is unavailable just now.");
  const data = await response.json();
  if (!data || !Array.isArray(data.docs)) throw new Error("The book catalogue returned an invalid response.");
  return data.docs.slice(0, 6).flatMap((book) => {
    const title = text(book?.title);
    if (!title) return [];
    const pages = book.number_of_pages_median;
    return [{
      id: text(book.key), title,
      authors: Array.isArray(book.author_name) ? book.author_name.map(author => text(author)).filter(Boolean).slice(0, 10) : [],
      publisher: "",
      publishedDate: Number.isInteger(book.first_publish_year) ? String(book.first_publish_year) : "",
      pageCount: Number.isInteger(pages) && pages > 0 && pages <= 20000 ? pages : undefined,
      pageCountEstimated: true,
      source: "Open Library",
    }];
  });
}

export async function searchBooks(query, fetcher = fetch) {
  const term = text(query);
  if (!term) throw new Error("Enter a title, author or ISBN.");
  try {
    return await searchGoogle(term, fetcher);
  } catch (primaryError) {
    try {
      return await searchOpenLibrary(term, fetcher);
    } catch {
      // Preserve the primary failure type for the existing timeout/offline UI.
      throw primaryError;
    }
  }
}
