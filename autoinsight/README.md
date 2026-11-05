# AutoInsight — From Raw Data to Reliable Insights

AutoInsight is an AI-powered automated data cleaning, dashboard generation, and verifiable data analysis platform. It empowers non-technical and business users to upload raw tabular datasets, automatically identify and resolve quality issues, generate interactive dashboards, and query numbers in natural language with deterministic, evidence-backed answers.

---

## 🌟 Six Integrated Phases

1. **Website Foundation & Dataset Upload**:
   - Drag-and-drop file upload for **CSV**, **XLSX**, **XLS**, and **JSON**.
   - Immediate row and column profiling with preview of sample records.
   - Initial data quality health scoring (0–100) and friendly plain-English explanations.
   - Built-in instant sample datasets (E-Commerce Retail, SaaS Subscriptions).

2. **Automated Data Cleaning & Validation**:
   - Profiling of duplicate rows, missing values, text-formatted numbers (e.g. currency `$`, `%`, `,`), inconsistent date standards, and extreme statistical outliers (1.5x IQR).
   - Reversible transformations: deduplication, whitespace trimming, ISO date normalization, distribution-aware imputation (mean/median/mode), and outlier bounding.
   - Before-and-after reports detailing exact rows removed, invalid values resolved, and type conversions.
   - One-click version rollback & restore capability.

3. **Automatic Interactive Dashboard Generation**:
   - Automated descriptive KPIs with explicit mathematical formulas and assumptions.
   - Context-aware interactive charts powered by Apache ECharts:
     - Chronological time-series line progression with area fills.
     - Ranked categorical bar charts.
     - Proportional donut charts for low-cardinality segments.
     - Bivariate correlation scatter plots with Pearson $r$ coefficient calculations.
   - Interactive cross-filtering by category, date ranges, and searchable data tables.
   - **"Explain Chart"** button on every chart providing data-backed takeaways, potential drivers, and suggested next steps.
   - One-click chart PNG export and printable executive report generation.

4. **LLM-Powered Data Analyst**:
   - Natural language chat understanding questions about metrics, categories, trends, and correlations.
   - Controlled deterministic tool execution (schema lookup, aggregations, ranking, correlation) ensuring answers remain mathematically accurate without hallucinated numbers.
   - Integration with Google Gemini API (`gemini-3.8-flash`) with fallback deterministic synthesis when offline.
   - Plain-language explanations for non-technical users.

5. **Evidence-Backed Answer Verification**:
   - Every analytical response includes an **Evidence Panel**:
     - Verified claim statement.
     - Specific dataset version and active row count.
     - Mathematical metric formula.
     - Exact query specification executed.
     - Intermediate calculation audit steps.
     - Number of records included vs. excluded with reasons.
     - Verification status badge (`Verified Calculation`, `Partially Verified`, `Unverified Explanation`, `Verification Failed`).
     - Cryptographic reproducibility token (`REP-...`).

6. **Workflow Orchestrator & Performance Monitoring**:
   - Central state engine tracking pipeline stages (`uploaded`, `profiling`, `cleaning`, `validating`, `dashboard_generation`, `ready_for_analysis`).
   - Persistent background job history with duration benchmarks and throughput metrics (rows/sec).
   - Real-time event log stream for full transparency.

---

## 🛠️ Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Apache ECharts (`echarts`, `echarts-for-react`).
- **Backend**: Node.js & Express server with TypeScript (`server.ts`).
- **Parsing**: `papaparse` for high-throughput CSV processing, `xlsx` (SheetJS) for Excel worksheets.
- **AI & Reasoning**: Google Gen AI SDK (`@google/genai`) using `gemini-3.8-flash` with safety timeout and deterministic analytical engines.
- **Persistence**: File-backed persistent database (`data/db.json` and `data/uploads/`) storing user profiles, datasets, versions, cleaning actions, dashboards, conversations, reports, and verification audits.

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```
*(Note: If `GEMINI_API_KEY` is not provided, AutoInsight seamlessly runs its deterministic smart query engine with 100% verified calculations).*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔒 Security & Privacy

- **Immutable Sources**: Original file uploads are preserved as immutable artifacts.
- **Isolated User Authorization**: Datasets and executive reports are secured by user ownership checks.
- **Data Minimization**: Raw tabular datasets are never sent to external LLMs; only schema metadata and calculated aggregations are used for natural-language synthesis.
- **Data Export & Deletion**: Complete personal data archive download (JSON) and dataset deletion controls.
