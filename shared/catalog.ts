export const experiments = {
  memo: {
    number: '01',
    title: 'Request Memoization',
    lead: '同じ描画の2回の取得が、1回にまとまる。',
    scope: '1回のサーバーレンダリング',
    code: "fetch(url, { cache: 'no-store' }) × 2",
    expected:
      '2つの取得IDが一致。再リクエストすると両方のIDが変わり、取得元へのアクセスは1回増える。',
    note: '同一URL・オプションのGETを、2つのServer Componentから呼び出す。Data CacheとFull Route Cacheは使わない。',
  },
  data: {
    number: '02',
    title: 'Data Cache',
    lead: 'ページを描画し直しても、取得結果は再利用。',
    scope: '複数のサーバーリクエスト',
    code: "fetch(url, { cache: 'force-cache', next: { tags } })",
    expected:
      '描画IDが変わっても、取得IDと価格は同じ。タグを失効させた後の取得で最新価格に変わる。',
    note: 'connection()でページは動的に描画。Full Route Cacheを除外し、Data Cacheだけを観測する。',
  },
  full: {
    number: '03',
    title: 'Full Route Cache',
    lead: 'ページの描画結果ごと、再利用。',
    scope: 'HTML・RSCのサーバーキャッシュ',
    code: 'export const revalidate = 3600',
    expected:
      '再リクエストしても描画IDが同じ。パスの再検証後は描画IDが変わる。',
    note: 'ビルド時の取得もカウントに含む。Data Cacheも併用するため、取得回数だけでこの層のヒットを判断しない。',
  },
  cached: {
    number: '05',
    title: 'use cache',
    lead: '関数の戻り値を、引数ごとに再利用。',
    scope: 'Cache Components / 関数の出力',
    code: "'use cache'; cacheTag(key); cacheLife({ … })",
    expected:
      '描画IDが変わっても取得IDは同じ。キーAとキーBは別キャッシュ。タグの即時失効後は最新値を取得する。',
    note: '内側のfetchはno-store。外側のuse cacheによる再利用を観測する。キーを変えると別のデータを取得する。',
  },
  lifetime: {
    number: '06',
    title: 'cacheLife',
    lead: '標準メモリキャッシュは、5秒後の要求で再取得。',
    scope: 'revalidate: 5秒 / expire: 10秒',
    code: 'cacheLife({ stale: 0, revalidate: 5, expire: 10 })',
    expected:
      '取得元を更新し、5秒以内に再要求すると古い価格。5秒経過後の再要求では、新しい値を待って返す。',
    note: 'Next.js 16.4.5の標準ハンドラーは本番環境でrevalidate経過後のエントリーを破棄する。時間だけでは自動取得しない。expireの10秒より先に破棄されるため、この構成ではexpire単独の効果は分離できない。',
  },
} as const;
export type Kind = keyof typeof experiments;
