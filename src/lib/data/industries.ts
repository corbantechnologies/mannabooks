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
  costCenters?: {
    code: string;
    department: string;
    absorbedExpenses: string;
  }[];
  sublocations?: {
    code: string;
    zoneName: string;
    binCoordinates: string;
    functionPurpose: string;
  }[];
  staffHierarchy?: {
    role: string;
    systemPreset: string;
    operationalScope: string;
    privacySetting: string;
  }[];
}

export const INDUSTRIES_DATA: IndustryDetail[] = [
  {
    slug: "manufacturing-production",
    tag: "MANUFACTURING & ASSEMBLIES",
    icon: "⚙️",
    heroTitle: "Precision Bill of Materials, Cost Centers & Plant WMS for Manufacturers",
    heroSubtitle: "Transform bulk raw materials into high-margin finished products with multi-stage WIP assemblies, departmental cost centers, sub-location bin tracking, and commercial cost-price blindness.",
    executiveSummary:
      "Engineered specifically for mid-sized and enterprise manufacturers—ranging from chemical and paint blenders to food processors, pharmaceutical packagers, and metal fabricators—who need full factory governance. MannaBooks unites departmental cost centers, role-scoped floor staff, multi-bin warehouse sublocations, and exact GAAP/IFRS work-in-progress ledgers without the multi-million shilling bloat of legacy ERPs.",
    idealFor: [
      "Chemical, paint, resin & lubricant blenders",
      "Commercial bakeries, confectioneries & food packaging plants",
      "Steel, sheet metal, and architectural fabricators",
      "Bottled water, beverage, and dairy bottling plants",
      "Cosmetics, detergents & industrial hygiene formulators",
      "Pharmaceutical repackagers & medical consumable plants",
    ],
    keyChallenges: [
      {
        title: "Recipe Costing & Yield Variance Blindness",
        description: "Small shifts in bulk solvent, resin, or sugar prices silently erode margins when finished pack prices remain static, while chemical evaporation and trim scrap go unmeasured.",
      },
      {
        title: "Untracked Factory Overhead & Machine Depreciation",
        description: "Focusing solely on raw ingredients ignores boiler power, line technician wages, and machine depreciation, generating artificial profitability numbers that mislead directors.",
      },
      {
        title: "Warehouse Disorganization & Raw Material Shrinkage",
        description: "Bulk raw drums and packaging containers stored without bin coordinates create ghost inventory, delayed production runs, and painful stocktake discrepancies.",
      },
      {
        title: "Commercial Margin Leakage & Inter-Depot Transit Theft",
        description: "Storekeepers seeing supplier buying costs leak wholesale pricing terms to competitors, while goods dispatched to coastal regional depots go missing in transit.",
      },
    ],
    mannaSolution: [
      {
        title: "Departmental Cost Centers & Expense Absorption",
        description: "Tag factory expenses to specific departments (Mixing, Bottling, Lab, Maintenance) and capitalize direct labor and machinery power directly into WIP inventory asset valuation.",
        modules: ["Cost Accounting", "General Ledger", "P&L Reporting"],
      },
      {
        title: "Sub-Location Bin WMS Architecture",
        description: "Map plant floors into specialized zones (Raw Silos, Chemical Vault, WIP Staging, Finished High-Bay) with precise Aisle-Rack-Shelf-Bin picking coordinates and cycle count audits.",
        modules: ["Warehouse Bins", "Stock Transfers", "Stocktake Wizard"],
      },
      {
        title: "Multi-Stage Bill of Materials (BOM) & Scrap Tolerance",
        description: "Define multi-level assembly formulas with configurable wastage allowances (e.g. 2.5% mixing dissipation). Executing a batch automatically moves raw stock into WIP and then into Finished Goods.",
        modules: ["Assemblies & BOM", "Inventory Valuation", "Production Runs"],
      },
      {
        title: "Role-Scoped Operational Scoping & Cost Blindness",
        description: "Toggle Cost-Price Blindness for storekeepers and line cashiers, preventing supplier margin leakage, while enforcing executive approval caps on supervisor purchase orders.",
        modules: ["Commercial Privacy", "User Governance", "Approval Caps"],
      },
    ],
    costCenters: [
      { code: "CC-101", department: "Bulk Chemical Mixing & Reaction", absorbedExpenses: "Industrial 3-phase power, boiler diesel, reaction catalysts, mixing vat maintenance" },
      { code: "CC-102", department: "High-Speed Bottling & Packaging", absorbedExpenses: "Line technician wages, induction sealer maintenance, outer carton packaging" },
      { code: "CC-103", department: "Quality Assurance & Testing Lab", absorbedExpenses: "Laboratory reagents, batch retention samples, viscosity testing, calibration" },
      { code: "CC-104", department: "Plant Utilities & Mechanical Maintenance", absorbedExpenses: "Compressor servicing, replacement bearings, boiler water treatment, lubricating oils" },
      { code: "CC-105", department: "Central Dispatch & Regional Logistics", absorbedExpenses: "Forklift diesel, haulier truck freight to coastal depots, driver allowances" },
      { code: "CC-106", department: "Plant Administration & Safety", absorbedExpenses: "NEMA environmental licenses, OSHA fire inspections, factory safety equipment" },
    ],
    sublocations: [
      { code: "WH-01-RAW", zoneName: "Raw Materials Silos & Bulk Tanks", binCoordinates: "Silos 1-4 & Tank Bay A", functionPurpose: "Bulk polymer resins, base oils, and 10,000L raw liquid chemicals" },
      { code: "WH-01-VAULT", zoneName: "Solvent & Hazardous Vault", binCoordinates: "Aisle 01, Racks 01-04", functionPurpose: "200L flammable chemical drums, volatile pigments, and additives" },
      { code: "WH-01-PACK", zoneName: "Packaging & Container Storage", binCoordinates: "Aisle 02, Racks 01-06", functionPurpose: "5L jerrycans, caps, foil seals, labels, and corrugated outer cartons" },
      { code: "WH-01-WIP", zoneName: "WIP Assembly Floor (Tanks 1-4)", binCoordinates: "Floor Staging Bays 1-4", functionPurpose: "Active blending reaction tanks undergoing temperature curing & testing" },
      { code: "WH-01-FIN", zoneName: "Finished Goods High-Bay Pallet Racks", binCoordinates: "High-Bay A01-A12", functionPurpose: "Palletized finished stock tagged with batch lots, barcodes, and expiry dates" },
      { code: "WH-02-MSA", zoneName: "Mombasa Regional Port Depot", binCoordinates: "Coastal Depot Bay 1-3", functionPurpose: "Regional hub receiving inter-depot stock via Two-Step Transfers (IN_TRANSIT)" },
    ],
    staffHierarchy: [
      { role: "Plant Operations Director", systemPreset: "MANAGER / ADMIN", operationalScope: "Full plant oversight, approval ceiling of KES 250,000 on purchase bills and scrap adjustments", privacySetting: "Full Financial Access" },
      { role: "Chief Production Chemist", systemPreset: "STOREKEEPER / MANAGER", operationalScope: "Formulates BOM recipes, initiates production runs, logs batch yields and spillage tolerances", privacySetting: "Cost-Price Blindness Active" },
      { role: "Raw Materials Storekeeper", systemPreset: "STOREKEEPER", operationalScope: "Inbound PO receiving, GRN generation, raw bin stocking in Chemical Vault", privacySetting: "Cost-Price Blindness Active" },
      { role: "Quality Control Inspector", systemPreset: "VIEWER / STOREKEEPER", operationalScope: "Batch quarantine inspection, lab sign-off, releases WIP to Finished Goods high-bay", privacySetting: "Cost-Price Blindness Active" },
      { role: "Finished Goods Dispatcher", systemPreset: "DISPATCHER", operationalScope: "Generates Delivery Notes, assigns driver manifests, tracks in-transit cargo to regional depots", privacySetting: "Cost-Price Blindness Active" },
      { role: "Factory Cost Accountant", systemPreset: "ACCOUNTANT", operationalScope: "WIP balance reconciliations, labor accruals, standard vs actual variance analysis, tax filings", privacySetting: "Full Financial Access" },
    ],
    workflowSteps: [
      {
        stepNumber: "01",
        title: "Inbound PO Receiving to Sub-Location Bins",
        action: "Storekeeper scans supplier PO for 20x 200L chemical drums. System generates GRN and logs items to Sub-location CHEM-VAULT (Bin A02-R01) with Cost-Price Blindness enabled.",
        accountingImpact: "Accounts Payable credited; Raw Materials Inventory (1310) debited.",
      },
      {
        stepNumber: "02",
        title: "Requisition to WIP Staging Floor",
        action: "Chief Chemist creates Production Run #PR-840. System requisitions 400L solvent and 1,000kg polymer into Sub-location WIP-STAGE with 2.5% scrap tolerance.",
        accountingImpact: "Raw Materials (1310) credited; Work-In-Progress (1315) debited.",
      },
      {
        stepNumber: "03",
        title: "Labor & Overhead Capitalization",
        action: "Batch passes mixing and bottling into 200x 5L Jerrycans. MannaBooks appends direct packaging labor (CC-102: KES 12,000) and power (CC-101: KES 4,500) into WIP.",
        accountingImpact: "Accrued Factory Wages (2150) and Utilities (2160) credited; WIP capitalized.",
      },
      {
        stepNumber: "04",
        title: "QA Clearance & Finished Goods Transfer",
        action: "QA lab confirms batch viscosity and SG. Batch released to Sub-location FIN-HIGHBAY. Ready for KRA eTIMS customer invoice or Two-Step transfer to Mombasa Depot.",
        accountingImpact: "WIP (1315) cleared; Finished Goods (1320) debited at exact KES 825/unit cost.",
      },
    ],
    sampleLedger: [
      {
        stage: "Raw Materials Receipt",
        debitAccount: "Raw Materials Inventory (1310)",
        creditAccount: "Accounts Payable - Chemical Vendor (2000)",
        amountKes: "148,500.00",
        explanation: "Inbound PO received at CHEM-VAULT bin; verified by storekeeper with cost blindness.",
      },
      {
        stage: "Issuance to Production Floor",
        debitAccount: "Work-In-Progress Inventory (1315)",
        creditAccount: "Raw Materials Inventory (1310)",
        amountKes: "148,500.00",
        explanation: "Raw solvents and polymers transferred to WIP-STAGE floor for mixing.",
      },
      {
        stage: "Direct Labor Capitalization",
        debitAccount: "Work-In-Progress Inventory (1315)",
        creditAccount: "Accrued Factory Wages - CC-102 (2150)",
        amountKes: "12,000.00",
        explanation: "Direct bottling technician wages allocated directly to batch asset value.",
      },
      {
        stage: "Factory Overhead Absorption",
        debitAccount: "Work-In-Progress Inventory (1315)",
        creditAccount: "Accrued Factory Power - CC-101 (2160)",
        amountKes: "4,500.00",
        explanation: "3-phase mixing power absorbed into WIP inventory asset valuation.",
      },
      {
        stage: "QA Clearance to Finished Stock",
        debitAccount: "Finished Goods Inventory (1320)",
        creditAccount: "Work-In-Progress Inventory (1315)",
        amountKes: "165,000.00",
        explanation: "200x 5L Jerrycans capitalized onto balance sheet at exact unit cost of KES 825.",
      },
      {
        stage: "Commercial Dispatch & eTIMS Sale",
        debitAccount: "Cost of Goods Sold (5000)",
        creditAccount: "Finished Goods Inventory (1320)",
        amountKes: "165,000.00",
        explanation: "Cost recognized upon issuing customer invoice at KES 290,000 (KES 125,000 gross margin).",
      },
    ],
    caseStudy: {
      clientName: "Kipevu Industrial Coatings & Lubricants Ltd.",
      location: "Industrial Area, Nairobi",
      profile: "Manufacturer of automotive motor oils, industrial resins, and commercial anti-corrosive coatings.",
      challenge: "Lost KES 780,000 per quarter due to unallocated mixing power, storekeepers leaking supplier costs, and cargo going missing during truck dispatches to Mombasa.",
      solutionApplied: "Standardized on MannaBooks 6 Cost Centers, Sub-Location Bin WMS, Cost-Price Blindness, and Two-Step Inter-Depot Transfers.",
      measurableResults: [
        "100% elimination of transit stock leakage between Nairobi plant and Mombasa depot",
        "Cost-per-liter accuracy improved by 22% by capitalizing direct line labor and utilities",
        "Complete confidentiality of chemical supplier purchasing contracts across 40 plant staff",
      ],
    },
    faqs: [
      {
        question: "Can MannaBooks track work-in-progress (WIP) across multiple production stages?",
        answer: "Yes. Raw materials move from Raw Storage into Work-In-Progress (WIP) staging. While in WIP, labor and overhead cost centers are appended until the batch is cleared into Finished Goods.",
      },
      {
        question: "Can storekeepers receive raw materials without seeing our supplier buying prices?",
        answer: "Yes. By activating 'Cost-Price Blindness', storekeepers and machine operators can verify quantities and transfer drums between warehouse bins without seeing unit costs or vendor margins.",
      },
      {
        question: "How does MannaBooks protect stock moving between the main plant and regional depots?",
        answer: "MannaBooks uses Two-Step Stock Transfers. Dispatched cargo stays in 'IN_TRANSIT' status and only joins the destination branch inventory once physically counted and confirmed by the receiving manager.",
      },
      {
        question: "Does the system support scrap and evaporation tolerances?",
        answer: "Yes. You can specify a percentage yield variance (e.g. 2.5% solvent evaporation during mixing). The unit cost is automatically calibrated to absorb the scrap loss within IFRS guidelines.",
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
