// src/lib/data/industries.ts

export interface IndustryDetail {
  slug: string;
  tag: string;
  icon: string;
  heroTitle: string;
  heroSubtitle: string;
  executiveSummary: string;
  idealFor: string[];
  keyChallenges: {
    title: string;
    description: string;
  }[];
  mannaSolution: {
    title: string;
    description: string;
    modules: string[];
  }[];
  workflowSteps: {
    stepNumber: string;
    title: string;
    action: string;
    accountingImpact: string;
  }[];
  sampleLedger: {
    stage: string;
    debitAccount: string;
    creditAccount: string;
    amountKes: string;
    explanation: string;
  }[];
  caseStudy: {
    clientName: string;
    location: string;
    profile: string;
    challenge: string;
    solutionApplied: string;
    measurableResults: string[];
  };
  faqs: {
    question: string;
    answer: string;
  }[];
}

export const INDUSTRIES_DATA: IndustryDetail[] = [
  {
    slug: "manufacturing-production",
    tag: "MANUFACTURING & ASSEMBLIES",
    icon: "⚙️",
    heroTitle: "Precision Bill of Materials & Unit Costing for Manufacturers",
    heroSubtitle: "Transform bulk raw materials into high-margin finished products with automated inventory deduction, labor overhead factoring, and exact cost-per-unit ledgers.",
    executiveSummary:
      "Designed specifically for light manufacturing, chemical blenders, bakeries, furniture fabricators, and beverage bottlers who need exact production costing without the bloat of legacy $50,000 ERP systems.",
    idealFor: [
      "Chemical, soap, and detergent blenders",
      "Commercial bakeries & food processing plants",
      "Furniture workshops & metal fabricators",
      "Beverage, juice, and bottled water bottlers",
      "Electronics assembly and packaging plants",
    ],
    keyChallenges: [
      {
        title: "Recipe Costing & Yield Variance Blindness",
        description: "Small shifts in raw chemical, sugar, or timber prices silently erode margins when finished pack prices remain static on retail shelves.",
      },
      {
        title: "Disorganized Multi-Step Stock Consumption",
        description: "Production teams consume bulk ingredients without immediate deductions, creating ghost inventory and crippling stocktakes.",
      },
      {
        title: "Untracked Factory Overhead & Direct Labor",
        description: "Focusing solely on raw materials ignores technician wages and machine energy, leading to underpriced commercial quotes.",
      },
    ],
    mannaSolution: [
      {
        title: "Multi-Item Bill of Materials (BOM)",
        description: "Define unlimited raw component recipes with configurable wastage percentages (e.g. 2.5% spillage tolerance during packaging).",
        modules: ["Assemblies & BOM", "Inventory Valuation", "General Ledger"],
      },
      {
        title: "One-Click Production Run Execution",
        description: "Executing a manufacturing order automatically deducts all raw ingredients and instantly credits finished stock at exact weighted unit cost.",
        modules: ["Production Execution", "Warehouse Bins", "Stock Ledger"],
      },
      {
        title: "Full Labor & Factory Overhead Allocation",
        description: "Factor direct wages and machine depreciation directly into finished goods cost, generating accurate GAAP/IFRS balance sheet assets.",
        modules: ["Cost Accounting", "GL Journal Entries", "P&L Reporting"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Configure Assembly Recipe (BOM)",
        action: "Define 500ml Sanitizer: 400ml Ethanol, 50ml Glycerin, 50ml Distilled Water, 1 Plastic Bottle, 1 Mist Cap + KES 6.50 Labor.",
        accountingImpact: "Recipe saved in master catalog; unit cost benchmarks established.",
      },
      {
        stepNumber: "02",
        title: "Execute Production Run",
        action: "Batch 1,000 units completed on factory floor. Click 'Execute Assembly Order' in MannaBooks.",
        accountingImpact: "Raw materials debited out of Raw Goods Inventory (1310); Finished Goods credited (1320).",
      },
      {
        stepNumber: "03",
        title: "Allocate Factory Overhead",
        action: "System appends direct labor estimate and batch electricity cost to inventory asset value.",
        accountingImpact: "Accrued Factory Wages credited; Finished Goods inventory value capitalized.",
      },
      {
        stepNumber: "04",
        title: "Commercial Dispatch & Invoicing",
        action: "Generate KRA eTIMS Tax Invoice and Delivery Note for distributor or supermarket chain.",
        accountingImpact: "Accounts Receivable debited; Revenue credited; COGS recognized at exact BOM cost.",
      },
    ],
    sampleLedger: [
      {
        stage: "Assembly Execution",
        debitAccount: "Finished Goods Inventory (1320)",
        creditAccount: "Raw Materials Inventory (1310)",
        amountKes: "85,000.00",
        explanation: "1,000 bottles produced; raw chemicals & plastic bottles deducted from stock.",
      },
      {
        stage: "Labor Capitalization",
        debitAccount: "Finished Goods Inventory (1320)",
        creditAccount: "Factory Wages Accrual (2150)",
        amountKes: "6,500.00",
        explanation: "Direct packaging labor allocated directly to finished unit asset value.",
      },
      {
        stage: "Commercial Sale",
        debitAccount: "Cost of Goods Sold (5000)",
        creditAccount: "Finished Goods Inventory (1320)",
        amountKes: "91,500.00",
        explanation: "Cost recognized immediately upon issuing customer invoice at KES 140,000.",
      },
    ],
    caseStudy: {
      clientName: "Apex Clean Solutions Ltd.",
      location: "Industrial Area, Nairobi",
      profile: "Manufacturer of commercial hygiene chemicals, hand sanitisers, and industrial liquid soaps.",
      challenge: "Lost KES 420,000 every quarter due to untracked chemical spillage and mispriced packaging bottles.",
      solutionApplied: "Configured 14 distinct BOM recipes in MannaBooks with 3% wastage thresholds and batch production logging.",
      measurableResults: [
        "18.4% improvement in gross margin visibility within 60 days",
        "Raw chemical stock discrepancy reduced to less than 0.8%",
        "100% compliant KRA eTIMS sales invoices generated directly from finished stock",
      ],
    },
    faqs: [
      {
        question: "Can MannaBooks handle multi-level assemblies (sub-assemblies)?",
        answer: "Yes. You can produce a intermediate mixture (e.g. Concentrated Base Compound) and use that base as an ingredient in multiple final packaged variants.",
      },
      {
        question: "Does the system support wastage and scrap percentage calculations?",
        answer: "Yes. Each BOM component allows an optional wastage tolerance percentage (e.g. 2% for cutting timber or evaporation of solvents), which is factored automatically into unit cost.",
      },
    ],
  },
  {
    slug: "holding-companies",
    tag: "CONGLOMERATES & MULTI-ENTITY",
    icon: "🏛️",
    heroTitle: "Unified Governance for Holding Companies & Multiple Entities",
    heroSubtitle: "Control multiple distinct businesses, subsidiaries, and corporate branches under one executive login with separate KRA PINs, isolated ledgers, and role-scoped permissions.",
    executiveSummary:
      "Built for enterprise founders, holding boards, and group managing directors running diverse business units (e.g. a transport fleet, a real estate firm, and an FMCG distributor) who require consolidated oversight without data commingling.",
    idealFor: [
      "Group holding companies managing multiple registered subsidiaries",
      "Family offices & private equity asset managers",
      "Entrepreneurs operating separate trading and service companies",
      "Corporate shared service centers with centralized finance teams",
    ],
    keyChallenges: [
      {
        title: "Commingled Bank Accounts & Tax Compliance Risks",
        description: "Operating multiple legal entities in one system often leads to mixed tax PIN records and disastrous KRA iTax audits.",
      },
      {
        title: "Lack of Consolidated Board Visibility",
        description: "Group executives must log into 5 different portals to know total group cash, aggregate receivables, and subsidiary burn rates.",
      },
      {
        title: "Rogue Spending & Lack of Approval Thresholds",
        description: "Subsidiary general managers committing company funds to unapproved suppliers without executive chairman authorization.",
      },
    ],
    mannaSolution: [
      {
        title: "One-Click Subsidiary Workspace Switcher",
        description: "Switch seamlessly between legal entities with isolated tax PINs, unique branding, separate bank accounts, and distinct invoice numbering sequences.",
        modules: ["Workspace Directory", "Multi-Tenant Architecture", "RBAC Engine"],
      },
      {
        title: "Multi-Tier Corporate Approval Governance",
        description: "Configure direct adjustment and spending limits per manager (e.g. KES 50,000 threshold). All expenditures above route directly to the Group MD.",
        modules: ["Corporate Approvals", "Audit Trail", "Role Presets"],
      },
      {
        title: "Commercial Cost Privacy (Role Scoping)",
        description: "Enforce cost-price blindness across subsidiary storekeepers and counter clerks, ensuring internal wholesale margins remain private.",
        modules: ["Commercial Privacy", "User Governance", "Branch Scoping"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Provision Subsidiary Workspaces",
        action: "Set up Entity 1 (Logistics Ltd - PIN P0512...), Entity 2 (Properties Ltd - PIN P0513...), and Entity 3 (Wholesale Ltd).",
        accountingImpact: "Independent General Ledgers, Chart of Accounts, and tax registries created.",
      },
      {
        stepNumber: "02",
        title: "Delegate Role-Scoped Access",
        action: "Assign Subsidiary MD as 'MANAGER' with KES 100,000 approval limit; assign Depot Clerk with 'STOREKEEPER' role and Cost-Price Blindness.",
        accountingImpact: "Zero risk of unauthorized balance sheet edits or confidential vendor price leakage.",
      },
      {
        stepNumber: "03",
        title: "Automated Approval Escalation",
        action: "Depot Manager creates vendor bill for KES 180,000. System automatically queues it in Group Executive approval tray.",
        accountingImpact: "Liability remains in 'PENDING_APPROVAL' status until Group MD signs off digitally.",
      },
      {
        stepNumber: "04",
        title: "Executive Group Financial Review",
        action: "Group CFO exports Trial Balance, P&L, and Balance Sheet for each entity, then reviews consolidated performance.",
        accountingImpact: "Clean statutory accounts ready for statutory auditor sign-off and KRA annual corporate returns.",
      },
    ],
    sampleLedger: [
      {
        stage: "Inter-Company Service Billing",
        debitAccount: "Due from Subsidiary B (1180 - Entity A)",
        creditAccount: "Management Fee Revenue (4200 - Entity A)",
        amountKes: "250,000.00",
        explanation: "Entity A bills Entity B for shared HQ accounting and executive management services.",
      },
      {
        stage: "Subsidiary Expense Recognition",
        debitAccount: "Management Fee Expense (5800 - Entity B)",
        creditAccount: "Due to Parent Entity A (2180 - Entity B)",
        amountKes: "250,000.00",
        explanation: "Entity B records corresponding allowable tax deduction under KRA guidelines.",
      },
    ],
    caseStudy: {
      clientName: "Kilima Capital Group",
      location: "Upper Hill, Nairobi",
      profile: "Diversified investment holding company with 3 operating subsidiaries across transport, real estate, and hardware retail.",
      challenge: "Lost 10 working days every month trying to reconcile inter-company transactions and catch unapproved branch payments.",
      solutionApplied: "Deployed MannaBooks Multi-Workspace Directory with centralized executive ownership and strict KES 50k manager approval caps.",
      measurableResults: [
        "100% elimination of commingled accounting entries across subsidiaries",
        "Month-end financial close accelerated from 14 days down to 2 days",
        "Audit preparation costs reduced by 40% with clean per-entity general ledgers",
      ],
    },
    faqs: [
      {
        question: "Can an executive use one email login to access all subsidiaries?",
        answer: "Yes. Your user account acts as a single sign-on key. The Organization Directory allows you to switch between subsidiaries in one click.",
      },
      {
        question: "Can our accountants see all subsidiaries while branch managers only see their own?",
        answer: "Yes. Role allocation is workspace-specific. A team member can be an ACCOUNTANT in Subsidiary A and have zero access to Subsidiary B.",
      },
    ],
  },
  {
    slug: "tech-integrators",
    tag: "TECH RESELLERS & VALUE-ADDED INTEGRATORS",
    icon: "💻",
    heroTitle: "On-Demand Hardware Procurement & Project Setup Management",
    heroSubtitle: "Execute back-to-back hardware sales, client quotes, delivery dispatches, and technical setup retainers with zero tied-up inventory capital.",
    executiveSummary:
      "Specially tailored for IT equipment distributors, computer repair shops, network installers, and software integrators who procure hardware from primary distributors only when a client commits.",
    idealFor: [
      "Computer & laptop dealers / corporate resellers",
      "Network infrastructure & CCTV installers",
      "Office printer, server & tech hardware leasing firms",
      "IT support agencies combining equipment with SLA retainers",
    ],
    keyChallenges: [
      {
        title: "Capital Lockup & Technology Depreciation",
        description: "Holding KES 5,000,000 in laptops on shelves leads to catastrophic losses as newer processors and models release quarterly.",
      },
      {
        title: "Untracked Outsourced Labor & Subcontractor Costs",
        description: "Hiring third-party technicians for on-site cabling without tracking costs erodes client quote profitability.",
      },
      {
        title: "Lost Warranty & Device Serial Number Lineage",
        description: "Failing to record laptop serial numbers prevents matching returned client machines against distributor warranty invoices.",
      },
    ],
    mannaSolution: [
      {
        title: "Zero-Stock Back-to-Back Procurement Flow",
        description: "Convert customer Quotations directly into Tax Invoices. Procure units from distributors on-demand with automated margin tracking.",
        modules: ["Quotations", "Invoicing", "Vendor Bills"],
      },
      {
        title: "Integrated Project Milestone Billing",
        description: "Bundle hardware supply with on-site deployment labor. Bill in structured milestones (e.g. 50% deposit, 30% hardware delivery, 20% setup signoff).",
        modules: ["Projects", "Milestone Invoicing", "Timesheets"],
      },
      {
        title: "Line-Item Serial Number & Delivery Notes",
        description: "Embed hardware serial numbers (`S/N`) directly into invoice and delivery slip line items for foolproof warranty verification.",
        modules: ["Delivery Notes", "Line Item Notes", "Document Search"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Issue Client Quotation",
        action: "Send Quotation for 10x Core i7 Workstations @ KES 75,000 + Network Setup @ KES 60,000 (Total KES 810,000).",
        accountingImpact: "Quotation created in MannaBooks; zero GL impact until client confirms.",
      },
      {
        stepNumber: "02",
        title: "Client Approves & Pays Deposit",
        action: "Convert Quote to Tax Invoice with 1-click. Client transfers 60% deposit (KES 486,000). Issue Official Receipt.",
        accountingImpact: "Bank debited KES 486,000; Accounts Receivable & Customer Deposit ledger credited.",
      },
      {
        stepNumber: "03",
        title: "Procure Hardware from Distributor",
        action: "Issue LPO to Distributor for 10 units @ KES 55,000 (KES 550,000). Record Vendor Bill with distributor invoice.",
        accountingImpact: "Accounts Payable credited KES 550,000; Cost of Goods Sold capitalized.",
      },
      {
        stepNumber: "04",
        title: "Dispatch, Delivery Note & Setup Signoff",
        action: "Generate Delivery Note with all 10 device serial numbers. Field tech logs 12 hours setup. Final invoice balance settled.",
        accountingImpact: "Net cash realized: +KES 200,000 hardware margin + KES 60,000 service profit.",
      },
    ],
    sampleLedger: [
      {
        stage: "Customer Revenue",
        debitAccount: "Cash / Bank Asset (1000)",
        creditAccount: "Hardware Sales Revenue (4000)",
        amountKes: "750,000.00",
        explanation: "10 Workstations billed to client @ KES 75,000 each.",
      },
      {
        stage: "Distributor Procurement",
        debitAccount: "Cost of Goods Sold - Hardware (5000)",
        creditAccount: "Accounts Payable - Distributor (2000)",
        amountKes: "550,000.00",
        explanation: "Units procured from Company B @ KES 55,000 each.",
      },
      {
        stage: "On-Site Installation Labor",
        debitAccount: "Cash / Bank Asset (1000)",
        creditAccount: "Technical Services Revenue (4100)",
        amountKes: "60,000.00",
        explanation: "Setup fee billed; gross profit on overall engagement = KES 260,000.",
      },
    ],
    caseStudy: {
      clientName: "Mbogo Tech Systems Ltd.",
      location: "Westlands, Nairobi",
      profile: "Corporate IT systems integrator supplying commercial office computers, networking, and SLA maintenance.",
      challenge: "Tied up KES 3.2M in warehouse laptops that plummeted in market value, while struggling to track serial numbers for client warranty repairs.",
      solutionApplied: "Transitioned to MannaBooks Zero-Stock pass-through workflow, quoting clients before issuing distributor LPOs and embedding serial numbers in delivery notes.",
      measurableResults: [
        "100% elimination of dead stock inventory write-downs",
        "Operating cash flow boosted by KES 2,800,000 within 90 days",
        "Warranty claim processing time dropped from 3 days to 4 minutes",
      ],
    },
    faqs: [
      {
        question: "Do I have to enable inventory tracking for computer hardware?",
        answer: "No. You can leave 'Track Inventory' turned OFF in the product catalog. MannaBooks allows pure pass-through billing with full profit margin calculation.",
      },
      {
        question: "Can I print a Delivery Note for the client without showing purchase costs?",
        answer: "Yes. Delivery Notes generated from Tax Invoices display quantities and item descriptions for signoff, cleanly omitting supplier buying costs.",
      },
    ],
  },
  {
    slug: "fmcg-distribution",
    tag: "FMCG, PHARMA & PERISHABLES",
    icon: "📦",
    heroTitle: "FEFO Expiry Risk Control & Sub-Location Bin Architecture",
    heroSubtitle: "Eliminate spoiled inventory write-offs with automated First-Expired, First-Out picking, precise warehouse bin coordinates, and fast stocktake reconciliation.",
    executiveSummary:
      "Built for pharmaceutical importers, food & beverage distributors, and cold-chain FMCG suppliers who must track batch numbers, regulatory expiration dates, and multi-tier warehouse pallet coordinates.",
    idealFor: [
      "Pharmaceutical distributors & medical supply depots",
      "FMCG food, beverage, and dairy wholesalers",
      "Agricultural input, seed, and fertilizer suppliers",
      "Cosmetics and skincare product distributors",
    ],
    keyChallenges: [
      {
        title: "Expired Inventory Write-Offs",
        description: "Warehouse workers dispatch newly arrived stock while older inventory sits in rear racks, expiring silently and destroying profit.",
      },
      {
        title: "Disorganized Warehouse Layouts",
        description: "Staff spend 45 minutes searching for high-turnover items without clear aisle, rack, and bin coordinates.",
      },
      {
        title: "Exhausting 3-Day Physical Stocktakes",
        description: "Shutting down warehouse operations for days to count inventory manually on paper clipboards with frequent math errors.",
      },
    ],
    mannaSolution: [
      {
        title: "FEFO (First-Expired, First-Out) Engine",
        description: "MannaBooks tracks Lot Numbers and Expiry Dates per batch, surfacing near-expiry alerts and automatically recommending oldest batches for dispatch.",
        modules: ["Batch & Lot Tracking", "Expiry Risk Matrix", "WMS Engine"],
      },
      {
        title: "Granular Sub-Location Bin Architecture",
        description: "Organize warehouses into structured `Aisle - Rack - Shelf - Bin` coordinates. Generate picking lists showing exact item coordinates.",
        modules: ["Warehouse Bins", "Stock Transfers", "Location Manager"],
      },
      {
        title: "Physical Stocktake Audit Wizard",
        description: "Perform blind counts or open audits on tablets. MannaBooks calculates book-vs-physical variances and posts automated adjustment journals.",
        modules: ["Stocktake Wizard", "Variance Ledgers", "Audit Trails"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Receive Goods with Batch & Expiry",
        action: "Receive 500 packs of Antibiotic Suspension; assign Lot #MED-940, Expiry: 2027-06-30 to Bin `A02-R04-S01`.",
        accountingImpact: "Stock ledger credited; batch lineage permanently timestamped.",
      },
      {
        stepNumber: "02",
        title: "Automated Expiry Risk Monitoring",
        action: "Expiry dashboard monitors aging stock, tagging batches into Green (>90d), Amber (30-90d), and Red Critical (<30d).",
        accountingImpact: "Zero risk of distributing expired drugs; proactive clearance discounts enabled.",
      },
      {
        stepNumber: "03",
        title: "FEFO Dispatch Order",
        action: "Pharmacy orders 100 packs. MannaBooks picks oldest valid Lot #MED-940 rather than newly received Lot #MED-980.",
        accountingImpact: "Oldest batch consumed first; stock shrinkage prevented.",
      },
      {
        stepNumber: "04",
        title: "Cycle Count Audit Wizard",
        action: "Auditor counts physical stock on shelf. Enters count into Stocktake Wizard; system automatically posts minor discrepancy journal.",
        accountingImpact: "Variance immediately reconciled; book balance matches physical shelf count.",
      },
    ],
    sampleLedger: [
      {
        stage: "Inventory Receipt",
        debitAccount: "Merchandise Inventory - Pharma (1300)",
        creditAccount: "Accounts Payable - Manufacturer (2000)",
        amountKes: "450,000.00",
        explanation: "500 units received with Batch Lot #MED-940 assigned to Bin A02-R04.",
      },
      {
        stage: "Stocktake Audit Variance",
        debitAccount: "Inventory Shrinkage Expense (5400)",
        creditAccount: "Merchandise Inventory - Pharma (1300)",
        amountKes: "1,800.00",
        explanation: "2 damaged bottles written off during physical count audit.",
      },
    ],
    caseStudy: {
      clientName: "Savanna MedSupplies Ltd.",
      location: "Industrial Area, Nairobi",
      profile: "Regional distributor of clinical pharmaceuticals, test kits, and nutritional supplements.",
      challenge: "Wrote off KES 1,850,000 annually due to expired medication discovered at the back of warehouse shelves.",
      solutionApplied: "Implemented MannaBooks FEFO batch tracking and mapped their 400m² warehouse into aisle-rack-shelf bin coordinates.",
      measurableResults: [
        "89% reduction in expired stock write-offs in the first financial year",
        "Order picking speed increased by 3.5x using bin coordinate pick slips",
        "Stocktake audit time cut from 3 full shutdown days to 4 hours on Saturday",
      ],
    },
    faqs: [
      {
        question: "Can I receive the same product with multiple different expiry dates?",
        answer: "Yes. Each batch intake creates an isolated lot record with its own expiry date, quantity, and assigned warehouse bin location.",
      },
      {
        question: "Does MannaBooks block sales of expired items?",
        answer: "Yes. The FEFO engine warns operators if an item's expiration date has passed and prevents accidental invoicing of expired medical or food lots.",
      },
    ],
  },
  {
    slug: "professional-services",
    tag: "CONSULTING, LAW & CORPORATE SERVICES",
    icon: "⚖️",
    heroTitle: "Time, Retainers & Milestone Billing for Service Firms",
    heroSubtitle: "Capture every billable hour, manage monthly retainer SLA burndowns, and convert approved timesheets directly into professional client invoices.",
    executiveSummary:
      "Designed for law firms, management consultants, engineering practices, and audit agencies that operate on billable brainpower with zero physical inventory.",
    idealFor: [
      "Law chambers & legal advocates",
      "Management & financial consultancies",
      "Architecture, civil & engineering consultancies",
      "Software development & creative digital agencies",
      "SACCOs, wealth managers & microfinance institutions",
    ],
    keyChallenges: [
      {
        title: "Leaked Unbilled Hours",
        description: "Senior associates spend hours on client briefs without logging them, causing tens of thousands of shillings in unbilled revenue each week.",
      },
      {
        title: "Retainer Scope Creep",
        description: "Clients on monthly retainers consume 30 hours of work instead of their agreed 15 hours without paying for excess time.",
      },
      {
        title: "Manual Invoice Preparation Friction",
        description: "Finance teams spending 4 days every month compiling paper timesheets into client invoices.",
      },
    ],
    mannaSolution: [
      {
        title: "Retainer SLA Burndown Ledgers",
        description: "Track monthly retained contract hours. MannaBooks automatically burns down allocated hours and flags over-budget scope creep.",
        modules: ["Contracts & Retainers", "CRM Pipeline", "Alerts"],
      },
      {
        title: "Role-Based Billable Timesheet Queues",
        description: "Staff log daily task hours. Project managers review, approve, or reject entries before they ever hit a client bill.",
        modules: ["Timesheets", "Staff Directory", "Approvals"],
      },
      {
        title: "1-Click Time & Materials Invoicing",
        description: "Select approved billable timesheets and click 'Generate Invoice'. MannaBooks instantly formats an itemized Tax Invoice.",
        modules: ["Invoice Generator", "Client Statements", "GL Journal"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Set Up Client Retainer Contract",
        action: "Execute KES 150,000/month Retainer Contract providing 20 billable partner hours + KES 6,000/hr excess rate.",
        accountingImpact: "Contract active; automated monthly recurring billing scheduled.",
      },
      {
        stepNumber: "02",
        title: "Staff Log Daily Timesheets",
        action: "Legal Associate logs 3.5 hours on 'Commercial Lease Review'. System tags rate at KES 6,000/hr = KES 21,000.",
        accountingImpact: "Draft timesheet queued for Partner review; zero client billing until approved.",
      },
      {
        stepNumber: "03",
        title: "Partner Approval & Scope Burndown",
        action: "Partner approves hours. System burns down 3.5h from the client's 20h monthly allowance.",
        accountingImpact: "Real-time client burndown updated; client notified of remaining 16.5 hours.",
      },
      {
        stepNumber: "04",
        title: "Over-Scope Automatic Billing",
        action: "Client logs 24 hours (4 hours excess). 1-click invoice generates for KES 24,000 excess hours on top of retainer.",
        accountingImpact: "Zero leaked revenue; Accounts Receivable debited; Professional Fees credited.",
      },
    ],
    sampleLedger: [
      {
        stage: "Monthly Retainer Invoice",
        debitAccount: "Accounts Receivable - Client (1100)",
        creditAccount: "Retainer Advisory Revenue (4100)",
        amountKes: "150,000.00",
        explanation: "Monthly retainer invoice generated on 1st of the month.",
      },
      {
        stage: "Excess Hours Billing",
        debitAccount: "Accounts Receivable - Client (1100)",
        creditAccount: "Excess Professional Fees (4150)",
        amountKes: "24,000.00",
        explanation: "4 hours logged beyond agreed 20-hour monthly contract allowance.",
      },
    ],
    caseStudy: {
      clientName: "Ondiek & Partners Advocates",
      location: "Community Area, Nairobi",
      profile: "Boutique corporate commercial law firm specializing in banking conveyancing and litigation.",
      challenge: "Lost an estimated KES 2.4M annually because litigation associates failed to log billable court prep and client consultation time.",
      solutionApplied: "Adopted MannaBooks Timesheets and Retainer Contracts with daily mobile hour logging and automated monthly client invoices.",
      measurableResults: [
        "28% increase in captured billable client hours in the first quarter",
        "Retainer overage recovery brought in an extra KES 340,000 monthly",
        "Billing compilation time reduced from 5 days to 15 minutes",
      ],
    },
    faqs: [
      {
        question: "Can different staff members have different billable hourly rates?",
        answer: "Yes. You can assign custom billable rates per person (e.g. Partner: KES 15,000/hr, Senior Associate: KES 8,000/hr, Junior: KES 4,000/hr).",
      },
      {
        question: "Does MannaBooks support non-billable hours tracking for internal work?",
        answer: "Yes. Team members can mark timesheets as non-billable (e.g., internal training or firm administration), allowing full resource utilization reporting.",
      },
    ],
  },
  {
    slug: "retail-chains",
    tag: "RETAIL CHAINS & HARDWARE STORES",
    icon: "🏪",
    heroTitle: "Multi-Branch Retail Operations & Walk-In POS Speed",
    heroSubtitle: "Manage high-speed walk-in counter sales, inter-branch stock dispatches, cashier till reconciliation, and wholesale cost privacy.",
    executiveSummary:
      "Engineered for retail chains, supermarkets, hardware depots, and wholesale counters requiring ultra-fast walk-in POS terminals, cash reconciliation, and branch stock isolation.",
    idealFor: [
      "Multi-branch retail supermarkets & convenience stores",
      "Building material & hardware supply depots",
      "Automotive spare parts & tyre dealers",
      "Clothing boutiques & electronics retail outlets",
    ],
    keyChallenges: [
      {
        title: "Slow Counter Checkout Queues",
        description: "Counter systems that require 6 steps to bill a walk-in client create frustrating queues and lost sales.",
      },
      {
        title: "Stock Loss During Branch Transfers",
        description: "Goods dispatched from main industrial warehouse go missing in transit before arriving at retail mall counters.",
      },
      {
        title: "Staff Seeing Supplier Cost Prices",
        description: "Counter cashiers and storekeepers seeing purchase costs and leaking sensitive business margins to competitors.",
      },
    ],
    mannaSolution: [
      {
        title: "Fast-Action Walk-In POS Terminal",
        description: "Instant barcode product search, automatic change calculations, integrated M-Pesa transaction logging, and thermal receipt printing.",
        modules: ["Walk-In POS", "Cash Registers", "Receipts"],
      },
      {
        title: "Two-Step Stock Transfers (In-Transit Protection)",
        description: "Dispatched goods move into 'IN_TRANSIT' status and only enter the destination ledger once physically verified and received.",
        modules: ["Stock Transfers", "Transfer Notes", "Audit Trails"],
      },
      {
        title: "Role-Scoped Commercial Privacy",
        description: "Toggle 'Hide Cost Prices' to blind counter operators to supplier buying rates while letting them sell at approved retail prices.",
        modules: ["Commercial Privacy", "Branch Scoping", "RBAC Engine"],
      },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Dispatch from Central Warehouse",
        action: "Central depot dispatches 50x Power Drills to Westlands Branch. Transfer moves to 'IN_TRANSIT'.",
        accountingImpact: "Stock deducted from Central depot; held in transit ledger.",
      },
      {
        stepNumber: "02",
        title: "Receive & Verify at Retail Counter",
        action: "Westlands manager counts 50 units and clicks 'Confirm Receipt'. Units available for sale immediately.",
        accountingImpact: "Stock credited to Westlands branch inventory ledger.",
      },
      {
        stepNumber: "03",
        title: "Walk-In Counter Sale",
        action: "Cashier scans drill (KES 8,500), customer pays via M-Pesa (Ref: QBH8291X). Receipt prints in 2 seconds.",
        accountingImpact: "Branch inventory auto-deducted -1; Cash/M-Pesa debited; Sales Revenue credited.",
      },
      {
        stepNumber: "04",
        title: "Daily Till Settlement",
        action: "Branch closes register; system compares physical cash + M-Pesa statements against recorded transactions.",
        accountingImpact: "Zero till variance; daily revenue journal automatically reconciled.",
      },
    ],
    sampleLedger: [
      {
        stage: "POS Retail Sale",
        debitAccount: "M-Pesa Till Account (1010)",
        creditAccount: "Retail Sales Revenue (4000)",
        amountKes: "8,500.00",
        explanation: "Power Drill sold at Westlands branch walk-in counter.",
      },
      {
        stage: "Cost of Sale Recognition",
        debitAccount: "Cost of Goods Sold (5000)",
        creditAccount: "Branch Inventory - Westlands (1301)",
        amountKes: "5,800.00",
        explanation: "1 unit deducted from branch stock at standard cost.",
      },
    ],
    caseStudy: {
      clientName: "Nairobi Hardware & Tools Hub",
      location: "CBD & Industrial Area, Nairobi",
      profile: "Wholesale and retail distributor of industrial power tools, safety equipment, and building materials across 3 branches.",
      challenge: "Lost KES 650,000 over 6 months during branch replenishment, and counter clerks frequently argued with customers over prices.",
      solutionApplied: "Standardized on MannaBooks POS terminals with Two-Step Stock Transfers and Cost-Price Blindness for all 18 counter cashiers.",
      measurableResults: [
        "100% elimination of transit stock leakage between depot and retail shops",
        "Counter transaction speed accelerated by 60% with instant M-Pesa ref capture",
        "Total commercial privacy preserved; zero staff awareness of wholesale margins",
      ],
    },
    faqs: [
      {
        question: "Can cashiers see our supplier buying prices?",
        answer: "No. With MannaBooks 'Cost-Price Blindness' enabled, cashiers and storekeepers only see the retail selling price and stock on hand.",
      },
      {
        question: "What happens if a branch receives fewer items than were dispatched?",
        answer: "The receiving manager enters the actual quantity received (e.g. 48 of 50). MannaBooks records the 2 missing items in a transit variance log for management investigation.",
      },
    ],
  },
];
