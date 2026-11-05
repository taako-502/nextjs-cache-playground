export type Sample = {
  key: string;
  price: number;
  revision: number;
  reads: number;
  readId: string;
  readAt: string;
};
export type Observation = { renderId: string; samples: Sample[]; key: string };
export const origin = process.env.ORIGIN_URL || 'http://127.0.0.1:4200';
export function validKey(value: string) {
  return /^[a-zA-Z0-9_-]{1,70}$/.test(value);
}
export async function readSource(
  key: string,
  options: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    cache: 'no-store',
  },
  delay = 0,
): Promise<Sample> {
  const response = await fetch(
    `${origin}/read?key=${encodeURIComponent(key)}&delay=${delay}`,
    options,
  );
  if (!response.ok) throw new Error(`Origin read failed (${response.status})`);
  return response.json();
}
export const tag = (key: string) => `lab:${key}`;
