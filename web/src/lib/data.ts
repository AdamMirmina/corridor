import dataset from "@/data/dataset.json";

export type HistoryPoint = {
  year: number | null;
  revenue: number | null;
  expenses: number | null;
  assets: number | null;
  netAssets: number | null;
  employees: number | null;
  volunteers: number | null;
  officerComp: number | null;
};

export type Gap = { from: number; to: number };

export type Officer = {
  name: string;
  title: string;
  comp: number | null;
  isExecutive: boolean;
};

export type NewsItem = {
  title: string;
  source: string;
  url: string;
  date: string;
};

export type Filing = {
  year: number | null;
  pdfUrl: string;
};

export type TaxCredit = {
  matchedName: string;
  startYear: number | null;
  annualAmount: number | null;
  reportYears: number[];
  active: boolean;
};

export type Org = {
  name: string;
  type: string; // "CDC" | "BID"
  ein: string;
  irsName: string;
  irsCity: string;
  confidence: string; // "high" | "medium" | "low" | "none" | ""
  firstYear: number | null;
  lastYear: number | null;
  yearsFiled: number;
  filingGaps: Gap[];
  compJumpYears: number[];
  latestRevenue: number | null;
  latestEmployees: number | null;
  website: string;
  contactEmail: string;
  source: string;
  closedCandidate: boolean;
  instability: number;
  executive: Officer | null;
  officers: Officer[];
  leadershipAsOf: number | null;
  news: NewsItem[];
  filings: Filing[];
  taxCredit: TaxCredit | null;
  history: HistoryPoint[];
};

export type Summary = {
  total: number;
  matched: number;
  withFinancialData: number;
  highConfidence: number;
  needsLookup: number;
  withSignal: number;
  withNamedExecutive: number;
  newsArticles: number;
  inTaxCreditProgram: number;
  everTaxCredit: number;
  form990Pdfs: number;
  cdcs: number;
  bids: number;
  closureCandidates: number;
  earliestYear: number | null;
  latestYear: number | null;
};

export type Dataset = {
  generatedAt: string;
  summary: Summary;
  orgs: Org[];
};

const data = dataset as Dataset;

export function getDataset(): Dataset {
  return data;
}

export function getOrgs(): Org[] {
  return data.orgs;
}

export function getOrg(ein: string): Org | undefined {
  return data.orgs.find((o) => o.ein === ein);
}

export function matchedOrgs(): Org[] {
  return data.orgs.filter((o) => o.ein);
}

/** EIN slug for the routes. Only matched orgs get a detail page. */
export function detailOrgs(): Org[] {
  return data.orgs.filter((o) => o.ein && o.history.length > 0);
}

/** Volatility ranking. Restricted to high-confidence matches so a dubious EIN
 *  (e.g. a same-named but unrelated nonprofit) can't top the list on noise. */
export function rankedByInstability(): Org[] {
  return [...data.orgs]
    .filter((o) => o.ein && (o.confidence === "high" || o.closedCandidate))
    .sort((a, b) => b.instability - a.instability || b.yearsFiled - a.yearsFiled);
}

/** Distribution of how many years each matched org has filed. A longevity
 *  proxy that is honest about the data: unlike "founding year", it doesn't
 *  pretend to see past the ~2010 floor where IRS digitization begins. */
export function longevityBuckets(): { label: string; count: number }[] {
  const defs: { label: string; test: (y: number) => boolean }[] = [
    { label: "1–3 yrs", test: (y) => y >= 1 && y <= 3 },
    { label: "4–6 yrs", test: (y) => y >= 4 && y <= 6 },
    { label: "7–9 yrs", test: (y) => y >= 7 && y <= 9 },
    { label: "10–12 yrs", test: (y) => y >= 10 && y <= 12 },
    { label: "13+ yrs", test: (y) => y >= 13 },
  ];
  return defs.map((d) => ({
    label: d.label,
    count: data.orgs.filter((o) => o.yearsFiled > 0 && d.test(o.yearsFiled)).length,
  }));
}

export type Tier = "Small" | "Medium" | "Large" | "Major" | null;

/** Latest total assets on record (the size proxy — IRS employee counts aren't
 *  digitized, so a CDC's balance-sheet holdings stand in for size). */
export function latestAssets(o: Org): number | null {
  for (let i = o.history.length - 1; i >= 0; i--) {
    const v = o.history[i].assets;
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

/** Income tier from latest annual revenue. Thresholds match the research sheet. */
export function incomeTier(o: Org): Tier {
  const v = o.latestRevenue;
  if (v === null || v === undefined) return null;
  if (v < 500_000) return "Small";
  if (v < 2_000_000) return "Medium";
  if (v < 10_000_000) return "Large";
  return "Major";
}

/** Size tier from latest total assets. Thresholds match the research sheet. */
export function sizeTier(o: Org): Tier {
  const v = latestAssets(o);
  if (v === null || v === undefined) return null;
  if (v < 1_000_000) return "Small";
  if (v < 5_000_000) return "Medium";
  if (v < 25_000_000) return "Large";
  return "Major";
}

export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function formatMoneyFull(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function confidenceLabel(c: string): string {
  if (c === "high") return "High";
  if (c === "medium") return "Medium";
  if (c === "low") return "Low";
  return "Unmatched";
}
