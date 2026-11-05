'use client';
import { useEffect, useState, useTransition } from 'react';
import type { Observation } from './data';
import type { Kind } from './catalog';

type Source = { price: number; revision: number; reads: number };
type Row = { label: string; observation: Observation; source: Source };
const short = (id: string) => id.slice(0, 8);
export function Lab({ kind, initial }: { kind: Kind; initial: Observation }) {
  const [current, setCurrent] = useState(initial);
  const [source, setSource] = useState<Source>();
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState('初回の結果を表示しています。');
  const [base, setBase] = useState<Source>();
  const key = initial.key;
  async function state(): Promise<Source> {
    const res = await fetch(`/api/control?key=${encodeURIComponent(key)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('取得元の状態を取得できませんでした');
    return res.json();
  }
  useEffect(() => {
    let active = true;
    state()
      .then((value) => {
        if (active) {
          setSource(value);
          setBase(value);
          setRows([{ label: '初回表示', observation: initial, source: value }]);
        }
      })
      .catch((e) => {
        if (active) setError(String(e));
      });
    return () => {
      active = false;
    };
    // Initial server snapshot stays fixed for this mounted experiment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  async function observe(label = '再リクエスト') {
    // A real HTML request bypasses the client router. No random query parameter:
    // changing the URL would change the experiment's cache key.
    const res = await fetch(window.location.href);
    if (!res.ok) throw new Error(`ページ取得失敗: ${res.status}`);
    const document = new DOMParser().parseFromString(
      await res.text(),
      'text/html',
    );
    const value = document.querySelector('#observation')?.textContent;
    if (!value) throw new Error('観測データがありません');
    const observation = JSON.parse(value) as Observation;
    const next = await state();
    setCurrent(observation);
    setSource(next);
    setRows((rows) =>
      [...rows, { label, observation, source: next }].slice(-6),
    );
    setNotice('サーバーへのHTTPリクエストを完了しました。');
  }
  function action(action: string) {
    startTransition(async () => {
      setError('');
      try {
        if (action === 'read') return await observe();
        const res = await fetch('/api/control', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, action }),
        });
        if (!res.ok) throw new Error(`操作失敗: ${res.status}`);
        setSource(await state());
        setNotice(
          action === 'mutate'
            ? '取得元だけを+100円に更新しました。次に再リクエストしてください。'
            : '無効化を受け付けました。次に再リクエストしてください。',
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }
  const renderSame = current.renderId === initial.renderId;
  const sampleSame = current.samples[0].readId === initial.samples[0].readId;
  return (
    <section className="lab" aria-label="実測結果">
      <div className="flow">
        <span>ブラウザ</span>
        <i>→</i>
        <span className={kind === 'full' ? 'active' : ''}>ページの描画</span>
        <i>→</i>
        <span className={kind !== 'full' ? 'active' : ''}>
          {kind === 'cached' || kind === 'lifetime'
            ? 'use cache'
            : kind === 'memo'
              ? '同一描画内の取得'
              : 'Data Cache'}
        </span>
        <i>→</i>
        <span>取得元API</span>
      </div>
      <div className="metrics">
        <div className="metric featured">
          <span>ページが返した価格</span>
          <strong data-testid="display-price">
            ¥{current.samples[0].price}
          </strong>
          <small>revision {current.samples[0].revision}</small>
        </div>
        <div className="metric">
          <span>取得元の現在価格</span>
          <strong data-testid="source-price">
            {source ? `¥${source.price}` : '…'}
          </strong>
          <small>
            {source && source.price !== current.samples[0].price
              ? '表示と取得元に差があります'
              : '表示価格と一致'}
          </small>
        </div>
        <div className="metric">
          <span>取得元へのアクセス</span>
          <strong data-testid="source-reads">
            {source?.reads ?? '…'}
            <em>回</em>
          </strong>
          <small>
            初回表示から +{source && base ? source.reads - base.reads : 0} 回
          </small>
        </div>
      </div>
      <div className="evidence">
        <div>
          <span>描画ID</span>
          <code data-testid="render-id">{short(current.renderId)}</code>
          <small>
            {rows.length > 1
              ? renderSame
                ? '初回と同じ'
                : '初回から変化'
              : '比較前'}
          </small>
        </div>
        <div>
          <span>取得ID{kind === 'memo' ? ' / Component A' : ''}</span>
          <code data-testid="read-id">{short(current.samples[0].readId)}</code>
          <small>
            {rows.length > 1
              ? sampleSame
                ? '初回と同じ'
                : '初回から変化'
              : '比較前'}
          </small>
        </div>
        {current.samples[1] && (
          <div>
            <span>取得ID / Component B</span>
            <code>{short(current.samples[1].readId)}</code>
            <small>
              {current.samples[0].readId === current.samples[1].readId
                ? 'Aと一致 → 取得は1回'
                : 'Aと異なる'}
            </small>
          </div>
        )}
      </div>
      <div className="controls">
        <button disabled={pending || !source} onClick={() => action('read')}>
          再リクエスト
        </button>
        <button
          className="secondary"
          disabled={pending || !source}
          onClick={() => action('mutate')}
        >
          取得元を +100円
        </button>
        {kind !== 'memo' && (
          <button
            className="secondary"
            disabled={pending || !source}
            onClick={() => action(kind === 'full' ? 'path' : 'expire')}
          >
            {kind === 'full' ? 'パスを再検証' : 'タグを即時失効'}
          </button>
        )}
        {(kind === 'cached' || kind === 'data') && (
          <button
            className="secondary"
            disabled={pending || !source}
            onClick={() => action('swr')}
          >
            タグをSWRで無効化
          </button>
        )}
      </div>
      {(kind === 'cached' || kind === 'lifetime') && (
        <div className="key-switch">
          引数の比較：<a href={`/${kind}?key=${kind}-a`}>キーA</a>
          <a href={`/${kind}?key=${kind}-b`}>キーB</a>
          <code>key = {key}</code>
        </div>
      )}
      <p className="status" role="status">
        {pending ? '実行中…' : notice}
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="history">
        <div className="section-label">
          OBSERVATIONS <span>直近6件・実測値</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>操作</th>
              <th>表示 / 取得元</th>
              <th>描画ID</th>
              <th>取得ID</th>
              <th>取得回数</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td>
                  {i + 1}. {row.label}
                </td>
                <td>
                  ¥{row.observation.samples[0].price} / ¥{row.source.price}
                </td>
                <td>
                  <code>{short(row.observation.renderId)}</code>
                </td>
                <td>
                  <code>{short(row.observation.samples[0].readId)}</code>
                </td>
                <td>{row.source.reads}回</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
