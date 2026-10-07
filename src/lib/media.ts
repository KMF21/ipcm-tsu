/** Public URL for a file in the public-media bucket; local paths (/people/...) are used as they are. */
export function mediaUrl(path?: string | null) {
  if (!path) return null
  if (path.startsWith('/') || path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`
}
