import { NavigationLog } from './log';
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <section className="experiment-heading">
        <p className="eyebrow">EXPERIMENT 05</p>
        <h1>画面遷移とキャッシュ</h1>
        <p>一覧から詳細へ移動して戻り、最初の一覧と取得IDを比較します。</p>
      </section>
      <NavigationLog>{children}</NavigationLog>
    </>
  );
}
