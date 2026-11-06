import { connection } from 'next/server';
import { readSource } from '../../../../shared/data';
import { Visit } from './log';
export async function LivePrice({ detail = false }: { detail?: boolean }) {
  await connection();
  return (
    <Visit
      name={detail ? '詳細' : '一覧'}
      sample={await readSource(detail ? 'nav-detail' : 'nav-list', {
        cache: 'no-store',
      })}
    />
  );
}
