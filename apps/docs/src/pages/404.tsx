import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function NotFound(): JSX.Element {
  return (
    <Layout title="Page Not Found">
      <main
        className="container"
        style={{ padding: '4rem 0', textAlign: 'center' }}
      >
        <h1 style={{ fontSize: '4rem', fontWeight: 300, color: '#999', marginBottom: '1rem' }}>
          404
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          This page doesn't exist.
        </p>
        <Link
          className="button button--primary button--lg"
          to="/"
        >
          Back to Home
        </Link>
      </main>
    </Layout>
  );
}
