# AutoInsight — Dataset Collection Register

**Purpose:** Track candidate datasets for evaluating AutoInsight across different data types, file formats and data-quality conditions.

**Date preference:** Prioritize datasets with data collected or published during 2023–2026. These dates are not interchangeable. Record the actual observation/collection period, publication date and last-updated date separately whenever the source provides them.

> **Important:** This is the initial candidate list transferred from the team's planning discussion. Links and date ranges must be checked on the source page before downloading or using a dataset in an experiment. A recent publication date does not prove that the underlying observations are recent. Likewise, the presence of missing values, duplicates or outliers must be verified from the downloaded file; do not assume those conditions exist.

## Candidate dataset list

| # | Target data type | Candidate dataset / source | Stated or intended period | Collection notes |
|---:|---|---|---|---|
| 1 | Qualitative / categorical | [Women's Voice and Agency — Odisha baseline](https://doi.org/10.7910/DVN/TF0SDZ) | Survey collected 2023; published 2024 (as listed in initial research) | Inspect questionnaire fields and confirm access, metadata and exact collection dates. |
| 2 | Quantitative | [Household Consumption Expenditure Survey](https://microdata.gov.in/NADA/index.php/catalog/237) | 2023–24 | Confirm available files, documentation and permitted use. |
| 3 | Numerical-only table | [Energy Statistics of India — dataset collection](https://dataful.in/collections/877/) | Through 2024–25 (candidate) | Select a table with numeric-only fields; retain units and column definitions. |
| 4 | Text-only PDF | [NITI Aayog annual reports](https://www.niti.gov.in/publication/annual-report) | 2023–24 to 2025–26 (candidate) | Download a PDF with selectable text and verify its publication year. |
| 5 | Mixed numerical and categorical | [Periodic Labour Force Survey — microdata catalogue](https://microdata.gov.in/NADA/index.php/catalog) | 2025 (candidate) | Select a specific survey round and record its reference period. |
| 6 | Time-series | [India electricity data](https://www.energymap.in/data) | Through 2026 (candidate) | Confirm frequency, coverage, units and latest observation date. |
| 7 | Customer reviews / free text | [Amazon India customer reviews — Mendeley Data](https://data.mendeley.com/datasets/2pv6d8fz7y/2) | Listed as published September 2026 in initial research | Verify actual review dates and license; publication date is not necessarily review date. |
| 8 | Scanned PDF / OCR | [MoEFCC annual reports](https://www.moef.gov.in/annual-reports) | 2023–24 to 2025–26 (candidate) | Annual reports are not necessarily scanned. For OCR testing, confirm a scanned/image-only PDF or create a permitted scanned test copy. |
| 9 | PDF containing tables | [OpenCity government PDF datasets](https://www.data.opencity.in/dataset/?_res_format_limit=0&license_id=other-pd&organization=government-of-india&res_format=PDF) | Search for 2024–25 UDISE+ reports | Confirm the specific report, year and whether tables are extractable. |
| 10 | Geographical data | [TAFSSA India Local Market and Retail Census](https://doi.org/10.7910/DVN/DEOUER) | Survey 2023; published 2024 (as listed in initial research) | Verify coordinate/location fields, geographic coverage and license. |
| 11 | Hierarchical data | [OpenCity government datasets](https://www.data.opencity.in/dataset/?_organization_limit=0&organization=government-of-india) | Search for UDISE+ 2024–25 | Select a dataset with a genuine hierarchy such as state → district → block → school. |
| 12 | Boolean / binary | [Periodic Labour Force Survey — microdata catalogue](https://microdata.gov.in/NADA/index.php/catalog) | 2025 (candidate) | Identify actual yes/no or 0/1 variables from the codebook; do not assume all fields are binary. |
| 13 | Missing values | [Household Consumption Expenditure Survey](https://microdata.gov.in/NADA/index.php/catalog/237) | 2023–24 | Inspect raw files and quantify missingness. If none exists, use another recent dataset or create a documented test copy with synthetic missing values. |
| 14 | Duplicates and outliers | [2024 NYC Yellow Taxi Trip Data](https://catalog.data.gov/dataset/2024-yellow-taxi-trip-data) | 2024 | Verify duplicate rows and unusual values after download; document detection rules. |
| 15 | Large dataset / performance | [India electricity data](https://www.energymap.in/data) | Through 2026 (candidate) | Check actual row count and file size. If too small, choose a larger recent public dataset and record the sampled/full-data distinction. |

## Dataset metadata to record

Create one metadata record for every downloaded file:

- Dataset ID and descriptive name
- Source URL and download date
- Data collection / observation period
- Publication date and last-updated date
- License and attribution requirements
- File name, format and file size
- Number of rows and columns
- Column names and detected data types
- Missing-value count and percentage
- Duplicate-row count
- Outlier checks performed and criteria used
- Intended AutoInsight test / analysis
- Expected output and any known limitations

## Suggested folder structure

```text
datasets/
├── README.md
├── 01_qualitative/
├── 02_quantitative/
├── 03_numerical_only/
├── 04_text_pdf/
├── 05_mixed_data/
├── 06_time_series/
├── 07_customer_reviews/
├── 08_scanned_pdf_ocr/
├── 09_pdf_tables/
├── 10_geographical/
├── 11_hierarchical/
├── 12_boolean_binary/
├── 13_missing_values/
├── 14_duplicates_outliers/
└── 15_large_datasets/
```

## Upload workflow

The team can upload dataset files to the conversation one at a time or in batches. Before adding each file to this public repository:

1. Identify the dataset and match it to a category.
2. Check for personal, confidential, licensed or otherwise restricted information.
3. Record the source, license, dates and file metadata.
4. Prefer a source link or a small, permitted sample when the original file is large.
5. Upload only files that may legally and safely be redistributed publicly.

**Do not upload API keys, credentials, private student information, personal records or restricted datasets.** A dataset being publicly downloadable does not automatically mean it can be redistributed in another public repository.
