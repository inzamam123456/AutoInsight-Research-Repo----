# AutoInsight Dataset Collection — Download Register

This register is the active acquisition plan for the 15 dataset categories. The priority is data with observations from 2023–2026. **Observation period, publication date and repository update date are separate fields** and must be checked independently.

## Download candidates

| # | Category | Candidate and direct access | Data recency / verification | License / handling |
|---:|---|---|---|---|
| 1 | Qualitative / categorical | [2024 State of Open Source Survey CSV](https://raw.githubusercontent.com/openlogic/2024-State-of-Open-Source-survey-dataset/main/2024%20State%20of%20Open%20Source%20Survey%20Anonymized%20Dataset.csv) | 2024 survey; raw CSV endpoint exists, but connector could not read it because it exceeds its text-file limit. | Repository states CC BY 4.0; retain attribution. |
| 2 | Quantitative | [PLFS 2025 CSV ZIP](https://github.com/Vonter/india-plf-survey/releases/latest/download/2025.csv.zip) | 2025 survey data; release download. | ODbL; read source terms and attribute. |
| 3 | Numerical-only table | [GovDataHub open-data index](https://github.com/GovDataHub/open-data-index) | Catalog export generated 2026-10-26; choose an underlying numeric-only table with 2023–26 observations. | Index states license-cleared catalog; each underlying dataset has its own license. |
| 4 | Text-only PDF | [NITI Aayog annual reports](https://www.niti.gov.in/publication/annual-report) | Choose a 2023–24, 2024–25 or 2025–26 report; confirm exact PDF and selectable text. | Follow the report's reuse terms. |
| 5 | Mixed numerical + categorical | [PLFS 2025 CSV ZIP](https://github.com/Vonter/india-plf-survey/releases/latest/download/2025.csv.zip) | 2025; suitable mixed survey data candidate. | ODbL; read source terms and attribute. |
| 6 | Time-series | [India Time Use Survey 2024 CSV.gz](https://github.com/Vonter/india-timeuse-survey/releases/latest/download/timeuse.csv.gz) | Survey 2024; repository README identifies individual profiles and daily activity schedules. | ODbL; repository source is [here](https://github.com/Vonter/india-timeuse-survey). |
| 7 | Customer reviews / free text | [2024 State of Open Source Survey CSV](https://raw.githubusercontent.com/openlogic/2024-State-of-Open-Source-survey-dataset/main/2024%20State%20of%20Open%20Source%20Survey%20Anonymized%20Dataset.csv) | 2024; survey includes textual response fields only where released. | CC BY 4.0 per repository; inspect fields before use. |
| 8 | Scanned PDF / OCR | [Scanned PDF test file](https://filedone.ai/sample-files/sample-scanned-pdf) | Synthetic OCR test fixture, not a 2023–26 real-world dataset. Keep as a document-processing test asset. | Check sample-file terms; do not treat as real-world evidence. |
| 9 | PDF with tables | [World Bank Global Economic Prospects](https://www.worldbank.org/en/publication/global-economic-prospects) | Select a 2024, 2025 or 2026 report and verify tables in the actual PDF. | Follow World Bank report reuse and attribution terms. |
| 10 | Geographical | [GovDataHub open-data index](https://github.com/GovDataHub/open-data-index) | Search its CSV/JSON catalog for license-cleared 2023–26 geospatial records and retain the source landing page. | Verify license of the selected underlying dataset. |
| 11 | Hierarchical | [India Time Use Survey repository](https://github.com/Vonter/india-timeuse-survey) | 2024; use region/state and activity groupings only where present in metadata. | ODbL; retain attribution. |
| 12 | Boolean / binary | [PLFS 2025 CSV ZIP](https://github.com/Vonter/india-plf-survey/releases/latest/download/2025.csv.zip) | 2025; inspect codebook for true binary variables (yes/no or 0/1). | ODbL; retain attribution. |
| 13 | Missing values | [PLFS 2025 CSV ZIP](https://github.com/Vonter/india-plf-survey/releases/latest/download/2025.csv.zip) | 2025; inspect raw data and quantify missingness before classifying it as a missing-value test. | ODbL; retain attribution. |
| 14 | Duplicates and outliers | [2024 NYC Yellow Taxi Trip Data](https://catalog.data.gov/dataset/2024-yellow-taxi-trip-data) | 2024; download a monthly CSV and verify duplicate and outlier conditions. | Check the dataset's stated government open-data terms. |
| 15 | Large dataset / performance | [PLFS 2025 CSV ZIP](https://github.com/Vonter/india-plf-survey/releases/latest/download/2025.csv.zip) | 2025; release contains a large survey file; inspect size and row count before use. | ODbL; retain attribution. |

## What is actually verified so far

- The India Time Use Survey repository README explicitly identifies the source as India's 2024 Time Use Survey and provides a CSV.gz release download. It states an Open Database License (ODbL).
- The 2024 Open Source Survey repository provides an anonymized CSV raw-file URL and states CC BY 4.0 in its repository documentation. The file is too large for the connected GitHub text-fetch capability to read; this does not mean the public download link is broken.
- The PLFS repository offers 2024 and 2025 CSV ZIP release downloads. Treat the source's license and attribution terms as applicable.
- The GovDataHub index says its catalog was generated 2026-10-26 and contains license-cleared dataset metadata. It is an index, not a mirror of all underlying datasets.

## Acquisition status

This is a **download register**, not a claim that the data files themselves have been copied into this repository. The connected GitHub integration supports text-file commits but cannot fetch binary/oversized source files for transfer. Large CSV/ZIP/PDF files must be uploaded by the user or through a separate binary-capable upload workflow before they can be committed here.

## Required metadata for every acquired file

- Dataset title and category
- Source URL and retrieval date
- Observation/collection period
- Publication date and last-updated date
- License and required attribution
- File name, format and size
- Rows, columns and column data types
- Missing values, duplicates and outlier checks
- Intended AutoInsight test and expected analysis

## Public repository safety

Only commit datasets that may legally be redistributed. A public download URL does not automatically grant permission to mirror the file. Do not upload personal, confidential, restricted or credential-bearing data.
