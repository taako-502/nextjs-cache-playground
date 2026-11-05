import { experiments } from './catalog';
export function Home({ modern }: { modern: boolean }) {
  const cards = modern
    ? [
        { ...experiments.cached, href: '/cached?key=cache-a' },
        { ...experiments.lifetime, href: '/lifetime?key=life-a' },
        {
          number: '07',
          title: 'Partial Prerendering',
          lead: '静的な部分を先に表示。動的な部分は後から届く。',
          scope: '静的シェル + キャッシュ + ストリーミング',
          href: '/ppr',
        },
      ]
    : [
        { ...experiments.memo, href: '/memo?key=memo-a' },
        { ...experiments.data, href: '/data?key=data-a' },
        { ...experiments.full, href: '/full-route' },
        {
          number: '04',
          title: 'Router Cache',
          lead: '戻る操作で、ブラウザ内の描画結果を再利用。',
          scope: 'クライアントのRSCキャッシュ',
          href: '/router/a',
        },
      ];
  return (
    <>
      <section className="hero">
        <p className="eyebrow">NEXT.JS CACHE PLAYGROUND</p>
        <h1>
          キャッシュの境界を、
          <br />
          目で確かめる。
        </h1>
        <p className="hero-copy">
          同じ価格が表示される理由は、ひとつではありません。
          <br />
          取得ID・描画ID・アクセス回数で、再利用された場所を観測します。
        </p>
        <div className="model-label">
          <span className="dot" />
          {modern ? 'Cache Components 有効' : 'Cache Components 無効'}
          <span>本番ビルドで検証</span>
        </div>
      </section>
      <div className="section-label">
        EXPERIMENTS <span>{cards.length}つの実験</span>
      </div>
      <section className="cards">
        {cards.map((c) => (
          <a className="experiment-card" href={c.href} key={c.number}>
            <span className="experiment-number">{c.number}</span>
            <span className="arrow">↗</span>
            <h2>{c.title}</h2>
            <p>{c.lead}</p>
            <small>{c.scope}</small>
          </a>
        ))}
      </section>
      <aside className="reading-guide">
        <strong>3つの観測点</strong>
        <p>
          <b>描画ID</b> ページを生成した単位　 /　 <b>取得ID</b>{' '}
          取得元が応答した単位　 /　 <b>アクセス回数</b>{' '}
          実際に取得元へ届いたGETの数
        </p>
        <p>
          価格だけではキャッシュの場所は分かりません。各実験では、ほかの層の影響を抑えて比較します。
        </p>
      </aside>
    </>
  );
}
