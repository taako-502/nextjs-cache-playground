import { Suspense } from 'react';
import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { validKey } from '../../../../shared/data';
import { Experiment } from '../../../../shared/experiment';
import { shortLivedProduct } from '../../lib/cached';
async function Result({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  await connection();
  const key = (await searchParams).key || 'life-a';
  if (!validKey(key)) notFound();
  const sample = await shortLivedProduct(key);
  return (
    <Experiment
      kind="lifetime"
      observation={{ key, renderId: randomUUID(), samples: [sample] }}
    />
  );
}
export default function Page(props: {
  searchParams: Promise<{ key?: string }>;
}) {
  return (
    <Suspense fallback={<p className="loading">実測値を取得中…</p>}>
      <Result {...props} />
    </Suspense>
  );
}
