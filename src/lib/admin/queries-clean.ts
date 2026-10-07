/** Keeps search text safe inside a PostgREST filter (commas and brackets would add conditions). */
export function cleanSearch(q?: string) {
  return (q ?? '').replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)
}
