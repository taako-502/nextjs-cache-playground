export const experiments = {
  cached: {
    number: '01',
    title: 'use cache',
    lead: '関数の戻り値を、引数ごとに再利用。',
    scope: 'Cache Components / 関数の出力',
    code: "'use cache'; cacheTag(key); cacheLife({ … })",
    expected:
      '描画IDが変わっても取得IDは同じ。キーAとキーBは別キャッシュ。タグの即時失効後は最新値を取得する。',
    note: '内側のfetchはno-store。外側のuse cacheによる再利用を観測する。キーを変えると別のデータを取得する。',
  },
  lifetime: {
    number: '02',
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
