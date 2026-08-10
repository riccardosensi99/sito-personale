import type { ServiceItem } from '../../lib/types';

export function Services({ services }: { services: ServiceItem[] }) {
  return (
    <section id="services">
      <div className="container">
        <div className="section-heading reveal">
          <div>
            <div className="section-kicker">What I build</div>
            <h2>Dall'idea al deploy.</h2>
          </div>
          <p>
            Posso seguire l'intero ciclo di sviluppo oppure intervenire su un singolo livello del
            prodotto.
          </p>
        </div>
        <div className="services-grid">
          {services.map((s) => (
            <div className="service-card reveal" key={s.title}>
              <div className="service-icon" aria-hidden="true">
                {s.icon}
              </div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
