import { Boxes, GitBranch, LayoutDashboard, Server, Smartphone, Sparkles } from 'lucide-react';
import type { ComponentType } from 'react';

/// I settings salvano l'icona come stringa: storicamente un glifo unicode.
/// Qui i glifi noti diventano icone SVG, e ogni chiave testuale resta usabile per
/// il futuro. Se il valore non è in tabella si mostra la stringa così com'è,
/// così un contenuto scritto dal backoffice non può rompere la pagina.
const ICONS: Record<string, ComponentType<{ 'aria-hidden'?: boolean }>> = {
  '⌘': LayoutDashboard,
  '⚙': Server,
  '◫': Smartphone,
  '✦': Sparkles,
  '⬡': Boxes,
  '↗': GitBranch,
  web: LayoutDashboard,
  backend: Server,
  mobile: Smartphone,
  ai: Sparkles,
  devops: Boxes,
  opensource: GitBranch,
};

export function ServiceIcon({ icon }: { icon: string }) {
  const Icon = ICONS[icon.trim().toLowerCase()] ?? ICONS[icon.trim()];

  return (
    <div className="service-icon" aria-hidden="true">
      {Icon ? <Icon aria-hidden /> : icon}
    </div>
  );
}
