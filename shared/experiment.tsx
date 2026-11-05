import { experiments, type Kind } from './catalog';
import { Lab } from './lab';
import type { Observation } from './data';
export function Experiment({
  kind,
  observation,
}: {
  kind: Kind;
  observation: Observation;
}) {
  const spec = experiments[kind];
  return (
    <>
      <div className="breadcrumb">
        <a href="/">実験一覧</a>
        <span>/ {spec.number}</span>
      </div>
      <section className="experiment-heading">
        <p className="eyebrow">
          EXPERIMENT {spec.number} <span>{spec.scope}</span>
        </p>
        <h1>{spec.title}</h1>
        <p>{spec.lead}</p>
      </section>
      <div className="code-line">
        <code>{spec.code}</code>
      </div>
      <Lab kind={kind} initial={observation} />
      <aside className="reading-guide">
        <strong>観測のポイント</strong>
        <p>{spec.expected}</p>
        <p className="muted">{spec.note}</p>
      </aside>
      <script
        id="observation"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(observation).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
