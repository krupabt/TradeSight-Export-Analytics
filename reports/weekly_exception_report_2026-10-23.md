# TradeSight Export Analytics — Weekly Operational Exception Report
**Report Generation Date:** 2026-10-23  
**Target Audience:** Export Operations Director, Logistics Lead, Data Governance Team  
**Scope:** Operational shipment performance and data quality exceptions  

> [!IMPORTANT]
> Exceptions listed herein represent operational delivery delays, data hygiene anomalies, and logistics thresholds.
> They do **not** represent proven legal, customs, or regulatory non-compliance violations.

## 1. Executive Summary & Exception Counts

- **Total Monitored Orders:** 600
- **Total Delivery Delays:** 135 (22.50% of orders)
- **Total Flagged Exception Records:** 135

### Breakdown by Severity
| Severity Level | Count | Action Required |
| :--- | :--- | :--- |
| **CRITICAL** | 2 | Immediate ERP correction: return quantity exceeds ordered volume |
| **HIGH** | 42 | CRM data reconciliation: first purchase date after last purchase date |
| **MEDIUM** | 37 | Logistics & Credit review: delays on 60 Days Net or extended transit |
| **LOW** | 54 | Informational monitoring: on-time shipments with extended transit |

### Breakdown by Category
| Exception Category | Count | Description |
| :--- | :--- | :--- |
| Logistics - Extended Transit Exception | 71 | Operational or data anomaly identified in pipeline |
| Data Quality - Chronological Inversion | 42 | Operational or data anomaly identified in pipeline |
| Logistics - Credit Term Delay Risk | 20 | Operational or data anomaly identified in pipeline |
| Data Quality - Logical Inconsistency | 2 | Operational or data anomaly identified in pipeline |

## 2. Critical & High Priority Exceptions Detail

| Exception ID | Dataset | Record ID | Entity | Category | Observed Value | Recommended Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `EXC-RET-B2B-00131` | `da_b2b_orders` | `B2B-00131` | BUY-0095 | Office Supplies | Returned: 28 > Ordered: 22 | Audit warehouse return receipt against order manifest; adjust return_qty in source ERP. |
| `EXC-RET-B2B-00188` | `da_b2b_orders` | `B2B-00188` | BUY-0151 | IT Hardware | Returned: 48 > Ordered: 39 | Audit warehouse return receipt against order manifest; adjust return_qty in source ERP. |
| `EXC-DATE-C8` | `da_customer_profiles` | `C8` | City: Delhi, Channel: Website | Customer Profile | First: 2025-09-16 > Last: 2025-07-24 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C10` | `da_customer_profiles` | `C10` | City: Chennai, Channel: App | Customer Profile | First: 2025-12-26 > Last: 2025-10-20 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C11` | `da_customer_profiles` | `C11` | City: Hyderabad, Channel: Offline | Customer Profile | First: 2026-04-27 > Last: 2026-04-21 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C14` | `da_customer_profiles` | `C14` | City: Chennai, Channel: Marketplace | Customer Profile | First: 2026-04-27 > Last: 2026-03-31 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C16` | `da_customer_profiles` | `C16` | City: Pune, Channel: Marketplace | Customer Profile | First: 2026-04-30 > Last: 2025-09-23 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C21` | `da_customer_profiles` | `C21` | City: Mumbai, Channel: App | Customer Profile | First: 2025-12-19 > Last: 2025-09-03 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C23` | `da_customer_profiles` | `C23` | City: Chennai, Channel: App | Customer Profile | First: 2025-11-10 > Last: 2025-10-18 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C26` | `da_customer_profiles` | `C26` | City: Pune, Channel: App | Customer Profile | First: 2026-03-25 > Last: 2025-08-09 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C27` | `da_customer_profiles` | `C27` | City: Pune, Channel: Offline | Customer Profile | First: 2025-10-31 > Last: 2025-09-12 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C30` | `da_customer_profiles` | `C30` | City: Delhi, Channel: Website | Customer Profile | First: 2026-04-03 > Last: 2026-02-23 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C39` | `da_customer_profiles` | `C39` | City: Delhi, Channel: App | Customer Profile | First: 2026-05-08 > Last: 2025-08-14 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C52` | `da_customer_profiles` | `C52` | City: Hyderabad, Channel: Offline | Customer Profile | First: 2025-12-28 > Last: 2025-10-18 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C57` | `da_customer_profiles` | `C57` | City: Chennai, Channel: Website | Customer Profile | First: 2026-03-25 > Last: 2025-10-24 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C71` | `da_customer_profiles` | `C71` | City: Chennai, Channel: Offline | Customer Profile | First: 2026-05-29 > Last: 2025-12-27 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C77` | `da_customer_profiles` | `C77` | City: Mumbai, Channel: Marketplace | Customer Profile | First: 2026-05-06 > Last: 2025-11-19 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C82` | `da_customer_profiles` | `C82` | City: Mumbai, Channel: App | Customer Profile | First: 2026-04-21 > Last: 2025-08-10 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C86` | `da_customer_profiles` | `C86` | City: Pune, Channel: Offline | Customer Profile | First: 2026-04-28 > Last: 2026-01-31 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C98` | `da_customer_profiles` | `C98` | City: Pune, Channel: Website | Customer Profile | First: 2026-01-22 > Last: 2025-09-25 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C99` | `da_customer_profiles` | `C99` | City: Delhi, Channel: Offline | Customer Profile | First: 2026-01-17 > Last: 2025-11-10 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C101` | `da_customer_profiles` | `C101` | City: Delhi, Channel: Website | Customer Profile | First: 2026-02-06 > Last: 2025-12-27 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C102` | `da_customer_profiles` | `C102` | City: Delhi, Channel: Marketplace | Customer Profile | First: 2026-03-17 > Last: 2025-10-12 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C103` | `da_customer_profiles` | `C103` | City: Chennai, Channel: Offline | Customer Profile | First: 2026-05-20 > Last: 2026-04-26 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |
| `EXC-DATE-C108` | `da_customer_profiles` | `C108` | City: Mumbai, Channel: Marketplace | Customer Profile | First: 2026-05-30 > Last: 2025-07-11 | Investigate CRM transaction sync logic; swap dates or re-extract initial onboarding timestamp. |

*Note: Displaying first 25 of 44 critical/high exceptions. Complete listing available in the accompanied CSV export.*

## 3. Logistics Working Capital Exposure (Delays on 60 Days Net)

When orders with deferred payment terms (`60 Days Net`) encounter delivery delays, working capital cash conversion cycles are significantly extended.

| Order ID | Buyer ID | Category | Transit Days | Order Value (INR) |
| :--- | :--- | :--- | :--- | :--- |
| `B2B-00018` | BUY-0117 | Textiles | Transit: 27 days, Value: INR 3,495,847.74 | Follow up with buyer |
| `B2B-00102` | BUY-0049 | Industrial Machinery | Transit: 43 days, Value: INR 284,783.40 | Follow up with buyer |
| `B2B-00128` | BUY-0162 | Chemicals | Transit: 37 days, Value: INR 5,979,504.12 | Follow up with buyer |
| `B2B-00205` | BUY-0101 | Chemicals | Transit: 21 days, Value: INR 9,893,216.85 | Follow up with buyer |
| `B2B-00238` | BUY-0147 | Industrial Machinery | Transit: 6 days, Value: INR 44,852.61 | Follow up with buyer |
| `B2B-00248` | BUY-0140 | IT Hardware | Transit: 15 days, Value: INR 17,091,208.75 | Follow up with buyer |
| `B2B-00256` | BUY-0145 | Raw Materials | Transit: 44 days, Value: INR 3,502,772.22 | Follow up with buyer |
| `B2B-00263` | BUY-0171 | Packaging | Transit: 25 days, Value: INR 467,834.90 | Follow up with buyer |
| `B2B-00273` | BUY-0194 | Raw Materials | Transit: 44 days, Value: INR 3,787,479.00 | Follow up with buyer |
| `B2B-00286` | BUY-0150 | Electronic Components | Transit: 40 days, Value: INR 6,499,286.44 | Follow up with buyer |
| `B2B-00334` | BUY-0070 | Packaging | Transit: 15 days, Value: INR 14,029,778.88 | Follow up with buyer |
| `B2B-00341` | BUY-0148 | Raw Materials | Transit: 45 days, Value: INR 7,164,657.34 | Follow up with buyer |
| `B2B-00367` | BUY-0151 | Pharmaceuticals | Transit: 6 days, Value: INR 5,669,488.64 | Follow up with buyer |
| `B2B-00396` | BUY-0085 | Pharmaceuticals | Transit: 21 days, Value: INR 7,306,812.72 | Follow up with buyer |
| `B2B-00403` | BUY-0175 | Industrial Machinery | Transit: 39 days, Value: INR 1,772,421.42 | Follow up with buyer |
| `B2B-00458` | BUY-0076 | Food Ingredients | Transit: 6 days, Value: INR 1,964,309.16 | Follow up with buyer |
| `B2B-00479` | BUY-0002 | Industrial Machinery | Transit: 38 days, Value: INR 4,795,577.60 | Follow up with buyer |
| `B2B-00516` | BUY-0162 | Chemicals | Transit: 19 days, Value: INR 3,016,614.84 | Follow up with buyer |
| `B2B-00527` | BUY-0177 | Office Supplies | Transit: 7 days, Value: INR 3,219,640.00 | Follow up with buyer |
| `B2B-00588` | BUY-0014 | Pharmaceuticals | Transit: 22 days, Value: INR 17,424,058.35 | Follow up with buyer |

## 4. Scheduling & Automated Distribution

### Windows Task Scheduler Setup
To execute this exception generator automatically every Monday at 08:00 AM:

```powershell
# In an elevated PowerShell terminal:
$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "D:\TradeSight-Export-Analytics\src\pipeline.py"
$Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday -At 08:00AM
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable
Register-ScheduledTask -TaskName "TradeSight_Weekly_Exception_Report" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Runs weekly data pipeline and exception generator"
```

### Safe SMTP Configuration
To enable automated weekly email dispatch, configure `.env` with valid credentials:

```ini
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_TLS=True
SMTP_USER=alerts@tradesight-export.com
SMTP_PASSWORD=your_secure_app_password
ALERT_RECIPIENTS=operations@tradesight-export.com,management@tradesight-export.com
APP_ENV=production
```

---
*Report generated automatically by TradeSight Export Analytics Pipeline v1.0.0.*