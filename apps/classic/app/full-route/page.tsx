import { randomUUID } from 'node:crypto';
import { readSource, tag } from '../../../../shared/data';
import { Experiment } from '../../../../shared/experiment';
export const revalidate = 3600;
export default async function Page() {
  const key = 'full-route';
  const sample = await readSource(key, {
    cache: 'force-cache',
    next: { tags: [tag(key)] },
  });
  return (
    <Experiment
      kind="full"
      observation={{ key, renderId: randomUUID(), samples: [sample] }}
    />
  );
}
