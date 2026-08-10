import { useEffect } from 'react';
import { Nav } from '../components/site/Nav';
import { Hero } from '../components/site/Hero';
import { Projects } from '../components/site/Projects';
import { Services } from '../components/site/Services';
import { About } from '../components/site/About';
import { GithubCard } from '../components/site/GithubCard';
import { Beyond } from '../components/site/Beyond';
import { Contact } from '../components/site/Contact';
import { Footer } from '../components/site/Footer';
import { useSiteData } from '../hooks/useSiteData';
import { useReveal } from '../hooks/useReveal';

export default function Home() {
  const { projects, settings, stats, loading, error } = useSiteData();

  // I .reveal delle card esistono solo dopo il fetch: riosservo quando la lista cambia.
  useReveal([loading, projects.length]);

  // Un link tipo /#projects arriva prima che le sezioni esistano: appena i dati
  // sono a posto, porto la pagina sull'ancora richiesta.
  useEffect(() => {
    if (loading) return;
    const id = window.location.hash.slice(1);
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ behavior: 'auto', block: 'start' });
  }, [loading]);

  return (
    <>
      <Nav />
      <main id="top">
        <Hero hero={settings.hero} terminal={settings.terminal} githubUrl={settings.contact.github} />
        <Projects projects={projects} loading={loading} error={error} />
        <Services services={settings.services} />
        <About timeline={settings.timeline} techRadar={settings.techRadar} />
        <GithubCard stats={stats} githubUrl={settings.contact.github} />
        <Beyond items={settings.beyond} />
        <Contact contact={settings.contact} />
      </main>
      <Footer />
    </>
  );
}
