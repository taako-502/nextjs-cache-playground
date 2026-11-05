'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Sample } from './data';
type Visit = { id: string; renderId: string; sample: Sample };
const RecordContext = createContext<(visit: Visit) => void>(() => {});
export function RouterLab({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const record = useCallback(
    (visit: Visit) =>
      setVisits((v) =>
        v.at(-1)?.renderId === visit.renderId && v.at(-1)?.id === visit.id
          ? v
          : [...v, visit].slice(-6),
      ),
    [],
  );
  return (
    <RecordContext.Provider value={record}>
      <div className="breadcrumb">
        <a href="/">実験一覧</a>
        <span>/ 04</span>
      </div>
      <section className="experiment-heading">
        <p className="eyebrow">EXPERIMENT 04 / CLIENT-SIDE CACHE</p>
        <h1>Router Cache</h1>
        <p>ページを離れて戻る。同じ描画結果が、ブラウザに残る。</p>
      </section>
      <div className="code-line">
        <code>{'<Link prefetch={false}> + router.back()'}</code>
      </div>
      <div className="router-panel">
        <div className="flow">
          <span className="active">ブラウザのRSCキャッシュ</span>
          <i>→</i>
          <span>動的ページ</span>
          <i>→</i>
          <span>no-storeの取得</span>
        </div>
        <nav className="controls" aria-label="ページ遷移">
          <Link className="button" prefetch={false} href="/router/a">
            ページAへ
          </Link>
          <Link className="button" prefetch={false} href="/router/b">
            ページBへ
          </Link>
          <button className="secondary" onClick={() => router.back()}>
            戻る
          </button>
          <button className="secondary" onClick={() => router.refresh()}>
            router.refresh()
          </button>
        </nav>
        {children}
        <div className="history">
          <div className="section-label">
            NAVIGATION HISTORY <span>このタブ内の観測</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>表示順</th>
                <th>ページ</th>
                <th>描画ID</th>
                <th>取得ID</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{v.id.toUpperCase()}</td>
                  <td>
                    <code>{v.renderId.slice(0, 8)}</code>
                  </td>
                  <td>
                    <code>{v.sample.readId.slice(0, 8)}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="reading-guide">
        <strong>操作：A → B → 戻る → router.refresh()</strong>
        <p>
          戻ったAの描画IDを初回と比較。refresh後はサーバーで新しく描画され、IDが変わります。
        </p>
        <p>
          事前取得を無効にし、サーバー側のData Cache・Full Route
          Cacheも使いません。戻る操作と通常のリンク遷移は別の挙動として観測します。
        </p>
      </aside>
    </RecordContext.Provider>
  );
}
export function RouterSample(visit: Visit) {
  const record = useContext(RecordContext);
  useEffect(() => {
    record(visit);
  }, [record, visit.id, visit.renderId]);
  return (
    <div className="router-result">
      <span className="eyebrow">CURRENT PAGE</span>
      <h2 data-testid="router-page">ページ{visit.id.toUpperCase()}</h2>
      <div className="evidence">
        <div>
          <span>描画ID</span>
          <code data-testid="router-render-id">
            {visit.renderId.slice(0, 8)}
          </code>
        </div>
        <div>
          <span>取得ID</span>
          <code>{visit.sample.readId.slice(0, 8)}</code>
        </div>
        <div>
          <span>価格</span>
          <strong>¥{visit.sample.price}</strong>
        </div>
      </div>
    </div>
  );
}
