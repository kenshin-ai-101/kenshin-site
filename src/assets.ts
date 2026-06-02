const ABSOLUTE_URL = /^https?:\/\//i;

export function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function asset(path: string) {
  if (ABSOLUTE_URL.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
    return path;
  }

  return joinUrl(import.meta.env.BASE_URL || "./", path);
}

export function videoAsset(fileName: string) {
  const base = import.meta.env.VITE_VIDEO_BASE_URL?.trim() || "/assets/videos-web";
  return ABSOLUTE_URL.test(base) ? joinUrl(base, fileName) : asset(joinUrl(base, fileName));
}
