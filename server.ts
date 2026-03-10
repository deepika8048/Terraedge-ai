import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import { GoogleGenAI } from '@google/genai';

// --- Initialization ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;
const db = new Database('fpa.db');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Database Setup ---
db.exec(`
  CREATE TABLE IF NOT EXISTS financials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    period TEXT,
    metric TEXT,
    value REAL
  );
  CREATE TABLE IF NOT EXISTS kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    period TEXT,
    kpi_name TEXT,
    value REAL,
    target REAL
  );
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    period TEXT,
    driver_name TEXT,
    value REAL
  );
  CREATE TABLE IF NOT EXISTS agent_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_name TEXT,
    action TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    details TEXT
  );
`);

// --- Data Loading ---
function loadData() {
  const histPath = './data/historical_financials/historical_financials.csv';
  if (fs.existsSync(histPath)) {
    const content = fs.readFileSync(histPath, 'utf-8');
    const records = parse(content, { columns: true }) as any[];
    const insert = db.prepare('INSERT INTO financials (company, period, metric, value) VALUES (?, ?, ?, ?)');
    db.transaction(() => {
      db.prepare('DELETE FROM financials').run();
      records.forEach(r => insert.run(r.company, r.period, r.metric, parseFloat(r.value)));
    })();
  }

  const kpiPath = './data/kpi_history/kpi_history.csv';
  if (fs.existsSync(kpiPath)) {
    const content = fs.readFileSync(kpiPath, 'utf-8');
    const records = parse(content, { columns: true }) as any[];
    const insert = db.prepare('INSERT INTO kpis (company, period, kpi_name, value, target) VALUES (?, ?, ?, ?, ?)');
    db.transaction(() => {
      db.prepare('DELETE FROM kpis').run();
      records.forEach(r => insert.run(r.company, r.period, r.kpi_name, parseFloat(r.value), parseFloat(r.target)));
    })();
  }

  const driverPath = './data/driver_data/driver_data.csv';
  if (fs.existsSync(driverPath)) {
    const content = fs.readFileSync(driverPath, 'utf-8');
    const records = parse(content, { columns: true }) as any[];
    const insert = db.prepare('INSERT INTO drivers (company, period, driver_name, value) VALUES (?, ?, ?, ?)');
    db.transaction(() => {
      db.prepare('DELETE FROM drivers').run();
      records.forEach(r => insert.run(r.company, r.period, r.driver_name, parseFloat(r.value)));
    })();
  }
}

// --- Agent Logic ---
const AGENTS = [
  'Strategic Orchestrator',
  'Budget Builder',
  'Revenue Forecasting',
  'Expense Forecasting',
  'Capital Planning',
  'Scenario Modeling',
  'KPI Tracking',
  'Variance Explanation',
  'Strategic Initiative Tracker',
  'Reporting & Insights'
];

async function logActivity(agent, action, details = '') {
  const result = db.prepare('INSERT INTO agent_activity (agent_name, action, details) VALUES (?, ?, ?)').run(agent, action, details);
  io.emit('agent_activity', { 
    id: result.lastInsertRowid,
    agent_name: agent,
    action,
    details,
    timestamp: new Date()
  });
}

async function runRevenueForecast(companyId) {
  await logActivity('Revenue Forecasting', `Analyzing historical trends for ${companyId}`);
  const data = db.prepare('SELECT period, value FROM financials WHERE company = ? AND metric = "revenue" ORDER BY period DESC LIMIT 12').all(companyId);
  
  const prompt = `Analyze these 12 months of revenue data for ${companyId}: ${JSON.stringify(data)}. 
  Provide a 12-month rolling forecast and 3 key insights. Return as JSON: { forecast: [{period: string, value: number}], insights: [string] }`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const result = JSON.parse(response.text);
    await logActivity('Revenue Forecasting', `Generated 12-month forecast for ${companyId}`, JSON.stringify(result.insights));
    return result;
  } catch (e) {
    console.error(e);
    return null;
  }
}

async function runKPIMonitoring() {
  await logActivity('KPI Tracking', 'Running daily portfolio-wide KPI check');
  const alerts = [];
  const companies = db.prepare('SELECT DISTINCT company FROM kpis').all();
  
  for (const { company } of companies) {
    const latestKpis = db.prepare('SELECT kpi_name, value, target FROM kpis WHERE company = ? ORDER BY period DESC LIMIT 5').all(company);
    for (const kpi of latestKpis) {
      if (kpi.kpi_name === 'churn_rate' && kpi.value > kpi.target) {
        alerts.push(`${company}: Churn rate (${(kpi.value * 100).toFixed(1)}%) exceeded target (${(kpi.target * 100).toFixed(1)}%)`);
      } else if (kpi.kpi_name === 'arr' && kpi.value < kpi.target) {
        alerts.push(`${company}: ARR shortfall detected. Current: $${(kpi.value / 1e6).toFixed(1)}M, Target: $${(kpi.target / 1e6).toFixed(1)}M`);
      }
    }
  }
  
  if (alerts.length > 0) {
    await logActivity('Strategic Orchestrator', 'KPI Alerts detected', alerts.join(' | '));
  }
}

// --- API Routes ---
app.use(express.json());

app.get('/api/portfolio', (req, res) => {
  const data = db.prepare(`
    SELECT company, metric, SUM(value) as total 
    FROM financials 
    WHERE period LIKE '2025-%' 
    GROUP BY company, metric
  `).all();
  res.json(data);
});

app.get('/api/company/:id', (req, res) => {
  const financials = db.prepare('SELECT * FROM financials WHERE company = ? ORDER BY period').all(req.params.id);
  const kpis = db.prepare('SELECT * FROM kpis WHERE company = ? ORDER BY period').all(req.params.id);
  const drivers = db.prepare('SELECT * FROM drivers WHERE company = ? ORDER BY period').all(req.params.id);
  res.json({ financials, kpis, drivers });
});

app.get('/api/activity', (req, res) => {
  const activity = db.prepare('SELECT * FROM agent_activity ORDER BY timestamp DESC LIMIT 50').all();
  res.json(activity);
});

app.post('/api/forecast/:id', async (req, res) => {
  const result = await runRevenueForecast(req.params.id);
  res.json(result);
});

// --- Data Generation ---
function generateInitialData() {
  const DATA_DIR = './data';
  const COMPANIES = [
    { id: 'cloudcrm_inc', name: 'CloudCRM Inc', revenue: 35000000, growth: 0.45, industry: 'SaaS', margin: 0.72 },
    { id: 'manufacturetech_co', name: 'ManufactureTech Co', revenue: 95000000, growth: 0.08, industry: 'Manufacturing', margin: 0.35 },
    { id: 'healthcaretech', name: 'HealthcareTech Solutions', revenue: 55000000, growth: 0.25, industry: 'Healthcare IT', margin: 0.55 },
    { id: 'ecommerce_logistics', name: 'E-commerce Logistics', revenue: 140000000, growth: 0.15, industry: 'Logistics', margin: 0.22 },
    { id: 'fintech_payments', name: 'FinTech Payments', revenue: 28000000, growth: 0.85, industry: 'FinTech', margin: 0.65 },
    { id: 'industrial_services', name: 'Industrial Services Group', revenue: 180000000, growth: 0.05, industry: 'Services', margin: 0.28 },
  ];

  if (fs.existsSync(DATA_DIR)) return;

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'historical_financials'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'kpi_history'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'driver_data'), { recursive: true });

  const startDate = new Date(2023, 0, 1);
  const periods = 36;

  let histRows = 'company,period,metric,value\n';
  let kpiRows = 'company,period,kpi_name,value,target\n';
  let driverRows = 'company,period,driver_name,value\n';

  COMPANIES.forEach(company => {
    const baseMonthlyRev = company.revenue / 12;
    for (let i = 0; i < periods; i++) {
      const date = new Date(startDate);
      date.setMonth(startDate.getMonth() + i);
      const periodStr = date.toISOString().slice(0, 7);
      const trend = Math.pow(1 + company.growth, i / 12);
      const noise = 0.95 + Math.random() * 0.1;

      const revenue = baseMonthlyRev * trend * noise;
      const cogs = revenue * (1 - company.margin) * (0.98 + Math.random() * 0.04);
      const ebitda = (revenue - cogs) * (0.6 + Math.random() * 0.1);

      histRows += `${company.id},${periodStr},revenue,${revenue.toFixed(2)}\n`;
      histRows += `${company.id},${periodStr},cogs,${cogs.toFixed(2)}\n`;
      histRows += `${company.id},${periodStr},ebitda,${ebitda.toFixed(2)}\n`;

      const arr = revenue * 12 * (0.9 + Math.random() * 0.2);
      kpiRows += `${company.id},${periodStr},arr,${arr.toFixed(2)},${(arr * 1.1).toFixed(2)}\n`;
      kpiRows += `${company.id},${periodStr},gross_margin,${(company.margin * (0.95 + Math.random() * 0.1)).toFixed(4)},${company.margin.toFixed(4)}\n`;

      const employees = Math.floor((revenue / 20000) * (0.9 + Math.random() * 0.2));
      driverRows += `${company.id},${periodStr},employees_total,${employees}\n`;
    }
  });

  fs.writeFileSync(path.join(DATA_DIR, 'historical_financials', 'historical_financials.csv'), histRows);
  fs.writeFileSync(path.join(DATA_DIR, 'kpi_history', 'kpi_history.csv'), kpiRows);
  fs.writeFileSync(path.join(DATA_DIR, 'driver_data', 'driver_data.csv'), driverRows);
}

// --- Server Startup ---
async function startServer() {
  generateInitialData();
  loadData();
  
  // Autonomous Triggers (Simulated)
  setInterval(() => {
    runKPIMonitoring();
  }, 60000); // Every minute for demo purposes

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
