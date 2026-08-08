import type { RequestHandler } from './$types';

const API_BASE = process.env.API_INTERNAL_URL || process.env.VITE_BACKEND_URL || 'http://localhost:3001';

const proxy: RequestHandler = async ({ request, params, url }) => {
  const target = new URL(`/api/${params.path || ''}`, API_BASE);
  target.search = url.search;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (['host', 'connection', 'content-length'].includes(key.toLowerCase())) continue;
    headers.set(key, value);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

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
