export const BUCKET_URL = process.env.SPACES_CDN_URL as string;

export function constructAssetUrl(key: string) {
  return `${BUCKET_URL}/${key}`;
}

export function getKeyFromAssetUrl(url: string) {
  return url.split(`${BUCKET_URL}/`)[1];
}
