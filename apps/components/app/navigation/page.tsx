import { Suspense } from 'react';
import Link from 'next/link';
import { LivePrice } from './sample';
import { Controls } from './log';
export default function Page() {
  return (
    <section className="lab">
      <h2>商品一覧</h2>
      <Suspense fallback={<p>一覧の価格を取得中…</p>}>
        <LivePrice />
      </Suspense>
      <div className="controls">
        <Link
          data-phase="詳細クリック後"
          className="button"
          href="/navigation/detail"
        >
          商品詳細へ
        </Link>
      </div>
      <Controls detail={false} />
    </section>
  );
}
