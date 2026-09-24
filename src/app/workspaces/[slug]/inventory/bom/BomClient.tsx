"use client";

import React, { useState, useTransition } from "react";
import {
  Boxes,
  Plus,
  Play,
  Layers,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Trash2,
  ArrowRight,
  TrendingUp,
  Cpu,
  Package,
} from "lucide-react";
import { createBillOfMaterialsAction, runProductionOrderAction } from "@/lib/actions/production";
import { useRouter } from "next/navigation";

interface BomItem {
  id: string;
  rawMaterialProductId: string;
  quantityRequired: string;
  wastagePercentage: string | null;
  rawMaterialProduct: {
    id: string;
    name: string;
    sku: string | null;
    costPrice: string | null;
    unitPrice: string | null;
    stockQuantity: string | null;
  };
}

interface Bom {
  id: string;
  name: string;
  finishedProductId: string;
  laborCostEstimate: string | null;
  overheadCostEstimate: string | null;
  createdAt: Date;
  finishedProduct: {
    id: string;
    name: string;
    sku: string | null;
    costPrice: string | null;
    unitPrice: string | null;
    stockQuantity: string | null;
  };
  items: BomItem[];
}

interface ProductionOrder {
  id: string;
  orderNumber: string;
  unitsToProduce: string;
  totalCostKes: string;
  status: string;
  completedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  bom: {
    name: string;
    finishedProduct: {
      name: string;
      sku: string | null;
    };
  };
  targetLocation: {
    name: string;
  };
}

interface BomClientProps {
  shopId: string;
  shopSlug: string;
  initialBoms: any[];
  initialOrders: any[];
  locations: any[];
  products: any[];
}

export function BomClient({
  shopId,
  shopSlug,
  initialBoms,
  initialOrders,
  locations,
  products,
}: BomClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"recipes" | "orders">("recipes");

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [selectedBomForRun, setSelectedBomForRun] = useState<Bom | null>(null);

  // Create Form State
  const [recipeName, setRecipeName] = useState("");
  const [finishedProductId, setFinishedProductId] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [overheadCost, setOverheadCost] = useState("0");
  const [rawItems, setRawItems] = useState<
    { rawMaterialProductId: string; quantityRequired: string; wastagePercentage: string }[]
  >([{ rawMaterialProductId: "", quantityRequired: "1", wastagePercentage: "0" }]);

  // Run Order Form State
  const [unitsToProduce, setUnitsToProduce] = useState("10");
  const [targetLocationId, setTargetLocationId] = useState(locations[0]?.id || "");
  const [orderNotes, setOrderNotes] = useState("");

  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Helper calculation for live preview of unit cost in recipe builder
  const theoreticalUnitCost = React.useMemo(() => {
    let materialTotal = 0;
    for (const item of rawItems) {
      if (!item.rawMaterialProductId) continue;
      const prod = products.find((p) => p.id === item.rawMaterialProductId);
      const cost = Number(prod?.costPrice || prod?.unitPrice || 0);
      const qty = Number(item.quantityRequired) || 0;
      const waste = Number(item.wastagePercentage) || 0;
      materialTotal += qty * (1 + waste / 100) * cost;
    }
    const labor = Number(laborCost) || 0;
    const overhead = Number(overheadCost) || 0;
    return materialTotal + labor + overhead;
  }, [rawItems, laborCost, overheadCost, products]);

  const handleAddRawItem = () => {
    setRawItems([...rawItems, { rawMaterialProductId: "", quantityRequired: "1", wastagePercentage: "0" }]);
  };

  const handleRemoveRawItem = (index: number) => {
    if (rawItems.length <= 1) return;
    setRawItems(rawItems.filter((_, i) => i !== index));
  };

  const handleRawItemChange = (index: number, field: string, val: string) => {
    const updated = [...rawItems];
    updated[index] = { ...updated[index], [field]: val };
    setRawItems(updated);
  };

  const handleFinishedProductChange = (productId: string) => {
    setFinishedProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod && !recipeName) {
      setRecipeName(`Assembly: ${prod.name}`);
    }
  };

  const handleCreateBom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validItems = rawItems.filter((item) => item.rawMaterialProductId && Number(item.quantityRequired) > 0);
    if (validItems.length === 0) {
      setFormError("Please configure at least one raw material component with valid quantity.");
      return;
    }

    startTransition(async () => {
      const res = await createBillOfMaterialsAction({
        shopId,
        finishedProductId,
        name: recipeName,
        laborCostEstimate: Number(laborCost) || 0,
        overheadCostEstimate: Number(overheadCost) || 0,
        items: validItems.map((item) => ({
          rawMaterialProductId: item.rawMaterialProductId,
          quantityRequired: Number(item.quantityRequired),
          wastagePercentage: Number(item.wastagePercentage) || 0,
        })),
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        setRecipeName("");
        setFinishedProductId("");
        setLaborCost("0");
        setOverheadCost("0");
        setRawItems([{ rawMaterialProductId: "", quantityRequired: "1", wastagePercentage: "0" }]);
        setFeedbackSuccess("Recipe (BOM) created successfully!");
        setTimeout(() => setFeedbackSuccess(null), 4000);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to create BOM.");
      }
    });
  };

  const handleRunProduction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBomForRun) return;
    setFormError(null);

    startTransition(async () => {
      const res = await runProductionOrderAction({
        shopId,
        bomId: selectedBomForRun.id,
        unitsToProduce: Number(unitsToProduce),
        targetLocationId,
        notes: orderNotes,
      });

      if (res.success) {
        setIsRunModalOpen(false);
        setSelectedBomForRun(null);
        setOrderNotes("");
        setFeedbackSuccess(
          `Production run completed! Generated ${unitsToProduce} finished units at unit cost KES ${res.unitProductionCost?.toFixed(2)}.`
        );
        setTimeout(() => setFeedbackSuccess(null), 5000);
        router.refresh();
      } else {
        setFormError(res.error || "Failed to execute production run.");
      }
    });
  };

  const totalManufacturedValue = initialOrders.reduce(
    (acc, curr) => acc + Number(curr.totalCostKes || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Active BOM Recipes</span>
            <Boxes className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 mt-2">{initialBoms.length}</p>
          <span className="text-[11px] text-zinc-500">Formulas with multi-level parts</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Production Runs</span>
            <History className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">{initialOrders.length}</p>
          <span className="text-[11px] text-zinc-500">Completed assembly cycles</span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500">Total Output Value</span>
            <TrendingUp className="w-4 h-4 text-zinc-800" />
          </div>
          <p className="text-2xl font-bold font-mono text-zinc-900 mt-2">
            KES {totalManufacturedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-zinc-500">Capitalized assembly inventory</span>
        </div>
      </div>

      {feedbackSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {feedbackSuccess}
        </div>
      )}

      {/* Action Bar & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("recipes")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "recipes"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Recipes &amp; Assemblies ({initialBoms.length})
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "orders"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Production History ({initialOrders.length})
          </button>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-semibold rounded-md hover:bg-zinc-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          + Create Recipe (BOM)
        </button>
      </div>

      {/* Tab 1: Recipes */}
      {activeTab === "recipes" && (
        <div className="space-y-4">
          {initialBoms.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-10 text-center">
              <Boxes className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-800">No Bill of Materials configured</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Define recipes for assembled finished goods, specifying component quantities, scrap tolerances, and labor overheads.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-md hover:bg-zinc-800"
              >
                <Plus className="w-3.5 h-3.5" /> Configure First Recipe
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {initialBoms.map((bom: Bom) => {
                // Calculate estimated BOM cost
                let rawCostSum = 0;
                bom.items.forEach((item) => {
                  const unitCost = Number(item.rawMaterialProduct.costPrice || item.rawMaterialProduct.unitPrice || 0);
                  const qty = Number(item.quantityRequired) || 0;
                  const waste = Number(item.wastagePercentage) || 0;
                  rawCostSum += qty * (1 + waste / 100) * unitCost;
                });
                const estTotalUnitCost = rawCostSum + Number(bom.laborCostEstimate || 0) + Number(bom.overheadCostEstimate || 0);

                return (
                  <div
                    key={bom.id}
                    className="bg-white border border-zinc-200 rounded-lg p-5 shadow-sm hover:border-zinc-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-zinc-900 text-sm">{bom.name}</h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold">
                              ACTIVE RECIPE
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Package className="w-3 h-3 text-zinc-400" />
                            Outputs: <strong className="text-zinc-800">{bom.finishedProduct.name}</strong>{" "}
                            {bom.finishedProduct.sku && (
                              <span className="font-mono text-[10px] text-zinc-400">({bom.finishedProduct.sku})</span>
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedBomForRun(bom);
                            setUnitsToProduce("10");
                            setFormError(null);
                            setIsRunModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Run Assembly
                        </button>
                      </div>

                      {/* Components Table */}
                      <div className="mt-4 border border-zinc-100 rounded-md overflow-hidden bg-zinc-50/50">
                        <div className="px-3 py-1.5 bg-zinc-100 text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex justify-between">
                          <span>Raw Material Components ({bom.items.length})</span>
                          <span>Qty / Unit (+Scrap)</span>
                        </div>
                        <div className="divide-y divide-zinc-100 max-h-40 overflow-y-auto">
                          {bom.items.map((item) => {
                            const cost = Number(item.rawMaterialProduct.costPrice || item.rawMaterialProduct.unitPrice || 0);
                            return (
                              <div key={item.id} className="px-3 py-2 text-xs flex items-center justify-between">
                                <div className="truncate max-w-[200px]">
                                  <span className="font-medium text-zinc-800">{item.rawMaterialProduct.name}</span>
                                  <span className="text-[10px] font-mono text-zinc-400 ml-1.5">
                                    KES {cost.toFixed(2)}/u
                                  </span>
                                </div>
                                <div className="text-right font-mono text-xs">
                                  <span className="font-semibold text-zinc-900">{item.quantityRequired}</span>
                                  {Number(item.wastagePercentage) > 0 && (
                                    <span className="text-[10px] text-amber-600 ml-1">
                                      (+{item.wastagePercentage}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Footer Cost Summary */}
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-zinc-500 font-mono text-[11px]">
                        <span>Labor: KES {Number(bom.laborCostEstimate || 0).toFixed(2)}</span>
                        <span>Overhead: KES {Number(bom.overheadCostEstimate || 0).toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono uppercase text-zinc-400 block">Est. Cost / Unit</span>
                        <span className="font-mono font-bold text-zinc-900 text-sm">
                          KES {estTotalUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders Audit */}
      {activeTab === "orders" && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-zinc-500 font-semibold">
              Production Execution History ({initialOrders.length})
            </span>
          </div>

          {initialOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">
              No production runs executed yet. Select a recipe and click &ldquo;Run Assembly&rdquo; to build finished goods.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 font-mono uppercase text-[10px] text-zinc-500">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Assembly / Recipe</th>
                    <th className="py-2.5 px-3">Destination Branch</th>
                    <th className="py-2.5 px-3 text-right">Units Built</th>
                    <th className="py-2.5 px-3 text-right">Total Cost (KES)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Executed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {initialOrders.map((order: ProductionOrder) => (
                    <tr key={order.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3 px-3 font-mono font-semibold text-zinc-900">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-zinc-900">{order.bom?.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {order.bom?.finishedProduct?.name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-700">
                        {order.targetLocation?.name || "Default Warehouse"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                        +{Number(order.unitsToProduce).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-zinc-900">
                        KES {Number(order.totalCostKes).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          COMPLETED
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-500 text-[11px] font-mono">
                        {new Date(order.completedAt || order.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE BOM RECIPE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Configure Bill of Materials (BOM)</h3>
                <p className="text-xs text-zinc-500">Define raw component quantities, wastage allowance, and labor</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBom} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Target Finished Assembly Good *</label>
                  <select
                    value={finishedProductId}
                    onChange={(e) => handleFinishedProductChange(e.target.value)}
                    required
                    className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-black"
                  >
                    <option value="">-- Choose Finished Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.sku ? `(${p.sku})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Recipe / Assembly Name *</label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g. Assembly: Wooden Dining Chair v1"
                    required
                    className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Raw Materials Line Items */}
              <div className="border border-zinc-200 rounded-lg p-3 space-y-3 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-800 uppercase tracking-wider text-[11px] font-mono">
                    Raw Material Components
                  </span>
                  <button
                    type="button"
                    onClick={handleAddRawItem}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-black hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Component
                  </button>
                </div>

                <div className="space-y-2">
                  {rawItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white p-2 rounded border border-zinc-200">
                      <div className="flex-1">
                        <select
                          value={item.rawMaterialProductId}
                          onChange={(e) => handleRawItemChange(index, "rawMaterialProductId", e.target.value)}
                          required
                          className="w-full border border-zinc-200 rounded px-2 py-1 text-xs"
                        >
                          <option value="">-- Choose Raw Component --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (KES {Number(p.costPrice || p.unitPrice || 0).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          placeholder="Qty req."
                          value={item.quantityRequired}
                          onChange={(e) => handleRawItemChange(index, "quantityRequired", e.target.value)}
                          required
                          className="w-full border border-zinc-200 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="Scrap %"
                          value={item.wastagePercentage}
                          onChange={(e) => handleRawItemChange(index, "wastagePercentage", e.target.value)}
                          className="w-full border border-zinc-200 rounded px-2 py-1 text-xs font-mono"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRawItem(index)}
                        disabled={rawItems.length <= 1}
                        className="text-zinc-400 hover:text-red-600 disabled:opacity-30 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labor & Overhead Allocation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Labor Cost Allocation per Unit (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Overhead Cost Allocation per Unit (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={overheadCost}
                    onChange={(e) => setOverheadCost(e.target.value)}
                    className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Live Cost Summary */}
              <div className="p-3 bg-zinc-100 rounded-lg flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-600">Theoretical Finished Unit Cost:</span>
                <span className="font-bold text-zinc-900 text-sm">
                  KES {theoreticalUnitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-black text-white font-semibold rounded hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Recipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RUN PRODUCTION MODAL */}
      {isRunModalOpen && selectedBomForRun && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-zinc-200 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Execute Production Run</h3>
                <p className="text-xs text-zinc-500">Atomic inventory deduction &amp; finished goods capitalization</p>
              </div>
              <button
                onClick={() => setIsRunModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-lg font-mono p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRunProduction} className="p-4 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="font-semibold text-zinc-800 text-xs">{selectedBomForRun.name}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">
                  Finished Item: {selectedBomForRun.finishedProduct.name}
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Units to Produce *</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={unitsToProduce}
                  onChange={(e) => setUnitsToProduce(e.target.value)}
                  required
                  className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Destination Branch Warehouse *</label>
                <select
                  value={targetLocationId}
                  onChange={(e) => setTargetLocationId(e.target.value)}
                  required
                  className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} {loc.isDefault ? "(Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Production Batch Notes</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Batch #BOM-2026-Q3 for client preorder"
                  className="w-full border border-zinc-300 rounded px-2.5 py-1.5 text-xs"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <p className="text-[11px]">
                  Confirming this run will immediately debit all required raw material stock from the warehouse ledger and credit{" "}
                  <strong>{unitsToProduce} units</strong> to the finished goods stock with actual computed cost.
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRunModalOpen(false)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {isPending ? "Executing..." : "Confirm & Run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
