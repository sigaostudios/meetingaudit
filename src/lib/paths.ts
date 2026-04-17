export function resolveAssetPath(path: string) {
  return `/${path.replace(/^\/+/, "")}`
}
