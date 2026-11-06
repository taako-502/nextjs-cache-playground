'use client';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Sample } from '../../../../shared/data';
type Entry = { name: string; id: string };
const VisitContext = createContext<(entry: Entry) => void>(() => {});
export function NavigationLog({ children }: { children: React.ReactNode }) {
  const [visits, setVisits] = useState<Entry[]>([]);
  const [requests, setRequests] = useState<{ time: number; path: string }[]>(
    [],
  );
  const actions = useRef<{ time: number; phase: string }[]>([]);
  const add = useCallback(
    (e: Entry) =>
      setVisits((v) => (v.at(-1)?.id === e.id ? v : [...v, e].slice(-8))),
    [],
  );
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const events = list
        .getEntries()
        .map((e) => ({ url: new URL(e.name), time: Math.round(e.startTime) }))
        .filter(
          (e) =>
            e.url.pathname.startsWith('/navigation') &&
            (e.url.searchParams.has('_rsc') || e.url.pathname.endsWith('.rsc')),
        );
      if (events.length)
        setRequests((r) =>
          [
            ...r,
            ...events.map((e) => ({ time: e.time, path: e.url.pathname })),
          ].slice(-8),
        );
    });
    observer.observe({ type: 'resource', buffered: true });
    return () => observer.disconnect();
  }, []);
  return (
    <VisitContext.Provider value={add}>
      <div
        onClickCapture={(event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;
          const control = target.closest('[data-phase]');
          if (control?.getAttribute('data-phase'))
            actions.current.push({
              time: performance.now(),
              phase: control.getAttribute('data-phase')!,
            });
        }}
      >
        {children}
      </div>
      <section className="reading-guide">
        <strong>表示履歴</strong>
        <table>
          <thead>
            <tr>
              <th>順番</th>
              <th>画面</th>
              <th>取得ID</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((v, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{v.name}</td>
                <td>{v.id.slice(0, 8)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <strong>このタブで完了したRSC通信</strong>
        <table>
          <thead>
            <tr>
              <th>要求開始時の操作</th>
              <th>タブ開始から</th>
              <th>要求先</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => (
              <tr key={i}>
                <td>
                  {actions.current.filter((a) => a.time <= r.time).at(-1)
                    ?.phase ?? 'リンク表示後'}
                </td>
                <td>{r.time}ms</td>
                <td>{r.path}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          時刻はタブの読み込み開始から。リンク表示時には詳細の静的部分を事前取得し、クリック後に動的な価格が届きます。
        </p>
      </section>
    </VisitContext.Provider>
  );
}
export function Visit({ name, sample }: { name: string; sample: Sample }) {
  const actions = useRef<{ time: number; phase: string }[]>([]);
  const add = useContext(VisitContext);
  useEffect(() => {
    add({ name, id: sample.readId });
  }, [name, sample.readId, add]);
  return (
    <div className="metric featured">
      <span>{name}で取得した価格</span>
      <strong>¥{sample.price}</strong>
      <small>
        取得ID <code data-testid="nav-id">{sample.readId.slice(0, 8)}</code>
      </small>
    </div>
  );
}
export function Controls({ detail }: { detail: boolean }) {
  const router = useRouter();
  return (
    <div className="controls">
      {detail && (
        <button data-phase="戻る操作後" onClick={() => router.back()}>
          一覧に戻る（履歴）
        </button>
      )}
      <button className="secondary" onClick={() => window.location.reload()}>
        再読み込み
      </button>
    </div>
  );
}
