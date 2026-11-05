import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { readSource, tag, validKey } from '../../../../shared/data';
import { Experiment } from '../../../../shared/experiment';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  await connection();
  const key = (await searchParams).key || 'data-a';
  if (!validKey(key)) notFound();
  const sample = await readSource(key, {
    cache: 'force-cache',
    next: { tags: [tag(key)] },
  });
  return (
    <Experiment
      kind="data"
      observation={{ key, renderId: randomUUID(), samples: [sample] }}
    />
  );
}
