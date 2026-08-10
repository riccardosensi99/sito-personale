import { Mail, MapPin } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';
import type { ContactSettings, HeroSettings } from '../../lib/types';

type Props = { contact: ContactSettings; highlights: HeroSettings['highlights'] };

/// Social, punti forti e provenienza chiudono il sito. Stavano sotto la hero, dove
/// ripetevano cose già dette due schermate più in alto e allontanavano il terminale.
export function Footer({ contact, highlights }: Props) {
  const socials = [
    { icon: GithubIcon, href: contact.github, label: 'GitHub' },
    { icon: LinkedinIcon, href: contact.linkedin, label: 'LinkedIn' },
    { icon: Mail, href: `mailto:${contact.email}`, label: 'Email' },
  ];

  return (
    <footer>
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/logo-mark.webp" width={256} height={256} alt="" />
          <div>
            <strong>Riccardo Sensi</strong>
            <span className="footer-location">
              <MapPin aria-hidden="true" />
              Italia · Remote
            </span>
          </div>
        </div>

        <div className="footer-highlights">
          {highlights.map((h) => (
            <div key={h.title}>
              <strong>{h.title}</strong>
              <span>{h.text}</span>
            </div>
          ))}
        </div>

        <div className="footer-socials">
          {socials.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              className="icon-link"
              href={href}
              target={href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noreferrer"
              aria-label={label}
            >
              <Icon aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>

      <div className="container footer-base">
        <span>© {new Date().getFullYear()} Riccardo Sensi</span>
        <span>Built with React, Node and curiosity</span>
      </div>
    </footer>
  );
}
