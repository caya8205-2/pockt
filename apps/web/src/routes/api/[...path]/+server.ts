import type { RequestHandler } from './$types';

const API_BASE = process.env.API_INTERNAL_URL || process.env.VITE_BACKEND_URL || 'http://localhost:3001';

const proxy: RequestHandler = async ({ request, params, url }) => {
  const target = new URL(`/api/${params.path || ''}`, API_BASE);
  target.search = url.search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (['host', 'connection', 'content-length', 'content-encoding', 'accept-encoding'].includes(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  let body: string | undefined = undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'OPTIONS') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        const jsonData = await request.json();
        if (jsonData && typeof jsonData === 'object') {
          body = JSON.stringify(jsonData);
          headers.set('content-type', 'application/json');
          headers.set('content-length', String(Buffer.byteLength(body, 'utf-8')));
        }
      } catch {
        // Fallback to text if JSON parsing fails
      }
    }

    if (body === undefined) {
      try {
        const textData = await request.text();
        if (textData && textData.length > 0) {
          body = textData;
          headers.set('content-length', String(Buffer.byteLength(body, 'utf-8')));
        }
      } catch {
        body = undefined;
      }
    }
  }

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
};
