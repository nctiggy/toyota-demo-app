const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST || '10.30.0.27';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'toyota';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';
const CONNECTION_METHOD = process.env.CONNECTION_METHOD || 'direct';

const pool = new Pool({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// --- API Endpoints ---

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/status', async (_req, res) => {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT version()');
    const responseTimeMs = Date.now() - start;
    res.json({
      connected: true,
      host: DB_HOST,
      responseTimeMs,
      version: result.rows[0].version.match(/PostgreSQL [\d.]+/)?.[0] || result.rows[0].version,
      connectionMethod: CONNECTION_METHOD === 'overlay'
        ? 'Kubernetes Service DNS (Overlay Network)'
        : 'Direct IP (VLAN 30)',
      appVersion: APP_VERSION,
    });
  } catch (err) {
    res.json({
      connected: false,
      host: DB_HOST,
      responseTimeMs: Date.now() - start,
      error: err.message,
      connectionMethod: CONNECTION_METHOD === 'overlay'
        ? 'Kubernetes Service DNS (Overlay Network)'
        : 'Direct IP (VLAN 30)',
      appVersion: APP_VERSION,
    });
  }
});

app.get('/api/vehicles', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (_req, res) => {
  const isOverlay = CONNECTION_METHOD === 'overlay';
  const versionLabel = isOverlay ? 'v2.0.0' : 'v1.0.0';
  const subtitle = isOverlay
    ? 'Post-Migration \u2014 Database on VMO'
    : 'Pre-Migration \u2014 Database on VMware';
  const bannerAccent = isOverlay ? '#EB0A1E' : '#58595B';
  const connectionLabel = isOverlay
    ? 'Kubernetes Service DNS \u2014 Overlay Network'
    : 'Direct IP \u2014 VLAN 30';
  const connectionIcon = isOverlay
    ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
    : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="7" cy="6" r="1" fill="currentColor"/><circle cx="7" cy="18" r="1" fill="currentColor"/></svg>';
  const networkTypeLabel = isOverlay ? 'K8s Overlay' : 'VLAN 30';

  const migrationCards = isOverlay ? `
    <div class="card migration-card">
      <div class="migration-header">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <h3>Migration Complete</h3>
      </div>
      <p>Database successfully migrated from VMware to VMO/KubeVirt</p>
    </div>
    <div class="card stats-card">
      <h3>Migration Stats</h3>
      <div class="stats-grid">
        <div class="stat"><span class="stat-label">Type</span><span class="stat-value">Warm</span></div>
        <div class="stat"><span class="stat-label">Downtime</span><span class="stat-value">Zero</span></div>
        <div class="stat"><span class="stat-label">Source</span><span class="stat-value">VMware</span></div>
        <div class="stat"><span class="stat-label">Destination</span><span class="stat-value">VMO / KubeVirt</span></div>
      </div>
    </div>` : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Toyota Fleet Database Portal</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Montserrat', sans-serif; background: #F7F7F7; color: #000; }

    /* Header */
    .header {
      background: #FFF;
      border-bottom: 1px solid #E5E5E5;
      padding: 16px 40px;
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .header-logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 6px;
      color: #000;
    }
    .header-title {
      font-size: 16px;
      font-weight: 500;
      color: #58595B;
      flex: 1;
    }
    .version-badge {
      background: ${bannerAccent};
      color: #FFF;
      padding: 4px 14px;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 600;
    }

    /* Hero */
    .hero {
      background: ${bannerAccent};
      padding: 14px 40px;
      color: #FFF;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Main */
    .main { max-width: 1200px; margin: 0 auto; padding: 32px 40px; }
    .card {
      background: #FFF;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      border: 1px solid #E5E5E5;
    }
    .card h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: #000;
    }

    /* Connection Status */
    .connection-status {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-dot.connected { background: #16a34a; }
    .status-dot.disconnected { background: #dc2626; }
    .connection-label {
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .connection-details {
      display: flex;
      gap: 24px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .detail { font-size: 13px; color: #58595B; }
    .detail strong { color: #000; }

    /* Vehicle Table */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
      text-align: left;
      padding: 12px 16px;
      background: #F7F7F7;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #58595B;
      border-bottom: 2px solid #E5E5E5;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #F0F0F0;
    }
    tr:hover td { background: #FAFAFA; }
    .status-active {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    /* Flow Visualization */
    .flow {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .flow-node {
      background: #F7F7F7;
      border: 1px solid #E5E5E5;
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .flow-arrow {
      color: #58595B;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .flow-arrow .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Migration Cards */
    .migration-card {
      border-left: 4px solid #16a34a;
    }
    .migration-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }
    .migration-header h3 { margin-bottom: 0; color: #16a34a; }
    .migration-card p { font-size: 14px; color: #58595B; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
    }
    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .stat-label { font-size: 12px; color: #58595B; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 16px; font-weight: 600; }

    /* Error */
    .error-msg { color: #dc2626; font-size: 14px; margin-top: 8px; }

    /* Footer */
    .footer {
      background: #000;
      color: #FFF;
      padding: 24px 40px;
      font-size: 13px;
      margin-top: 48px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header { padding: 12px 20px; flex-wrap: wrap; }
      .hero { padding: 12px 20px; }
      .main { padding: 20px; }
      .connection-details { flex-direction: column; gap: 8px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">TOYOTA</div>
    <div class="header-title">Fleet Database Portal</div>
    <div class="version-badge">${versionLabel}</div>
  </div>

  <div class="hero">
    ${connectionIcon}
    <span>${subtitle}</span>
  </div>

  <div class="main">
    <div class="card" id="status-card">
      <h3>Connection Status</h3>
      <div class="connection-status">
        <div class="status-dot" id="status-dot"></div>
        <div class="connection-label" id="connection-label">
          ${connectionIcon}
          <span>Checking connection...</span>
        </div>
      </div>
      <div class="connection-details" id="connection-details"></div>
      <div class="error-msg" id="error-msg" style="display:none"></div>
    </div>

    ${migrationCards}

    <div class="card">
      <h3>Connection Flow</h3>
      <div class="flow">
        <div class="flow-node">App</div>
        <div class="flow-arrow">
          <span>\u2192</span>
          <span class="label">${networkTypeLabel}</span>
        </div>
        <div class="flow-node">Database</div>
      </div>
    </div>

    <div class="card">
      <h3>Vehicle Fleet</h3>
      <div class="table-wrap">
        <table id="vehicles-table">
          <thead>
            <tr>
              <th>VIN</th>
              <th>Model</th>
              <th>Year</th>
              <th>Status</th>
              <th>Mileage</th>
              <th>Last Service</th>
            </tr>
          </thead>
          <tbody id="vehicles-body">
            <tr><td colspan="6" style="text-align:center;color:#58595B">Loading vehicles...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="footer">
    \u00a9 ${new Date().getFullYear()} Toyota Motor Corporation. Fleet Database Portal \u2014 VMO Demo.
  </div>

  <script>
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const dot = document.getElementById('status-dot');
        const label = document.getElementById('connection-label');
        const details = document.getElementById('connection-details');
        const errorMsg = document.getElementById('error-msg');

        if (data.connected) {
          dot.className = 'status-dot connected';
          label.innerHTML = '${connectionIcon}<span>Connected via: ' + data.host + ' (${isOverlay ? 'Overlay Network' : 'VLAN 30'})</span>';
          details.innerHTML =
            '<div class="detail"><strong>Host:</strong> ' + data.host + '</div>' +
            '<div class="detail"><strong>Latency:</strong> ' + data.responseTimeMs + 'ms</div>' +
            '<div class="detail"><strong>PostgreSQL:</strong> ' + data.version + '</div>';
          errorMsg.style.display = 'none';
        } else {
          dot.className = 'status-dot disconnected';
          label.innerHTML = '<span>Disconnected</span>';
          errorMsg.textContent = data.error || 'Unable to connect to database';
          errorMsg.style.display = 'block';
        }
      } catch (e) {
        document.getElementById('status-dot').className = 'status-dot disconnected';
        document.getElementById('error-msg').textContent = 'Failed to fetch status';
        document.getElementById('error-msg').style.display = 'block';
      }
    }

    async function loadVehicles() {
      try {
        const res = await fetch('/api/vehicles');
        const vehicles = await res.json();
        const tbody = document.getElementById('vehicles-body');
        if (vehicles.error) {
          tbody.innerHTML = '<tr><td colspan="6" style="color:#dc2626">' + vehicles.error + '</td></tr>';
          return;
        }
        tbody.innerHTML = vehicles.map(function(v) {
          return '<tr>' +
            '<td style="font-family:monospace;font-size:13px">' + v.vin + '</td>' +
            '<td><strong>' + v.model + '</strong></td>' +
            '<td>' + v.year + '</td>' +
            '<td><span class="status-active">' + v.status + '</span></td>' +
            '<td>' + Number(v.mileage).toLocaleString() + '</td>' +
            '<td>' + new Date(v.last_service).toLocaleDateString() + '</td>' +
          '</tr>';
        }).join('');
      } catch (e) {
        document.getElementById('vehicles-body').innerHTML =
          '<tr><td colspan="6" style="color:#dc2626">Failed to load vehicles</td></tr>';
      }
    }

    loadStatus();
    loadVehicles();
  </script>
</body>
</html>`;

  res.send(html);
});

app.listen(PORT, () => {
  console.log('Toyota Fleet Database Portal running on port ' + PORT);
  console.log('App Version: ' + APP_VERSION);
  console.log('Connection Method: ' + CONNECTION_METHOD);
  console.log('Database Host: ' + DB_HOST);
});
