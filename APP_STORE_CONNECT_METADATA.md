# App Store Connect Metadata & Submission Guide
**App Name:** Expense Manager  
**Bundle ID:** `com.umerfarooqlaghari.expensemanager`  
**Apple ID Account:** `mumerfarooqlaghari@gmail.com` / `info@alpha-devs.cloud`  
**Live Website:** `https://expense.alpha-devs.cloud`  

---

## 1. App Information (General)

| Field | Value / Options | Limit / Guidance |
| :--- | :--- | :--- |
| **App Name** | `Expense Manager: AI Tracker` *(or `Expense Manager`)* | Max 30 chars (27 chars) |
| **Subtitle** | `AI Receipt Scanner & Tracker` | Max 30 chars (28 chars) |
| **Primary Category** | `Finance` | Required |
| **Secondary Category** | `Business` *(or `Productivity`)* | Optional but recommended |
| **Bundle ID** | `com.umerfarooqlaghari.expensemanager` | Matches `app.json` |
| **SKU** | `EXPENSE_MGR_001` *(or any unique code)* | Internal tracking only |
| **Content Rights** | Does this app contain third-party content? -> **No** | |
| **User Access** | Full Access (Available to all users) | |

---

## 2. Version Information (iOS App - v1.0.0)

### Promotional Text (Max 170 chars)
> *Note: Can be updated anytime without submitting a new app build.*

```text
Effortlessly track expenses, scan receipts with instant AI extraction, visualize spending trends, and export clean Excel reports. Start your 14-day free trial today!
```
*(Exact length: 168 / 170 characters)*

---

### Description (Max 4,000 chars)

```text
Tired of lost paper receipts and chaotic spreadsheets? Expense Manager simplifies your personal and business expense tracking with fast, intelligent AI receipt scanning and automated bookkeeping.

Snap a photo of any receipt, invoice, or bill. Our smart extraction pipeline reads the merchant, date, tax, currency, and line items in seconds—giving you effortless, audit-ready expense records without tedious manual entry.

KEY FEATURES:

• SMART AI RECEIPT SCANNING
Just point your camera or upload a receipt from your photo library. Expense Manager automatically extracts store names, dates, amounts, and tax breakdowns with pinpoint accuracy.

• REAL-TIME SPENDING ANALYTICS
Understand your cash flow at a glance. Interactive charts and trend lines display monthly spending patterns, category distributions, and budget comparisons.

• MULTI-CURRENCY CONVERSION
Log expenses in international currencies with real-time conversion into your preferred base currency (USD, EUR, GBP, CAD, AUD, and dozens more).

• PROFESSIONAL EXCEL & CSV EXPORTS
Need to file taxes or submit reimbursement reports? Filter by custom date ranges or categories and export professional Excel spreadsheets with a single tap.

• CUSTOM CATEGORIES & TAGS
Organize expenses into custom categories—Travel, Meals, Office Supplies, Utilities, Client Entertainment—tailored to your workflow.

• SECURE CLOUD SYNC & ENCRYPTED STORAGE
All data and receipt images are protected with industry-standard 256-bit encryption in private cloud storage with Row-Level Security (RLS). Your records are securely synced across your devices.

• DARK MODE & BILINGUAL SUPPORT
Clean, modern interface designed for speed and clarity, featuring full dark mode support and English & Simplified Chinese localization.

PERFECT FOR:
- Freelancers & Contractors tracking tax deductions
- Small Business Owners managing operational overhead
- Frequent Travelers managing multi-currency expenses
- Anyone looking to budget smarter and eliminate receipt clutter

---

SUBSCRIPTION & IN-APP PURCHASE DETAILS:
Expense Manager includes a 14-day free trial with full access to all premium features upon account creation. After the trial period, full access requires an active auto-renewing subscription or lifetime access.

Subscription options:
• Monthly Subscription: $3.99 per month
• Annual Subscription: $34.99 per year
• Lifetime Access: $79.99 one-time purchase

Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions anytime in your App Store Account Settings after purchase.

Privacy Policy:
https://expense.alpha-devs.cloud/privacy/

Terms of Service:
https://expense.alpha-devs.cloud/terms/

Customer Support:
https://expense.alpha-devs.cloud/support/
```

---

### Keywords (Max 100 chars)
> *Note: Separate by comma only, no spaces, to maximize character count efficiency.*

```text
receipt,scanner,expense,tracker,budget,spending,finance,money,invoice,scan,business,tax,export,ai
```
*(Exact length: 95 / 100 characters)*

---

### URLs & Support Information

| Field | Value |
| :--- | :--- |
| **Support URL** | `https://expense.alpha-devs.cloud/support/` |
| **Marketing URL** | `https://expense.alpha-devs.cloud/` |
| **Privacy Policy URL** | `https://expense.alpha-devs.cloud/privacy/` |
| **Account Deletion URL** *(if requested)* | `https://expense.alpha-devs.cloud/delete-account/` |
| **Copyright** | `© 2026 Alpha Devs` |

---

## 3. In-App Purchases & Subscriptions Setup

### Subscription Group
- **Group Reference Name:** `Expense Tracker Subscriptions`

### Product 1: Monthly Subscription (Auto-Renewable)
- **Reference Name:** `Expense Tracker Monthly`
- **Product ID:** `ext_399_1m`
- **Subscription Duration:** `1 Month`
- **Price Tier:** `$3.99 USD`
- **Free Trial Offer:** `14 Days` (Introductory offer in App Store Connect)
- **Localization (Display Name):** `Monthly Premium`
- **Localization (Description):** `Unlimited AI receipt scanning, advanced analytics, and Excel exports.`

### Product 2: Annual Subscription (Auto-Renewable)
- **Reference Name:** `Expense Tracker Yearly`
- **Product ID:** `ext_34.99_1y`
- **Subscription Duration:** `1 Year`
- **Price Tier:** `$34.99 USD`
- **Localization (Display Name):** `Annual Premium`
- **Localization (Description):** `Unlimited receipt scans, advanced analytics, and reports for a full year.`

### Product 3: Lifetime Access (Non-Consumable)
- **In-App Purchase Type:** `Non-Consumable`
- **Reference Name:** `Expense Tracker Lifetime`
- **Product ID:** `ext_lifetimeaccess`
- **Price Tier:** `$79.99 USD`
- **Localization (Display Name):** `Lifetime Access`
- **Localization (Description):** `One-time purchase for permanent, unlimited access to all premium features.`

---

## 4. App Review Information (For Apple Review Team)

### Sign-In Information
- **Sign-in Required:** `[x] Yes`
- **Demo Username / Email:** `appstore-review@alpha-devs.cloud` *(create this in Supabase Auth before submission)*
- **Demo Password:** `Review2026!Test`
- **Notes for Reviewer:**
```text
Hello Apple Review Team,

Thank you for reviewing Expense Manager.

1. DEMO CREDENTIALS:
You can log in with the provided test credentials:
- Email: appstore-review@alpha-devs.cloud
- Password: Review2026!Test

2. CORE FEATURES TO TEST:
- AI Receipt Scanning: Tap the '+' button or camera icon on the Home screen. You can use the device camera to photograph any paper receipt/bill, or pick a sample receipt from the photo album. The app will extract merchant name, date, total amount, and category automatically.
- Spending Analytics & Trends: Tap the 'Visualize' / chart icon on the top right to view interactive spending graphs.
- Export Reports: Tap the 'Reports' icon to filter transactions by date or category and export an Excel (.xlsx) file.
- Subscriptions: All in-app purchase offerings are configured via StoreKit / RevenueCat sandbox for testing. Accounts automatically receive a 14-day free trial.

If you have any questions during review, please contact:
Umer Farooq Laghari (info@alpha-devs.cloud)
```

### Contact Information
- **First Name:** `Umer Farooq`
- **Last Name:** `Laghari`
- **Phone Number:** `+92 300 0000000` *(provide your direct phone number with country code)*
- **Email Address:** `info@alpha-devs.cloud` *(or `mumerfarooqlaghari@gmail.com`)*

---

## 5. App Privacy ("Nutrition Label") Questionnaire

When filling out App Privacy in App Store Connect:

1. **Do you or your third-party partners collect data from this app?**
   -> **Yes**
2. **Data Types Collected:**
   - **Contact Info:**
     - *Email Address & Name* (Used for App Functionality / Account authentication). Linked to the user's identity. Not used for tracking.
   - **Financial Info:**
     - *Payment Info:* Handled entirely by Apple StoreKit. Not collected directly by app.
     - *Other Financial Info (Expense transactions & amounts):* Used for App Functionality (Expense Management). Linked to user. Not used for tracking.
   - **User Content:**
     - *Photos / Videos:* Used for App Functionality (AI Receipt extraction). Linked to user. Not used for tracking.
   - **Identifiers:**
     - *User ID:* Used for App Functionality (Supabase user ID). Linked to user. Not used for tracking.
   - **Usage Data:**
     - *Product Interaction:* Used for App Functionality and Analytics. Linked to user. Not used for tracking.
3. **Tracking Purposes:**
   - *Do you use this data to track the user across apps and websites owned by other companies?* -> **NO**

---

## 6. Export Compliance & Age Rating

- **Export Compliance:**
  - *Does your app use encryption?* -> **No** (Uses standard HTTPS/TLS encryption only, exempt under EAR. In `app.json`, `ITSAppUsesNonExemptEncryption` is set to `false`).
- **Age Rating Questionnaire:**
  - Select "None" / "No" for all content questions (gambling, violence, mature content, unrestricted web access, etc.).
  - **Resulting Rating:** `4+` (Suitable for all ages).

---

## 7. Bonus: Chinese (Simplified) Metadata (Optional / Secondary Locale)

Since the app includes Chinese (`zh.json`) localization, you can add `Chinese (Simplified)` in App Store Connect:

- **App Name:** `Expense Manager 记账管家` (19 chars)
- **Subtitle:** `AI 智能发票扫描与记账` (11 chars)
- **Promotional Text:** `使用智能 AI 快速识别发票与收据，实时分析消费趋势，一键导出 Excel 财务报表。立即开启 14 天免费试用！` (53 chars)
- **Keywords:** `记账,发票,发票识别,收据,理财,预算,财务,报销,账本,消费记录,账单,ai,excel`
