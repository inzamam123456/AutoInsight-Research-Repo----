# AutoInsight — Proposed System Architecture

```text
Excel Upload
  -> Data Ingestion and Profiling
  -> Type Detection and Data Preparation (log transformations)
  -> Natural-Language Prompt Interpretation
  -> Analysis Engine
       - Descriptive statistics
       - Trend and correlation analysis
       - Forecasting
       - Causal / root-cause analysis
  -> Tableau Dashboard Generation
       - Template workbook + refreshed Hyper extract
  -> Insight and Explanation Layer
       - Ranked plain-English findings
       - Confidence indicators
       - Forecast metrics where applicable
       - Fairness flags where relevant
  -> Traceability and Visualization History
  -> Interactive Dataset Q&A
```

## Module responsibilities
1. **Ingestion and profiling:** accept an Excel workbook and inspect its structure.
2. **Preparation:** detect types, prepare data and record transformations.
3. **Prompt interpretation:** identify relevant columns, analysis operations and chart types.
4. **Analysis:** run appropriate descriptive, trend, correlation, forecasting and causal/root-cause methods. Do not treat association alone as proof of causation.
5. **Dashboard generation:** proposed Tableau integration uses a template workbook and a fresh Hyper extract with an extract-swap workflow.
6. **Insight generation:** explain computed outputs in ranked, plain language.
7. **Confidence and fairness:** expose context such as sample size, missing-data rate, statistical significance, forecast metrics (MAPE/RMSE) and relevant fairness flags.
8. **Traceability:** connect reported values to source rows/formulas and retain visualization history.
9. **Q&A:** answer follow-up questions by querying the dataset and computed results.

## Questions to validate during implementation
- What Tableau licensing and automation capabilities are available?
- Can Hyper extracts be generated and refreshed in the target environment?
- How will source-row references survive cleaning and transformations?
- Which statistical, forecasting and causal methods will be supported first?
- How will confidence indicators be defined and communicated?
- How will fairness checks and demographic fields be handled responsibly?

**Status:** Proposed architecture; implementation details and technical dependencies remain to be validated.
