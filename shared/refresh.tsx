'use client';
export function Refresh() {
  return (
    <div className="controls">
      <button onClick={() => window.location.reload()}>
        ページを再読み込み
      </button>
    </div>
  );
}
