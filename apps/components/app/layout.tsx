import '../../../shared/styles.css';
import { Header } from '../../../shared/header';
export const metadata = {
  title: 'Next.js Cache Lab',
  description: '実際のNext.jsでキャッシュの境界を観測する実験室',
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Header modern={true} />
        <main>{children}</main>
        <footer>Next.js 16.4.5 · Cache Components ON · ローカルの実測値</footer>
      </body>
    </html>
  );
}
