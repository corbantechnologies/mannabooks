"use client";

import { useState } from "react";
import QRCode from "react-qr-code";
import { formatCurrency } from "@/lib/utils";

export interface ThermalReceiptItem {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  itemTotal?: number | string;
  taxType?: "V_16" | "V_0" | "EXEMPT" | string;
}

export interface ThermalReceiptData {
  shopName: string;
  shopShortName?: string | null;
  shopPhone?: string | null;
  shopEmail?: string | null;
  shopWebsite?: string | null;
  shopTaxPin?: string | null;
  shopVatNumber?: string | null;
  currency: string;
  docNumber: string;
  docType: string;
  issueDate: string | Date;
  customerName?: string | null;
  customerPhone?: string | null;
  customerTaxPin?: string | null;
  items: ThermalReceiptItem[];
  subTotal: number | string;
  taxAmount: number | string;
  grandTotal: number | string;
  paymentChannel?: string | null;
  paymentReference?: string | null;
  amountTendered?: number | string | null;
  changeDue?: number | string | null;
  kraCuInvoiceNumber?: string | null;
  cashierName?: string | null;
  footerNote?: string | null;
}

interface ThermalReceiptModalProps {
  receipt: ThermalReceiptData;
  isOpen: boolean;
  onClose: () => void;
}

export function ThermalReceiptModal({ receipt, isOpen, onClose }: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<"58mm" | "80mm">("80mm");

  if (!isOpen) return null;

  function handlePrint() {
    window.print();
  }

  const dateObj = new Date(receipt.issueDate);
  const formattedDate = dateObj.toLocaleDateString("en-KE", { dateStyle: "short" });
  const formattedTime = dateObj.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });

  const qrValue = receipt.kraCuInvoiceNumber
    ? `https://itax.kra.go.ke/KRA-Portal/invoiceVerification.htm?invoiceNo=${encodeURIComponent(receipt.kraCuInvoiceNumber)}`
    : `https://mannabooks.co.ke/verify/${receipt.docNumber}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      {/* SCREEN PREVIEW MODAL CONTAINER */}
      <div className="bg-white border border-zinc-300 rounded-xl shadow-2xl max-w-lg w-full max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 font-mono text-xs">
        
        {/* HEADER TOOLBAR (HIDDEN IN PRINT) */}
        <div className="p-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-xs tracking-wider text-black">
              🖨️ POS Thermal Slip
            </span>
            <div className="flex border border-zinc-300 rounded bg-white overflow-hidden text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPaperWidth("58mm")}
                className={`px-2.5 py-1 ${paperWidth === "58mm" ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                58mm (2&quot;)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth("80mm")}
                className={`px-2.5 py-1 border-l border-zinc-300 ${paperWidth === "80mm" ? "bg-black text-white" : "text-zinc-600 hover:bg-zinc-100"}`}
              >
                80mm (3&quot;)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-3.5 py-1.5 rounded shadow flex items-center gap-1.5 transition-colors"
            >
              <span>🖨️</span>
              <span>Print Ticket</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-black p-1 hover:bg-zinc-200 rounded text-base font-bold transition-colors"
              title="Close dialog"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SCROLLABLE RECEIPT PREVIEW CANVAS */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-100 flex justify-center items-start">
          
          {/* THE TICKET CANVAS (TARGETED BY @media print) */}
          <div
            id="thermal-receipt-container"
            className={`bg-white text-black p-4 shadow-md border border-zinc-300 transition-all font-mono leading-tight ${
              paperWidth === "58mm" ? "w-[260px] text-[10px]" : "w-[340px] text-[11px]"
            }`}
            style={{
              fontFamily: "'Courier New', Courier, monospace",
            }}
          >
            {/* 1. STORE HEADER */}
            <div className="text-center space-y-0.5 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider">{receipt.shopName}</h2>
              {receipt.shopShortName && (
                <p className="text-[10px] text-zinc-600 uppercase font-semibold">{receipt.shopShortName}</p>
              )}
              {receipt.shopPhone && <p className="text-[10px]">Tel: {receipt.shopPhone}</p>}
              {receipt.shopEmail && <p className="text-[9px] text-zinc-600">{receipt.shopEmail}</p>}
              {receipt.shopTaxPin && (
                <p className="font-bold text-[10px] pt-0.5">KRA PIN: {receipt.shopTaxPin}</p>
              )}
              {receipt.shopVatNumber && (
                <p className="text-[9px]">VAT REG: {receipt.shopVatNumber}</p>
              )}
            </div>

            {/* DIVIDER */}
            <div className="border-t border-dashed border-black my-2" />

            {/* 2. RECEIPT METADATA */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>DOC #:</span>
                <span className="font-bold">{receipt.docNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE/TIME:</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              {receipt.cashierName && (
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{receipt.cashierName}</span>
                </div>
              )}
              {receipt.customerName && (
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold uppercase truncate max-w-[160px]">{receipt.customerName}</span>
                </div>
              )}
              {receipt.customerTaxPin && (
                <div className="flex justify-between">
                  <span>CUST PIN:</span>
                  <span className="font-bold">{receipt.customerTaxPin}</span>
                </div>
              )}
            </div>

            {/* DIVIDER */}
            <div className="border-t border-dashed border-black my-2" />

            {/* 3. LINE ITEMS */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] uppercase border-b border-black pb-0.5">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span className="text-right">TOTAL</span>
              </div>

              {receipt.items.map((item, idx) => {
                const q = typeof item.quantity === "string" ? parseFloat(item.quantity) : item.quantity;
                const p = typeof item.unitPrice === "string" ? parseFloat(item.unitPrice) : item.unitPrice;
                const total = item.itemTotal
                  ? (typeof item.itemTotal === "string" ? parseFloat(item.itemTotal) : item.itemTotal)
                  : q * p;
                const taxTag = item.taxType === "V_16" ? " [16%]" : item.taxType === "V_0" ? " [0%]" : " [E]";

                return (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-bold truncate">{item.description}</div>
                    <div className="flex justify-between text-[10px] text-zinc-700">
                      <span>
                        {q} x {formatCurrency(p, receipt.currency)}
                      </span>
                      <span>
                        {taxTag}
                      </span>
                      <span className="font-bold text-black text-right">
                        {formatCurrency(total, receipt.currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DIVIDER */}
            <div className="border-t border-dashed border-black my-2" />

            {/* 4. TOTALS BREAKDOWN */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(receipt.subTotal, receipt.currency)}</span>
              </div>
              <div className="flex justify-between text-zinc-700">
                <span>VAT AMOUNT:</span>
                <span>{formatCurrency(receipt.taxAmount, receipt.currency)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>TOTAL:</span>
                <span>{formatCurrency(receipt.grandTotal, receipt.currency)}</span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-dashed border-black my-2" />

            {/* 5. SETTLEMENT & TENDER DETAILS */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>PAYMENT METHOD:</span>
                <span className="font-bold uppercase">{receipt.paymentChannel || "CASH / MPESA"}</span>
              </div>
              {receipt.paymentReference && (
                <div className="flex justify-between">
                  <span>REF / TRANS CODE:</span>
                  <span className="font-bold">{receipt.paymentReference}</span>
                </div>
              )}
              {receipt.amountTendered !== null && receipt.amountTendered !== undefined && (
                <div className="flex justify-between">
                  <span>AMOUNT TENDERED:</span>
                  <span>{formatCurrency(receipt.amountTendered, receipt.currency)}</span>
                </div>
              )}
              {receipt.changeDue !== null && receipt.changeDue !== undefined && (
                <div className="flex justify-between font-bold">
                  <span>CHANGE DUE:</span>
                  <span>{formatCurrency(receipt.changeDue, receipt.currency)}</span>
                </div>
              )}
            </div>

            {/* 6. KRA eTIMS CU SERIAL & QR CODE */}
            {receipt.kraCuInvoiceNumber && (
              <>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-center space-y-1.5 pt-1">
                  <p className="font-bold text-[9px] uppercase tracking-wider">
                    KRA eTIMS FISCAL CU SIGNATURE
                  </p>
                  <p className="font-mono text-[9px] font-bold break-all bg-zinc-100 p-1 border border-zinc-200">
                    CU #: {receipt.kraCuInvoiceNumber}
                  </p>
                  <div className="flex justify-center p-1 bg-white inline-block">
                    <QRCode
                      value={qrValue}
                      size={paperWidth === "58mm" ? 80 : 96}
                      style={{ height: "auto", maxWidth: "100%" }}
                    />
                  </div>
                  <p className="text-[8px] text-zinc-500 leading-tight">
                    Scan with KRA QR App to verify eTIMS fiscal validity
                  </p>
                </div>
              </>
            )}

            {/* DIVIDER */}
            <div className="border-t border-dashed border-black my-2" />

            {/* 7. FOOTER */}
            <div className="text-center space-y-0.5 pt-1 text-[9px] text-zinc-600">
              <p className="font-bold text-black uppercase">
                {receipt.footerNote || "THANK YOU FOR SHOPPING WITH US!"}
              </p>
              <p>Goods once sold cannot be returned without valid receipt.</p>
              <p className="text-[8px] text-zinc-400 pt-1">Powered by MannaBooks POS</p>
            </div>

          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-3 border-t border-zinc-200 bg-white flex justify-between items-center print:hidden">
          <span className="text-[10px] text-zinc-500">
            Previewing on {paperWidth} roll
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="bg-black hover:bg-zinc-800 text-white font-bold uppercase text-[11px] px-4 py-1.5 rounded shadow flex items-center gap-1.5 transition-colors"
            >
              <span>🖨️</span>
              <span>Print Thermal Slip</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-SPECIFIC CSS ISOLATION */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-container, #thermal-receipt-container * {
            visibility: visible;
          }
          #thermal-receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: ${paperWidth === "58mm" ? "58mm" : "80mm"} !important;
            margin: 0 !important;
            padding: 2mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: ${paperWidth === "58mm" ? "58mm" : "80mm"} auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
