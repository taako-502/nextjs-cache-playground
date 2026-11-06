import { Suspense } from 'react';
import { LivePrice } from '../sample';
import { Controls } from '../log';
export default function Page() {
  return (
    <section className="lab">
      <h2>商品詳細</h2>
      <p>商品名とこの見出しは事前取得できる静的部分です。</p>
      <Suspense fallback={<p>詳細の価格を取得中…</p>}>
        <LivePrice detail />
      </Suspense>
      <Controls detail />
    </section>
  );
}
