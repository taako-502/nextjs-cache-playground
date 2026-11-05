import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { readSource, validKey } from '../../../../shared/data';
import { Experiment } from '../../../../shared/experiment';

// Both child components perform the same GET inside one React render.
async function First({ sourceKey }: { sourceKey: string }) {
  const first = await readSource(sourceKey);
  return <Second sourceKey={sourceKey} first={first} />;
}
async function Second({
  sourceKey,
  first,
}: {
  sourceKey: string;
  first: Awaited<ReturnType<typeof readSource>>;
}) {
  const second = await readSource(sourceKey);
  return (
    <Experiment
      kind="memo"
      observation={{
        key: sourceKey,
        renderId: randomUUID(),
        samples: [first, second],
      }}
    />
  );
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  await connection();
  const key = (await searchParams).key || 'memo-a';
  if (!validKey(key)) notFound();
  return <First sourceKey={key} />;
}
