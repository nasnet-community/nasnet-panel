import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

interface DocItem {
  name: string;
  description: string;
  link: string;
  color: string;
}

interface Section {
  title: string;
  description: string;
  items: DocItem[];
}

const sections: Section[] = [
  {
    title: 'Apps',
    description: 'Application packages that ship the product.',
    items: [
      {
        name: 'Frontend (Connect)',
        description: 'React frontend with TanStack Router, Apollo Client, and adaptive UI.',
        link: '/docs/frontend/intro',
        color: '#2563EB',
      },
      {
        name: 'Backend (Go)',
        description: 'Go backend with GraphQL, hexagonal architecture, and router management.',
        link: '/docs/backend/intro',
        color: '#7C3AED',
      },
      {
        name: 'E2E Testing',
        description: 'Playwright end-to-end tests for the full application stack.',
        link: '/docs/testing/intro',
        color: '#16A34A',
      },
    ],
  },
  {
    title: 'Libraries',
    description: 'Shared packages powering the NasNet ecosystem.',
    items: [
      {
        name: 'UI Components',
        description: 'Three-layer component system: Primitives, Patterns, and Domain.',
        link: '/docs/ui/intro',
        color: '#F97316',
      },
      {
        name: 'Feature Modules',
        description: 'Domain feature libraries: alerts, dashboard, firewall, network, and more.',
        link: '/docs/features/intro',
        color: '#4F46E5',
      },
      {
        name: 'API Client',
        description: 'Apollo Client setup, generated hooks, and GraphQL query modules.',
        link: '/docs/api-client/intro',
        color: '#4972BA',
      },
      {
        name: 'State Management',
        description: 'Zustand stores and XState machines for UI and workflow state.',
        link: '/docs/state/intro',
        color: '#EC4899',
      },
      {
        name: 'Core Types',
        description: 'Shared TypeScript interfaces, utilities, and constants.',
        link: '/docs/core/intro',
        color: '#6B7280',
      },
    ],
  },
];

function HomepageHero() {
  return (
    <section className="hero-section">
      <div className="hero-bg" />
      <div className="hero-content">
        <img
          src="/img/hero-logo.jpg"
          alt="NasNet"
          className="hero-logo"
        />
        <h1 className="hero-title">NasNet Documentation</h1>
        <p className="hero-subtitle">
          Architecture guides, API references, and developer docs for the
          NasNet router management platform.
        </p>
        <div className="hero-ctas">
          <Link className="button button--primary button--lg" to="/docs/frontend/intro">
            Get Started →
          </Link>
          <Link className="button button--outline button--lg" to="/docs/backend/intro">
            Backend Docs
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="section-header">
      <h2 className="section-title">{title}</h2>
      <p className="section-desc">{description}</p>
      <div className="section-divider" />
    </div>
  );
}

function DocCard({ name, description, link, color }: DocItem) {
  return (
    <Link className="doc-card" to={link}>
      <div className="card-accent-bar" style={{ background: color }} />
      <h3 className="card-title">{name}</h3>
      <p className="card-desc">{description}</p>
      <span className="card-cta">
        Explore <span className="arrow">→</span>
      </span>
    </Link>
  );
}

function DocSection({ title, description, items }: Section) {
  return (
    <section className="doc-section-container">
      <SectionHeader title={title} description={description} />
      <div className="cards-grid">
        {items.map((item) => (
          <DocCard key={item.name} {...item} />
        ))}
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHero />
      <main className="landing-main">
        <div>
          {sections.map((section) => (
            <DocSection key={section.title} {...section} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
