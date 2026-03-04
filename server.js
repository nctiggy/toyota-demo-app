const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

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

pool.on('error', (err) => {
  console.error('Pool idle client error:', err.message);
});

// --- Car silhouette SVGs by vehicle type ---
const CAR_SVGS = {
  sedan: '<svg viewBox="0 0 80 32" width="56" height="22"><path d="M8 24h4a4 4 0 0 0 8 0h24a4 4 0 0 0 8 0h12c2 0 4-1.5 4-3v-5c0-1-0.5-2-1.5-2.5L60 10l-8-6c-1-.8-2.5-1.2-4-1.2H30c-2 0-4 .8-5.5 2L16 12l-12 3c-2 .5-3 2-3 4v2c0 1.7 1.3 3 3 3h4z" fill="#58595B"/><circle cx="16" cy="24" r="3.5" fill="#333"/><circle cx="16" cy="24" r="1.5" fill="#777"/><circle cx="52" cy="24" r="3.5" fill="#333"/><circle cx="52" cy="24" r="1.5" fill="#777"/><path d="M26 6h16l6 5H22z" fill="#a8d8ea" opacity="0.6"/></svg>',
  suv: '<svg viewBox="0 0 80 36" width="56" height="25"><path d="M8 28h4a5 5 0 0 0 10 0h22a5 5 0 0 0 10 0h10c2 0 4-1.5 4-3.5v-8c0-1.5-.5-2.5-2-3.5L58 8l-6-5c-1.5-1.2-3-1.8-5-1.8H28c-2.5 0-4.5 1-6 2.5L14 12 4 15c-2.5.7-3.5 2.5-3.5 4.5v5c0 2 1.5 3.5 3.5 3.5h4z" fill="#58595B"/><circle cx="17" cy="28" r="4" fill="#333"/><circle cx="17" cy="28" r="1.8" fill="#777"/><circle cx="54" cy="28" r="4" fill="#333"/><circle cx="54" cy="28" r="1.8" fill="#777"/><path d="M24 4h20l5 6H20z" fill="#a8d8ea" opacity="0.6"/><path d="M46 4h6l8 6H51z" fill="#a8d8ea" opacity="0.5"/></svg>',
  truck: '<svg viewBox="0 0 88 36" width="62" height="25"><path d="M8 28h4a5 5 0 0 0 10 0h30a5 5 0 0 0 10 0h10c2 0 4-1.5 4-3.5v-6H50V6c0-2-1.5-3.5-3.5-3.5H28c-2.5 0-4.5 1-6 2.5L14 12 4 15c-2.5.7-3.5 2.5-3.5 4.5v5c0 2 1.5 3.5 3.5 3.5h4z" fill="#58595B"/><rect x="50" y="10" width="26" height="8.5" rx="1" fill="#6b7280"/><circle cx="17" cy="28" r="4" fill="#333"/><circle cx="17" cy="28" r="1.8" fill="#777"/><circle cx="62" cy="28" r="4" fill="#333"/><circle cx="62" cy="28" r="1.8" fill="#777"/><path d="M24 4h18l4 6H20z" fill="#a8d8ea" opacity="0.6"/></svg>',
  sports: '<svg viewBox="0 0 80 28" width="56" height="20"><path d="M10 22h4a3.5 3.5 0 0 0 7 0h26a3.5 3.5 0 0 0 7 0h12c2 0 3.5-1 3.5-2.5v-4c0-1.5-1-3-2.5-3.5L62 9l-10-5.5c-1.5-.9-3-1.3-5-1.3H32c-2.5 0-4 .6-5.5 1.8L18 10l-14 3c-2 .5-3 2-3 3.5v3c0 1.5 1 2.5 2.5 2.5H10z" fill="#EB0A1E"/><circle cx="17.5" cy="22" r="3" fill="#333"/><circle cx="17.5" cy="22" r="1.3" fill="#777"/><circle cx="54" cy="22" r="3" fill="#333"/><circle cx="54" cy="22" r="1.3" fill="#777"/><path d="M28 4h18l8 5H24z" fill="#a8d8ea" opacity="0.5"/></svg>',
  hatchback: '<svg viewBox="0 0 76 32" width="54" height="22"><path d="M8 24h4a4 4 0 0 0 8 0h22a4 4 0 0 0 8 0h12c2 0 3.5-1.3 3.5-3v-5c0-1-.5-2-1.5-2.5L58 10l-6-5c-1.5-1-3-1.5-5-1.5H30c-2 0-3.5.7-5 2L17 12l-13 3c-2 .5-3 2-3 3.5v2.5c0 1.7 1.3 3 3 3h4z" fill="#16a34a"/><circle cx="16" cy="24" r="3.5" fill="#333"/><circle cx="16" cy="24" r="1.5" fill="#777"/><circle cx="50" cy="24" r="3.5" fill="#333"/><circle cx="50" cy="24" r="1.5" fill="#777"/><path d="M26 5h16l5 5H22z" fill="#a8d8ea" opacity="0.6"/><path d="M44 5h6l8 5H48z" fill="#a8d8ea" opacity="0.5"/></svg>',
};

// Map Toyota models to vehicle types
const MODEL_TYPE_MAP = {
  'Camry': 'sedan',
  'Corolla': 'sedan',
  'Crown': 'sedan',
  'Avalon': 'sedan',
  'RAV4': 'suv',
  'Highlander': 'suv',
  'Grand Highlander': 'suv',
  '4Runner': 'suv',
  'Sequoia': 'suv',
  'Venza': 'suv',
  'bZ4X': 'suv',
  'Land Cruiser': 'suv',
  'Tacoma': 'truck',
  'Tundra': 'truck',
  'Prius': 'hatchback',
  'Corolla Cross': 'hatchback',
  'GR Corolla': 'hatchback',
  'Supra': 'sports',
  'GR86': 'sports',
  'GR Supra': 'sports',
};

function getCarSvg(model) {
  const type = MODEL_TYPE_MAP[model] || 'sedan';
  return CAR_SVGS[type] || CAR_SVGS.sedan;
}

// --- v2 fleet expansion: seed extra vehicles on startup ---
async function seedV2Vehicles() {
  if (CONNECTION_METHOD !== 'overlay') return;
  try {
    const check = await pool.query("SELECT count(*) FROM vehicles WHERE model = 'bZ4X'");
    if (parseInt(check.rows[0].count) > 0) return; // already seeded
    await pool.query(`
      INSERT INTO vehicles (vin, model, year, status, mileage) VALUES
        ('JTMAB3FV5PD100001', 'bZ4X', 2025, 'active', 1200),
        ('JTHDP5BC3P5200002', 'Crown', 2025, 'active', 3400),
        ('5TDGZRBH0PS300003', 'Grand Highlander', 2025, 'active', 5600),
        ('3TMCZ5AN8PS400004', 'Tacoma', 2025, 'active', 2100)
    `);
    console.log('v2 fleet expansion: 4 new vehicles seeded');
  } catch (err) {
    console.log('v2 seed skipped:', err.message);
  }
}

// --- API Endpoints ---

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/api/status', async (_req, res) => {
  const start = Date.now();
  try {
    const result = await pool.query('SELECT version()');
    const countResult = await pool.query('SELECT count(*) FROM vehicles');
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
      vehicleCount: parseInt(countResult.rows[0].count),
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

app.post('/api/vehicles', async (req, res) => {
  const { vin, model, year, status, mileage } = req.body;
  if (!vin || !model || !year) {
    return res.status(400).json({ error: 'vin, model, and year are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO vehicles (vin, model, year, status, mileage) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [vin, model, parseInt(year), status || 'active', parseInt(mileage) || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Toyota models list for the add modal dropdown ---
const TOYOTA_MODELS = [
  'Camry', 'Corolla', 'Crown', 'RAV4', 'Highlander', 'Grand Highlander',
  '4Runner', 'Tundra', 'Tacoma', 'Prius', 'Supra', 'GR86',
  'bZ4X', 'Venza', 'Sequoia', 'Land Cruiser', 'Corolla Cross', 'GR Corolla'
];

app.get('/', (_req, res) => {
  const isOverlay = CONNECTION_METHOD === 'overlay';
  const versionLabel = 'v' + APP_VERSION;
  const subtitle = isOverlay
    ? 'Post-Migration \u2014 Database on VMO'
    : 'Pre-Migration \u2014 Database on VMware';
  const bannerAccent = isOverlay ? '#EB0A1E' : '#58595B';
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
      <p>Database successfully migrated from VMware to VMO/KubeVirt. Fleet expanded with 4 new vehicles.</p>
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

  // Build model options for the dropdown
  const modelOptions = TOYOTA_MODELS.map(m => `<option value="${m}">${m}</option>`).join('');

  // Car SVGs as a JS object for client-side rendering
  const carSvgsJson = JSON.stringify(CAR_SVGS);
  const modelTypeMapJson = JSON.stringify(MODEL_TYPE_MAP);

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
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-header h3 { margin-bottom: 0; }
    .fleet-count {
      font-size: 13px;
      color: #58595B;
      font-weight: 500;
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
      padding: 10px 16px;
      border-bottom: 1px solid #F0F0F0;
      vertical-align: middle;
    }
    tr:hover td { background: #FAFAFA; }
    .model-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .car-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }
    .status-active {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .status-maintenance {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
    .new-badge {
      display: inline-block;
      background: #EB0A1E;
      color: #FFF;
      padding: 1px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 8px;
      letter-spacing: 0.5px;
    }
    .delete-btn {
      background: none;
      border: none;
      color: #dc2626;
      cursor: pointer;
      font-size: 16px;
      padding: 4px 8px;
      border-radius: 4px;
      opacity: 0.4;
      transition: opacity 0.15s;
    }
    .delete-btn:hover { opacity: 1; }

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
    .migration-card { border-left: 4px solid #16a34a; }
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
    .stat { display: flex; flex-direction: column; gap: 4px; }
    .stat-label { font-size: 12px; color: #58595B; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 16px; font-weight: 600; }

    /* Add Vehicle Button */
    .btn-add {
      background: ${bannerAccent};
      color: #FFF;
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.15s;
    }
    .btn-add:hover { opacity: 0.85; }

    /* Modal */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 1000;
      justify-content: center;
      align-items: center;
    }
    .modal-overlay.active { display: flex; }
    .modal {
      background: #FFF;
      border-radius: 12px;
      padding: 32px;
      width: 480px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal h2 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 24px;
      color: #000;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #58595B;
      margin-bottom: 6px;
    }
    .form-group input, .form-group select {
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #E5E5E5;
      border-radius: 6px;
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      color: #000;
      background: #FFF;
      transition: border-color 0.15s;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: ${bannerAccent};
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }
    .btn-cancel {
      background: #F7F7F7;
      color: #58595B;
      border: 1px solid #E5E5E5;
      padding: 10px 24px;
      border-radius: 6px;
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-submit {
      background: ${bannerAccent};
      color: #FFF;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-submit:hover { opacity: 0.85; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .form-error {
      color: #dc2626;
      font-size: 13px;
      margin-top: 8px;
      display: none;
    }
    .car-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #F7F7F7;
      border-radius: 8px;
      margin-bottom: 16px;
      min-height: 60px;
    }

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

    /* Toast notification */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #16a34a;
      color: #FFF;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 2000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s ease;
    }
    .toast.show { transform: translateY(0); opacity: 1; }

    /* Responsive */
    @media (max-width: 768px) {
      .header { padding: 12px 20px; flex-wrap: wrap; }
      .hero { padding: 12px 20px; }
      .main { padding: 20px; }
      .connection-details { flex-direction: column; gap: 8px; }
      .form-row { grid-template-columns: 1fr; }
      .modal { padding: 24px; }
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
      <div class="card-header">
        <h3>Vehicle Fleet <span class="fleet-count" id="fleet-count"></span></h3>
        <button class="btn-add" onclick="openModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add to Fleet
        </button>
      </div>
      <div class="table-wrap">
        <table id="vehicles-table">
          <thead>
            <tr>
              <th style="width:60px"></th>
              <th>Model</th>
              <th>VIN</th>
              <th>Year</th>
              <th>Status</th>
              <th>Mileage</th>
              <th>Last Service</th>
              <th style="width:40px"></th>
            </tr>
          </thead>
          <tbody id="vehicles-body">
            <tr><td colspan="8" style="text-align:center;color:#58595B">Loading vehicles...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <div class="footer">
    \u00a9 ${new Date().getFullYear()} Toyota Motor Corporation. Fleet Database Portal \u2014 VMO Demo.
  </div>

  <!-- Add Vehicle Modal -->
  <div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)closeModal()">
    <div class="modal">
      <h2>Add Vehicle to Fleet</h2>
      <div class="car-preview" id="car-preview"></div>
      <form id="add-form" onsubmit="return submitVehicle(event)">
        <div class="form-group">
          <label>Model</label>
          <select id="f-model" required onchange="updatePreview()">
            <option value="">Select a model...</option>
            ${modelOptions}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Year</label>
            <input type="number" id="f-year" value="2025" min="2020" max="2026" required>
          </div>
          <div class="form-group">
            <label>Mileage</label>
            <input type="number" id="f-mileage" value="0" min="0" required>
          </div>
        </div>
        <div class="form-group">
          <label>VIN</label>
          <input type="text" id="f-vin" maxlength="17" placeholder="Auto-generated if blank">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="f-status">
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
        <div class="form-error" id="form-error"></div>
        <div class="modal-actions">
          <button type="button" class="btn-cancel" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn-submit" id="btn-submit">Add Vehicle</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast -->
  <div class="toast" id="toast"></div>

  <script>
    var CAR_SVGS = ${carSvgsJson};
    var MODEL_TYPE_MAP = ${modelTypeMapJson};
    var originalCount = 0;

    function getCarSvg(model, scale) {
      var type = MODEL_TYPE_MAP[model] || 'sedan';
      var svg = CAR_SVGS[type] || CAR_SVGS.sedan;
      if (scale) {
        svg = svg.replace(/width="\\d+"/, 'width="' + scale + '"').replace(/height="\\d+"/, 'height="' + Math.round(scale * 0.4) + '"');
      }
      return svg;
    }

    function showToast(msg) {
      var t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show';
      setTimeout(function() { t.className = 'toast'; }, 3000);
    }

    function openModal() {
      document.getElementById('modal-overlay').className = 'modal-overlay active';
      document.getElementById('f-model').value = '';
      document.getElementById('f-year').value = '2025';
      document.getElementById('f-mileage').value = '0';
      document.getElementById('f-vin').value = '';
      document.getElementById('f-status').value = 'active';
      document.getElementById('form-error').style.display = 'none';
      updatePreview();
    }

    function closeModal() {
      document.getElementById('modal-overlay').className = 'modal-overlay';
    }

    function updatePreview() {
      var model = document.getElementById('f-model').value;
      var preview = document.getElementById('car-preview');
      if (model) {
        preview.innerHTML = getCarSvg(model, 120) + '<span style="margin-left:16px;font-weight:600;font-size:16px">Toyota ' + model + '</span>';
      } else {
        preview.innerHTML = '<span style="color:#58595B;font-size:14px">Select a model to preview</span>';
      }
    }

    function generateVin() {
      var chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
      var vin = '';
      for (var i = 0; i < 17; i++) vin += chars[Math.floor(Math.random() * chars.length)];
      return vin;
    }

    async function submitVehicle(e) {
      e.preventDefault();
      var btn = document.getElementById('btn-submit');
      var errEl = document.getElementById('form-error');
      btn.disabled = true;
      btn.textContent = 'Adding...';
      errEl.style.display = 'none';

      var body = {
        model: document.getElementById('f-model').value,
        year: parseInt(document.getElementById('f-year').value),
        mileage: parseInt(document.getElementById('f-mileage').value),
        vin: document.getElementById('f-vin').value || generateVin(),
        status: document.getElementById('f-status').value
      };

      try {
        var res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        var data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');
        closeModal();
        showToast('Added ' + body.model + ' to fleet');
        loadVehicles();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Add Vehicle';
      }
    }

    async function deleteVehicle(id, model) {
      if (!confirm('Remove ' + model + ' from fleet?')) return;
      try {
        await fetch('/api/vehicles/' + id, { method: 'DELETE' });
        showToast('Removed ' + model + ' from fleet');
        loadVehicles();
      } catch (e) {}
    }

    async function loadStatus() {
      try {
        var res = await fetch('/api/status');
        var data = await res.json();
        var dot = document.getElementById('status-dot');
        var label = document.getElementById('connection-label');
        var details = document.getElementById('connection-details');
        var errorMsg = document.getElementById('error-msg');

        if (data.connected) {
          dot.className = 'status-dot connected';
          label.innerHTML = '${connectionIcon}<span>Connected via: ' + data.host + ' (${isOverlay ? 'Overlay Network' : 'VLAN 30'})</span>';
          details.innerHTML =
            '<div class="detail"><strong>Host:</strong> ' + data.host + '</div>' +
            '<div class="detail"><strong>Latency:</strong> ' + data.responseTimeMs + 'ms</div>' +
            '<div class="detail"><strong>PostgreSQL:</strong> ' + data.version + '</div>' +
            '<div class="detail"><strong>Fleet Size:</strong> ' + data.vehicleCount + ' vehicles</div>';
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
        var res = await fetch('/api/vehicles');
        var vehicles = await res.json();
        var tbody = document.getElementById('vehicles-body');
        var countEl = document.getElementById('fleet-count');
        if (vehicles.error) {
          tbody.innerHTML = '<tr><td colspan="8" style="color:#dc2626">' + vehicles.error + '</td></tr>';
          return;
        }
        countEl.textContent = '(' + vehicles.length + ' vehicles)';
        tbody.innerHTML = vehicles.map(function(v) {
          var statusClass = v.status === 'active' ? 'status-active' : 'status-maintenance';
          return '<tr>' +
            '<td class="car-icon">' + getCarSvg(v.model) + '</td>' +
            '<td><div class="model-cell"><strong>' + v.model + '</strong></div></td>' +
            '<td style="font-family:monospace;font-size:12px;color:#58595B">' + v.vin + '</td>' +
            '<td>' + v.year + '</td>' +
            '<td><span class="' + statusClass + '">' + v.status + '</span></td>' +
            '<td>' + Number(v.mileage).toLocaleString() + '</td>' +
            '<td>' + new Date(v.last_service).toLocaleDateString() + '</td>' +
            '<td><button class="delete-btn" onclick="deleteVehicle(' + v.id + ',\\'' + v.model + '\\')" title="Remove">\u00d7</button></td>' +
          '</tr>';
        }).join('');
      } catch (e) {
        document.getElementById('vehicles-body').innerHTML =
          '<tr><td colspan="8" style="color:#dc2626">Failed to load vehicles</td></tr>';
      }
    }

    loadStatus();
    loadVehicles();
  </script>
</body>
</html>`;

  res.send(html);
});

// --- Startup ---
seedV2Vehicles().then(() => {
  app.listen(PORT, () => {
    console.log('Toyota Fleet Database Portal running on port ' + PORT);
    console.log('App Version: ' + APP_VERSION);
    console.log('Connection Method: ' + CONNECTION_METHOD);
    console.log('Database Host: ' + DB_HOST);
  });
});
