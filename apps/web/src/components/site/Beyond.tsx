import type { BeyondItem } from '../../lib/types';

export function Beyond({ items }: { items: BeyondItem[] }) {
  return (
    <section>
      <div className="container">
        <div className="section-heading reveal">
          <div>
            <div className="section-kicker">Beyond code</div>
            <h2>
              La persona dietro
              <br />
              al terminale.
            </h2>
          </div>
        </div>
        <div className="beyond-grid">
          {items.map((item) => (
            <div className="beyond-card reveal" key={item.title}>
              <span className="beyond-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
