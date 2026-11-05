import { connection } from 'next/server';
import { randomUUID } from 'node:crypto';
import { notFound } from 'next/navigation';
import { readSource } from '../../../../../shared/data';
import { RouterSample } from '../../../../../shared/router-lab';
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  if (id !== 'a' && id !== 'b') notFound();
  const sample = await readSource(`router-${id}`, { cache: 'no-store' });
  return <RouterSample id={id} renderId={randomUUID()} sample={sample} />;
}
