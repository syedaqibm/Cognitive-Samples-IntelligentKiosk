export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "48px auto", padding: 24, lineHeight: 1.5 }}>
      <h1>Neighborhood Marketplace API</h1>
      <p>
        This is the backend for the mobile app. Endpoints live under <code>/api</code>.
      </p>
      <p>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
