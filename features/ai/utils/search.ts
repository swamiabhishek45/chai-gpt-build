export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}
/**
 * Searches the web using the Tavily Search API.
 * @param query The search query string.
 * @returns A promise resolving to an array of search results.
 */
export async function searchTavily(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY is not defined in environment variables");
  }
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily search request failed: ${response.status} ${errorText}`);
  }
  const data = (await response.json()) as { results: SearchResult[] };
  return data.results || [];
}
