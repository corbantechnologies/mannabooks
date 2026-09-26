// src/lib/data/use-cases.ts

export interface UseCaseItem {
  id: string;
  category: "MANUFACTURING" | "HOLDING_COMPANY" | "TECH_RESELLER" | "LOGISTICS_FMCG" | "SERVICES" | "RETAIL" | "GOVERNANCE";
  categoryLabel: string;
  badgeColor: string;
  icon: string;
  title: string;
  headline: string;
  problemStatement: string;
  mannaSolution: string;
  workflowSteps: {
    phase: string;
    description: string;
  }[];
  accountingEntry: {
    debit: string;
    credit: string;
    amountKes: string;
    note: string;
  };
  roiMetric: {
    headline: string;
    detail: string;
  };
  relatedIndustrySlug: string;
  departmentCostCenters?: {
    code: string;
    name: string;
    absorbedCosts: string;
  }[];
  staffRosterRoles?: {
    roleTitle: string;
    preset: string;
    permissions: string;
    privacy: string;
  }[];
  sublocationsHierarchy?: {
    code: string;
    name: string;
    type: string;
    purpose: string;
  }[];
}

export const USE_CASES_DATA: UseCaseItem[] = [
  {
    id: "enterprise-industrial-manufacturing",
    category: "MANUFACTURING",
    categoryLabel: "Enterprise Production & WMS",
    badgeColor: "#ea580c",
    icon: "🏭",
    title: "The Full-Scale Industrial Manufacturing Enterprise",
    headline: "Governing 6 Cost Centers, 5 Staff Roles, 5 Warehouse Sublocations & WIP Assemblies",
    problemStatement:
      "Kipevu Industrial Coatings & Lubricants Ltd. operates a 40-worker manufacturing plant producing automotive lubricants, resins, and industrial paints. Their legacy setup caused major operational bleed: factory electricity and machine maintenance weren't absorbed into unit costs, storekeepers leaked raw chemical buying prices to competitors, mixing spillage caused ghost WIP inventory, and goods frequently went missing during transit to their Mombasa port depot.",
    mannaSolution:
      "MannaBooks provides an integrated industrial ERP architecture: 6 departmental Cost Centers capture direct labor and utility absorption into Work-in-Progress (WIP); 5 staff roles enforce Cost-Price Blindness for warehouse clerks and approval ceilings for plant managers; 5 warehouse sublocations track granular bins (Aisle-Rack-Shelf-Bin); multi-stage Bill of Materials (BOM) formulas calculate scrap tolerances; and Two-Step stock transfers safeguard inter-depot dispatches.",
    workflowSteps: [
      {
        phase: "Step 1: Inbound GRN to Bin Coordinates",
        description: "Storekeeper receives 20x 200L drums of solvent and 5,000kg polymer. System records GRN and routes drums to Sub-location CHEM-VAULT (Bin A02-R01). Commercial privacy is active: storekeeper verifies physical quantity with zero visibility of supplier cost.",
      },
      {
        phase: "Step 2: Requisition to WIP Staging & BOM Assembly",
        description: "Chief Chemist initiates Production Run #PR-840 in Sub-location WIP-STAGE. Formula consumes 400L solvent + 1,000kg polymer + 2.5% evaporation allowance. System debits Work-in-Progress (1315) and credits Raw Goods (1310).",
      },
      {
        phase: "Step 3: Direct Labor & Overhead Absorption",
        description: "Line operators complete mixing and bottling into 200x 5L Jerrycans. MannaBooks appends Cost Center CC-101 (Power: KES 4,500) and CC-102 (Packaging Labor: KES 12,000) directly into finished unit asset valuation (KES 825/unit).",
      },
      {
        phase: "Step 4: Quality Release & Inter-Depot Dispatch",
        description: "QA Inspector clears batch to Sub-location FIN-HIGHBAY. Dispatcher dispatches 80 jerrycans to Mombasa Depot via haulier truck. Transfer enters 'IN_TRANSIT' status until Mombasa manager performs physical count verification.",
      },
    ],
    accountingEntry: {
      debit: "Finished Goods Inventory (1320) - KES 165,000",
      credit: "Raw Materials (1310: KES 148,500) + Factory Wages CC-102 (2150: KES 12,000) + Utilities CC-101 (2160: KES 4,500)",
      amountKes: "165,000.00 Capitalized",
      note: "Work-In-Progress (1315) fully liquidated; finished goods unit cost accurately capitalized at KES 825/pack before KRA eTIMS invoicing at KES 1,450.",
    },
    roiMetric: {
      headline: "100% End-to-End Control",
      detail: "Eliminated untracked chemical spillage, protected wholesale buying margins, and secured inter-depot cargo dispatches.",
    },
    relatedIndustrySlug: "manufacturing-production",
    departmentCostCenters: [
      { code: "CC-101", name: "Bulk Chemical Mixing & Reaction", absorbedCosts: "Industrial 3-phase power, boiler diesel, solvent dissipation" },
      { code: "CC-102", name: "High-Speed Bottling & Packaging", absorbedCosts: "Line technician wages, capper maintenance, carton packaging" },
      { code: "CC-103", name: "Quality Assurance & Testing Lab", absorbedCosts: "Laboratory reagents, batch retention samples, calibration" },
      { code: "CC-104", name: "Plant Utilities & Equipment Maintenance", absorbedCosts: "Preventative machinery servicing, replacement bearings, lubricants" },
      { code: "CC-105", name: "Central Dispatch & Logistics Depot", absorbedCosts: "Forklift diesel, haulier truck freight, driver trip allowances" },
      { code: "CC-106", name: "Plant Administration & Compliance", absorbedCosts: "Factory safety licenses, NEMA audits, plant supervisor salaries" },
    ],
    staffRosterRoles: [
      { roleTitle: "Plant Operations Director", preset: "MANAGER / ADMIN", permissions: "Full operational authority; approval limit of KES 250,000 on purchase bills and scrap write-offs", privacy: "Full Financial Access" },
      { roleTitle: "Chief Production Chemist", preset: "STOREKEEPER / MANAGER", permissions: "Formulates master BOM recipes, executes production runs, logs batch yields and spillage", privacy: "Cost-Price Blindness Active" },
      { roleTitle: "Raw Materials Storekeeper", preset: "STOREKEEPER", permissions: "Inbound PO receiving, GRN generation, raw bin stocking in Chemical Vault", privacy: "Cost-Price Blindness Active" },
      { roleTitle: "Quality Control Inspector", preset: "VIEWER / STOREKEEPER", permissions: "Batch quarantine inspection, lab sign-off, releases WIP to Finished Goods high-bay", privacy: "Cost-Price Blindness Active" },
      { roleTitle: "Factory Cost Accountant", preset: "ACCOUNTANT", permissions: "WIP balance reconciliations, labor accruals, standard vs actual variance analysis, tax filings", privacy: "Full Financial Access" },
    ],
    sublocationsHierarchy: [
      { code: "WH-01-RAW", name: "Raw Silos & Heavy Bulk Tanks", type: "Bulk Storage", purpose: "Bulk resin pellets, base oils, and 10,000L raw liquid storage tanks" },
      { code: "WH-01-VAULT", name: "Solvent & Chemical Vault", type: "Hazardous Materials", purpose: "200L flammable chemical solvent drums and pigment bins (Aisle-Rack-Shelf)" },
      { code: "WH-01-PACK", name: "Packaging & Container Bins", type: "Component Storage", purpose: "5L jerrycans, caps, foil induction seals, labels, and outer corrugated cartons" },
      { code: "WH-01-WIP", name: "WIP Assembly Floor (Tanks 1-4)", type: "Work-In-Progress", purpose: "Active blending reaction tanks where formulas undergo temperature curing" },
      { code: "WH-01-FIN", name: "Finished Goods High-Bay Racks", type: "Pallet Warehouse", purpose: "Palletized finished stock with batch lot numbers and barcode tags ready for order picking" },
      { code: "WH-02-MSA", name: "Mombasa Regional Port Depot", type: "Regional Hub", purpose: "Receives goods via Two-Step Inter-Branch Transfer (IN_TRANSIT) for coastal fulfillment" },
    ],
  },
  {
    id: "tech-on-demand-reseller",
    category: "TECH_RESELLER",
    categoryLabel: "On-Demand Tech Reselling",
    badgeColor: "#0284c7",
    icon: "💻",
    title: "The Zero-Stock Hardware Reseller",
    headline: "Selling KES 1,000,000 in Laptops & Servers Without Holding Physical Inventory",
    problemStatement:
      "Company A wins corporate IT hardware orders but cannot afford to lock KES 3M–5M into physical computer stock that rapidly depreciates. They need to quote clients, collect deposits, procure on-demand from master distributors, deliver with serial numbers, and protect their 25% margin.",
    mannaSolution:
      "Using MannaBooks pass-through billing with 'Track Inventory = OFF', Company A converts client Quotes into Invoices, issues distributor LPOs, and generates Delivery Notes containing device serial numbers for warranty tracking.",
    workflowSteps: [
      {
        phase: "Step 1: Quotation",
        description: "Send formal Quotation for 10x Core i7 Laptops @ KES 85,000 + Setup @ KES 50,000.",
      },
      {
        phase: "Step 2: Client Commitment",
        description: "Convert Quote to Tax Invoice; client pays 60% deposit (KES 540,000) recorded via Official Receipt.",
      },
      {
        phase: "Step 3: Distributor Purchase",
        description: "Issue LPO to master distributor for 10 units @ KES 65,000. Record Vendor Bill upon hardware release.",
      },
      {
        phase: "Step 4: Dispatch with Serial Numbers",
        description: "Generate signed Delivery Note with all 10 device serial numbers (`S/N`) for future warranty audit.",
      },
    ],
    accountingEntry: {
      debit: "Cash / Bank Asset (1000) - KES 900,000",
      credit: "Hardware & Setup Revenue (4000) - KES 900,000",
      amountKes: "250,000.00 Gross Margin",
      note: "COGS of KES 650,000 deducted directly against distributor bill, locking in KES 250,000 clean profit.",
    },
    roiMetric: {
      headline: "0 Dead Stock Loss",
      detail: "100% elimination of inventory depreciation write-downs while boosting operating cash flow.",
    },
    relatedIndustrySlug: "tech-integrators",
  },
  {
    id: "manufacturing-bom-blender",
    category: "MANUFACTURING",
    categoryLabel: "Light Manufacturing & Assembly",
    badgeColor: "#ea580c",
    icon: "⚙️",
    title: "The Chemical & Beverage Blender",
    headline: "Automating Bill of Materials (BOM) & Factory Overhead for High-Volume Packaging",
    problemStatement:
      "A cleaning chemicals manufacturer purchases bulk 200L barrels of raw solvents and 5,000 plastic bottles. Operators manually guess unit packaging costs, leading to unbudgeted wastage, ghost stock, and inaccurate retail pricing.",
    mannaSolution:
      "MannaBooks Bill of Materials (BOM) allows defining exact ingredient formulas down to the milliliter with configurable spillage tolerances. Running a production batch auto-deducts bulk raw materials, credits finished units, and capitalizes direct labor.",
    workflowSteps: [
      {
        phase: "Step 1: Formula Formulation",
        description: "Define BOM: 1,000L raw base + 2,000 plastic containers + 2% spillage tolerance + KES 15,000 direct labor.",
      },
      {
        phase: "Step 2: Assembly Run",
        description: "Click 'Execute Production Run' in MannaBooks to produce 2,000 retail bottles of commercial disinfectant.",
      },
      {
        phase: "Step 3: Real-Time Valuation",
        description: "System computes exact cost per bottle: KES 82.50 (inclusive of raw materials, bottle, cap, and factory labor).",
      },
      {
        phase: "Step 4: Distributor Billing",
        description: "Issue KRA eTIMS invoice to supermarket chain at KES 140/bottle with guaranteed 41% gross margin.",
      },
    ],
    accountingEntry: {
      debit: "Finished Goods Inventory (1320)",
      credit: "Raw Materials (1310) & Factory Wages (2150)",
      amountKes: "165,000.00",
      note: "Raw components credited; finished retail units capitalized onto balance sheet at exact unit cost.",
    },
    roiMetric: {
      headline: "+18.4% Margin Visibility",
      detail: "Eliminated raw material shrinkage and accurately factored direct labor into wholesale retail prices.",
    },
    relatedIndustrySlug: "manufacturing-production",
  },
  {
    id: "holding-company-governance",
    category: "HOLDING_COMPANY",
    categoryLabel: "Holding Companies & Conglomerates",
    badgeColor: "#4f46e5",
    icon: "🏛️",
    title: "The 3-Subsidiary Conglomerate",
    headline: "Managing Transport, Real Estate & Hardware Under One Executive Central Login",
    problemStatement:
      "A family holding office owns a logistics fleet, a commercial real estate firm, and a retail hardware store. Commingled bank transfers and mixed tax records were triggering red flags with KRA and costing weeks of audit reconciliation.",
    mannaSolution:
      "MannaBooks Multi-Workspace Directory gives the Group CEO and CFO single-sign-on access to all 3 entities, with completely isolated General Ledgers, dedicated KRA PINs, separate invoice sequences, and inter-company management fee tracking.",
    workflowSteps: [
      {
        phase: "Step 1: Entity Provisioning",
        description: "Create isolated workspaces: Transit Logistics Ltd (P051...), Skyline Properties (P052...), Savanna Hardware (P053...).",
      },
      {
        phase: "Step 2: Role Allocation",
        description: "Assign branch managers access ONLY to their subsidiary; assign Group CFO master access across all three.",
      },
      {
        phase: "Step 3: Inter-Company Transactions",
        description: "Record inter-company shared HQ IT and audit fees without messy co-mingled banking entries.",
      },
      {
        phase: "Step 4: Consolidated Review",
        description: "Export clean P&L and Balance Sheet per subsidiary in seconds for quarterly board presentations.",
      },
    ],
    accountingEntry: {
      debit: "Due from Subsidiary (1180 - Holding)",
      credit: "Management Service Revenue (4200 - Holding)",
      amountKes: "450,000.00",
      note: "Inter-company management fee booked cleanly with complete legal separation.",
    },
    roiMetric: {
      headline: "12 Days Saved Monthly",
      detail: "Month-end group financial consolidation dropped from 14 business days down to 2 days.",
    },
    relatedIndustrySlug: "holding-companies",
  },
  {
    id: "fmcg-fefo-cold-chain",
    category: "LOGISTICS_FMCG",
    categoryLabel: "FMCG & Pharmaceutical Logistics",
    badgeColor: "#16a34a",
    icon: "📦",
    title: "The Pharmaceutical FEFO Cold-Chain",
    headline: "Eliminating Expired Stock Loss with Batch Dates & Warehouse Bin Coordinates",
    problemStatement:
      "A pharmaceutical distributor lost KES 1.8M annually because warehouse pickers grabbed newly delivered syrups and injectables from front shelves while older batches expired in back racks.",
    mannaSolution:
      "MannaBooks FEFO (First-Expired, First-Out) engine forces dispatchers to pick the oldest valid batch. Granular warehouse bin coordinates (`Aisle - Rack - Shelf - Bin`) direct pickers straight to the exact pallet location.",
    workflowSteps: [
      {
        phase: "Step 1: Batch Intake",
        description: "Receive Lot #VAC-204 (Expiry: 12 months) into Bin `A01-R03-S02`. Receive Lot #VAC-208 (Expiry: 24 months) into Bin `A01-R03-S04`.",
      },
      {
        phase: "Step 2: Expiry Risk Monitoring",
        description: "Expiry risk dashboard flags any lot reaching the 90-day critical clearance window with color-coded alerts.",
      },
      {
        phase: "Step 3: Intelligent FEFO Picking",
        description: "When an order arrives, MannaBooks automatically generates a Pick Slip assigning Lot #VAC-204 from Bin `A01-R03-S02`.",
      },
      {
        phase: "Step 4: Blind Stocktake Audit",
        description: "Store auditors conduct weekend cycle counts on mobile tablets; variances auto-reconcile to the GL.",
      },
    ],
    accountingEntry: {
      debit: "Cost of Goods Sold (5000)",
      credit: "Pharmaceutical Inventory - Batch VAC-204 (1300)",
      amountKes: "320,000.00",
      note: "Oldest batch consumed first, successfully clearing shelf life before expiration.",
    },
    roiMetric: {
      headline: "89% Less Waste",
      detail: "Expired pharmaceutical write-offs dropped by 89% in the first full operating year.",
    },
    relatedIndustrySlug: "fmcg-distribution",
  },
  {
    id: "services-retainer-law-firm",
    category: "SERVICES",
    categoryLabel: "Professional Services & Retainers",
    badgeColor: "#d97706",
    icon: "⚖️",
    title: "The Corporate Law Firm Retainer Burndown",
    headline: "Capturing Every Billable Hour & Stopping Client Retainer Scope Creep",
    problemStatement:
      "A commercial law firm had 12 corporate clients on KES 200,000/month retainers. Associates consistently worked 35+ hours instead of the agreed 20 hours, leaking over KES 300,000 in unbilled partner time every month.",
    mannaSolution:
      "MannaBooks Retainer Contracts module automatically burns down monthly SLA hours as associates log timesheets. Once the 20-hour ceiling is crossed, MannaBooks generates excess hourly billing with 1-click partner approval.",
    workflowSteps: [
      {
        phase: "Step 1: Contract Setup",
        description: "Create Retainer Contract: KES 200,000/mo includes 20 partner hours. Excess hours billed at KES 12,000/hr.",
      },
      {
        phase: "Step 2: Daily Timesheet Logging",
        description: "Associate logs 4.5 hours drafting employment policies. System burns down client allowance to 15.5 hours remaining.",
      },
      {
        phase: "Step 3: Automated Over-Scope Alert",
        description: "Client exhausts 20 hours on the 22nd of the month. System notifies Partner and flags excess time.",
      },
      {
        phase: "Step 4: 1-Click Excess Invoicing",
        description: "At month-end, Partner generates standard KES 200,000 retainer invoice + KES 72,000 for 6 hours of over-scope work.",
      },
    ],
    accountingEntry: {
      debit: "Accounts Receivable - Corporate Client (1100)",
      credit: "Retainer Revenue (4100) & Excess Fees (4150)",
      amountKes: "272,000.00",
      note: "Standard retainer of KES 200k + KES 72k excess billable hours captured cleanly.",
    },
    roiMetric: {
      headline: "+KES 340,000 Monthly",
      detail: "Recovered leaked billable partner hours through automated retainer scope burndowns.",
    },
    relatedIndustrySlug: "professional-services",
  },
  {
    id: "retail-branch-stock-transfers",
    category: "RETAIL",
    categoryLabel: "Retail Chains & Multi-Branch POS",
    badgeColor: "#059669",
    icon: "🏪",
    title: "The 4-Branch Retail Chain",
    headline: "Two-Step Stock Dispatches & Instant Walk-In POS Checkout Across Town",
    problemStatement:
      "A fast-growing retail chain with an Industrial Area warehouse and 3 mall counters suffered from stock 'disappearing' during van delivery, while slow POS checkout queues caused lost walk-in customers.",
    mannaSolution:
      "MannaBooks Two-Step Stock Transfer protocol keeps inventory in 'IN_TRANSIT' status until destination branch managers physically verify quantities. Walk-In POS terminals allow 2-second checkouts with cash change & M-Pesa logging.",
    workflowSteps: [
      {
        phase: "Step 1: Central Dispatch",
        description: "Industrial warehouse dispatches 100 power drills to Junction Mall Branch. Status: 'IN_TRANSIT'.",
      },
      {
        phase: "Step 2: Transit Verification",
        description: "Van driver arrives; Junction Mall manager counts 100 units on tablet and clicks 'Confirm Receipt'.",
      },
      {
        phase: "Step 3: High-Speed POS Checkout",
        description: "Customer walks up to counter. Cashier scans drill barcode (KES 6,500), inputs M-Pesa code; receipt prints instantly.",
      },
      {
        phase: "Step 4: End-of-Day Till Balancing",
        description: "Branch reconciles cash drawer and M-Pesa till with zero variance in under 5 minutes.",
      },
    ],
    accountingEntry: {
      debit: "M-Pesa Till Account (1010)",
      credit: "Retail Sales Revenue (4000)",
      amountKes: "6,500.00",
      note: "Cashier sale recorded; branch stock ledger auto-deducted -1 unit immediately.",
    },
    roiMetric: {
      headline: "100% Transit Accountability",
      detail: "Zero missing inventory during inter-branch truck deliveries; 60% faster checkout queues.",
    },
    relatedIndustrySlug: "retail-chains",
  },
  {
    id: "commercial-privacy-cost-blinding",
    category: "GOVERNANCE",
    categoryLabel: "Commercial Privacy & Role Scoping",
    badgeColor: "#64748b",
    icon: "🛡️",
    title: "The Commercial Privacy Guard",
    headline: "Blinding 20 Storekeepers & Cashiers to Supplier Cost Prices and Business Margins",
    problemStatement:
      "A high-volume hardware distributor discovered that store clerks and cashiers were leaking wholesale supplier buying prices to competing merchants and arguing with management over company profits.",
    mannaSolution:
      "MannaBooks provides built-in 'Cost-Price Blindness' (`hideCostPrices`). Storekeepers, cashiers, and dispatchers can view stock levels, receive goods, and scan sales, but purchase cost prices and gross margin metrics are completely masked.",
    workflowSteps: [
      {
        phase: "Step 1: Role Preset Assignment",
        description: "Assign store clerks to the 'STOREKEEPER' preset and toggle 'Hide Cost Prices (Commercial Privacy)'.",
      },
      {
        phase: "Step 2: Inbound Goods Receiving",
        description: "Clerks verify physical incoming quantities (e.g. 200 bags of cement) without seeing supplier purchase invoices.",
      },
      {
        phase: "Step 3: Point-of-Sale Execution",
        description: "Cashiers ring up sales at retail prices without seeing whether the business makes a 10% or 40% margin.",
      },
      {
        phase: "Step 4: Owner Confidentiality",
        description: "Only Directors, Owners, and designated Accountants see true gross profit margins in the executive dashboard.",
      },
    ],
    accountingEntry: {
      debit: "Inventory (1300) - Managed Confidentially",
      credit: "Accounts Payable (2000) - Visible Only to Finance",
      amountKes: "Protected Margins",
      note: "Full separation of operational execution from executive financial privacy.",
    },
    roiMetric: {
      headline: "Zero Margin Leakage",
      detail: "Complete corporate confidentiality of supplier pricing terms across 20+ frontline staff.",
    },
    relatedIndustrySlug: "retail-chains",
  },
  {
    id: "spending-governance-approvals",
    category: "GOVERNANCE",
    categoryLabel: "Spending Governance & Approval Caps",
    badgeColor: "#0284c7",
    icon: "✍️",
    title: "The Corporate Spending Threshold",
    headline: "Enforcing a KES 50,000 Cap Where All Purchases Route to the Managing Director",
    problemStatement:
      "A 50-person commercial firm experienced constant petty cash leakage and unapproved supplier bills as mid-level supervisors committed the company to expensive catering, travel, and repairs without oversight.",
    mannaSolution:
      "MannaBooks allows assigning direct approval limits (`directApprovalLimit: 50000`). Any bill or expense above KES 50,000 enters an approval queue requiring digital sign-off from the Managing Director or CFO before funds can be disbursed.",
    workflowSteps: [
      {
        phase: "Step 1: Set Approval Limits",
        description: "Set Operations Manager limit to KES 30,000; Procurement Officer to KES 50,000.",
      },
      {
        phase: "Step 2: Bill Submission",
        description: "Office Manager submits repair bill for KES 85,000. System tags status as 'PENDING_APPROVAL'.",
      },
      {
        phase: "Step 3: Executive Review",
        description: "Managing Director receives approval notification on MannaBooks dashboard, inspects attached invoice, and clicks 'Approve'.",
      },
      {
        phase: "Step 4: Controlled Disbursement",
        description: "Accountant releases payment via bank EFT only after executive approval timestamp is verified in audit trail.",
      },
    ],
    accountingEntry: {
      debit: "Repairs & Maintenance Expense (5300)",
      credit: "Accounts Payable - Contractor (2000)",
      amountKes: "85,000.00 Approved",
      note: "Authorized legally with full digital audit trail and approval log.",
    },
    roiMetric: {
      headline: "100% Controlled Outflows",
      detail: "Completely eliminated rogue supervisor spending and unauthorized vendor commitments.",
    },
    relatedIndustrySlug: "holding-companies",
  },
];
