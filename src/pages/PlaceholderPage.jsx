/**
 * Placeholder for pages to be converted by the developer.
 * Each route shown here has a corresponding `r<Name>()` function in V8.html.
 *
 * To implement:
 *  1. Open V8.html, find the function listed below (e.g. rAllClients)
 *  2. Read its logic — what data it fetches and how it renders
 *  3. Create a new file in src/pages/<area>/ following LeadsPage.jsx pattern
 *  4. Replace this placeholder route in App.jsx with the new component
 */
export default function PlaceholderPage({ title, fnRef }) {
  return (
    <div className="card">
      <h3 style={{ fontSize: 16, marginBottom: 10 }}>{title}</h3>
      <p style={{ color: 'var(--mu)', marginBottom: 16 }}>
        This page is pending conversion from the original prototype.
      </p>
      <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12 }}>
        <strong>For the developer:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20, color: 'var(--mu)' }}>
          <li>Reference function in V8.html: <code>{fnRef}()</code></li>
          <li>Follow the pattern from <code>LeadsPage.jsx</code> or <code>MeetingsPage.jsx</code></li>
          <li>API client wrappers are ready in <code>src/api/index.js</code></li>
          <li>Backend endpoints are documented in <code>API_CONTRACT.md</code></li>
        </ul>
      </div>
    </div>
  );
}
