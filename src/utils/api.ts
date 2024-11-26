import { headers } from 'next/headers';

export async function getBaseUrl() {
  // In server-side code, we need to get the host from the request headers
  if (typeof window === 'undefined') {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    return `${protocol}://${host}`;
  }

  // In client-side code, we can use relative URLs
  return '';
}

export async function getApiUrl(path: string) {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}${path}`;
}
