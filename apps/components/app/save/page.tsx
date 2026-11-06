import { Suspense } from 'react';
import { connection } from 'next/server';
import { notFound } from 'next/navigation';
import { validKey } from '../../../../shared/data';
import { cachedProduct } from '../../lib/cached';
import { PriceForm } from './form';
type Props = { searchParams: Promise<{ key?: string }> };
async function Editor({ searchParams }: Props) {
  await connection();
  const key = (await searchParams).key ?? 'save-demo';
  if (!validKey(key) || !key.startsWith('save-')) notFound();
  return <PriceForm initial={await cachedProduct(key)} />;
}
export default function Page(props: Props) {
  return (
    <>
      <section className="experiment-heading">
        <p className="eyebrow">EXPERIMENT 04</p>
        <h1>保存後の更新</h1>
        <p>新しい価格を保存し、更新した本人が読み取る値を確認します。</p>
      </section>
      <div className="code-line">
        <code>保存 → updateTag → 同じ引数で cachedProduct を再実行</code>
      </div>
      <Suspense fallback={<p>価格を取得中…</p>}>
        <Editor {...props} />
      </Suspense>
      <aside className="reading-guide">
        保存前後の取得IDを比較してください。保存後の価格は取得元から読み直した実測値です。
      </aside>
    </>
  );
}
