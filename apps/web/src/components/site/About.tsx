import type { RadarItem, TimelineItem } from '../../lib/types';

type Props = { timeline: TimelineItem[]; techRadar: RadarItem[] };

export function About({ timeline, techRadar }: Props) {
  return (
    <section id="about">
      <div className="container split-grid">
        <div className="panel reveal">
          <div className="section-kicker">Experience</div>
          <h3>Un profilo tecnico completo.</h3>
          <div className="timeline">
            {timeline.map((item) => (
              <div className="timeline-item" key={`${item.year}-${item.title}`}>
                <div className="timeline-year">{item.year}</div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel reveal">
          <div className="section-kicker">Tech radar</div>
          <h3>Stack principale</h3>
          <div className="stack-list">
            {techRadar.map((row) => (
              <div className="stack-row" key={row.label}>
                <div className="stack-label">
                  <span>{row.label}</span>
                  <span>{row.tag}</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${Math.min(100, Math.max(0, row.level))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
