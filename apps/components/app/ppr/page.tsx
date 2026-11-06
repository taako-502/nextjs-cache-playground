import { Suspense } from 'react';
import { connection } from 'next/server';
import { randomUUID } from 'node:crypto';
import { readSource } from '../../../../shared/data';
import { cachedProduct } from '../../lib/cached';
import { Refresh } from '../../../../shared/refresh';
async function Cached() {
  const sample = await cachedProduct('ppr-cached');
  return (
    <div className="ppr-card cached">
      <span className="eyebrow">CACHED</span>
      <h2>共通の商品価格</h2>
      <strong>¥{sample.price}</strong>
      <p>use cacheの取得ID</p>
      <code data-testid="ppr-cached-id">{sample.readId.slice(0, 8)}</code>
      <p>再読み込みしても同じ取得結果</p>
    </div>
  );
}
async function Dynamic() {
  await connection();
  const sample = await readSource('ppr-dynamic', { cache: 'no-store' }, 1800);
  const renderId = randomUUID();
  return (
    <div className="ppr-card dynamic" data-testid="ppr-dynamic">
      <span className="eyebrow">DYNAMIC</span>
      <h2>リクエストごとの情報</h2>
      <strong>取得 #{sample.reads}</strong>
      <p>動的部分の描画ID</p>
      <code data-testid="ppr-dynamic-id">{renderId.slice(0, 8)}</code>
      <p>約1.8秒後にストリーミングで届く</p>
    </div>
  );
}
export default function Page() {
  return (
    <>
      <div className="breadcrumb">
        <a href="/">実験一覧</a>
        <span>/ 03</span>
      </div>
      <section className="experiment-heading">
        <p className="eyebrow">EXPERIMENT 03 / CACHE COMPONENTS</p>
        <h1>Partial Prerendering</h1>
        <p>静的なシェルを先に。動的な内容は、準備できたら。</p>
      </section>
      <div className="ppr-shell" data-testid="ppr-shell">
        <span className="eyebrow">STATIC SHELL</span>
        <h2>商品ページ</h2>
        <p>
          この見出しとレイアウトは事前生成。動的データの取得完了を待ちません。
        </p>
        <div className="ppr-grid">
          <Cached />
          <Suspense
            fallback={
              <div className="ppr-card loading" data-testid="ppr-fallback">
                <span className="eyebrow">STREAMING</span>
                <h2>動的データを取得中</h2>
                <div className="skeleton" />
                <p>静的部分はすでに表示されています</p>
              </div>
            }
          >
            <Dynamic />
          </Suspense>
        </div>
      </div>
      <Refresh />
      <aside className="reading-guide">
        <strong>観測のポイント</strong>
        <p>
          再読み込みしても共通価格の取得IDは同じ。動的部分の描画IDは変わります。
        </p>
        <p>
          取得元に1.8秒の遅延を入れ、静的シェル・フォールバック・動的内容の到着順を観測します。
        </p>
      </aside>
    </>
  );
}
