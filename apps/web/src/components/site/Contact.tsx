import { Mail } from 'lucide-react';
import { LinkedinIcon } from './BrandIcons';
import type { ContactSettings } from '../../lib/types';

export function Contact({ contact }: { contact: ContactSettings }) {
  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="contact-card reveal">
          <div className="section-kicker">{contact.kicker}</div>
          <h2>
            {contact.titleLead}
            <br />
            <span className="gradient-text">{contact.titleAccent}</span>
          </h2>
          <p>{contact.copy}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={`mailto:${contact.email}`}>
              <Mail aria-hidden="true" />
              Scrivimi una mail
            </a>
            <a className="btn btn-secondary" href={contact.linkedin} target="_blank" rel="noreferrer">
              <LinkedinIcon aria-hidden="true" />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
