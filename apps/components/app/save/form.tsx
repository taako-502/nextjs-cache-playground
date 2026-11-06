'use client';
import { useActionState } from 'react';
import { savePrice } from './action';
import type { Sample } from '../../../../shared/data';
export function PriceForm({ initial }: { initial: Sample }) {
  const [result, submit, pending] = useActionState(
    savePrice.bind(null, initial.key),
    null,
  );
  const saved = result && 'after' in result ? result : null;
  return (
    <section className="lab">
      <div className="metrics">
        <div className="metric">
          <span>保存前の価格</span>
          <strong>¥{(saved?.before ?? initial).price}</strong>
          <small>取得ID {(saved?.before ?? initial).readId.slice(0, 8)}</small>
        </div>
        <div className="metric featured">
          <span>保存後に読み取った価格</span>
          <strong data-testid="saved-price">
            {saved ? '¥' + saved.after.price : '—'}
          </strong>
          <small>
            {saved
              ? '取得ID ' + saved.after.readId.slice(0, 8)
              : '保存すると表示します'}
          </small>
        </div>
      </div>
      <form className="controls" action={submit}>
        <label>
          新しい価格（円）{' '}
          <input
            type="number"
            name="price"
            min="0"
            max="1000000"
            required
            defaultValue={Math.min(initial.price + 100, 1000000)}
          />
        </label>
        <button disabled={pending}>{pending ? '保存中…' : '保存'}</button>
      </form>
      {result && 'error' in result && <p role="alert">{result.error}</p>}
      {saved && (
        <p role="status">保存完了。同じServer Actionで商品を再取得しました。</p>
      )}
    </section>
  );
}
