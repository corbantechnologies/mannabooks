"use client";

import { useState, useRef, useEffect } from "react";
import {
  acceptProposalPortalAction,
  requestProposalAmendmentAction,
  declineProposalPortalAction,
} from "@/lib/actions/proposals";

interface ProposalPortalActionsProps {
  token: string;
  proposalTitle: string;
  clientName: string;
  shopBrandColor: string;
}

type Tab = "accept" | "amend" | "decline";

export function ProposalPortalActions({
  token,
  proposalTitle,
  clientName,
  shopBrandColor,
}: ProposalPortalActionsProps) {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [signerName, setSignerName] = useState(clientName);
  const [amendmentNotes, setAmendmentNotes] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  // Canvas for e-signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Canvas drawing logic
  useEffect(() => {
    if (activeTab !== "accept") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = shopBrandColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasSignature(true);
    };
    const end = () => { isDrawing.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", end);
    };
  }, [activeTab, shopBrandColor]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleAccept = async () => {
    if (!signerName.trim()) {
      setResult({ success: false, error: "Please enter your name to sign." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const signatureDataUrl = hasSignature ? canvasRef.current?.toDataURL("image/png") : undefined;
      const res = await acceptProposalPortalAction({ token, signerName: signerName.trim(), signatureDataUrl });
      setResult(res);
      if (res.success) {
        setTimeout(() => window.location.reload(), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAmend = async () => {
    if (!amendmentNotes.trim()) {
      setResult({ success: false, error: "Please describe the amendments you need." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await requestProposalAmendmentAction({
        token,
        clientName: signerName || clientName,
        amendmentNotes: amendmentNotes.trim(),
        contactEmail: contactEmail.trim() || undefined,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await declineProposalPortalAction({
        token,
        clientName: signerName || clientName,
        reason: declineReason.trim() || undefined,
      });
      setResult(res);
      if (res.success) {
        setTimeout(() => window.location.reload(), 1800);
      }
    } finally {
      setLoading(false);
    }
  };

  if (result?.success) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-10 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h3 className="text-lg font-semibold text-emerald-400">Response Submitted</h3>
        <p className="text-gray-400 text-sm">{result.message}</p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "accept", label: "Accept & Sign", emoji: "✅" },
    { id: "amend", label: "Request Changes", emoji: "📝" },
    { id: "decline", label: "Decline", emoji: "❌" },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/3 overflow-hidden">
      {/* Tab header */}
      <div className="flex border-b border-white/8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setResult(null); }}
            className={`flex-1 py-4 text-sm font-medium transition-all duration-150 ${
              activeTab === tab.id
                ? "bg-white/6 text-white border-b-2"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={activeTab === tab.id ? { borderBottomColor: shopBrandColor } : {}}
          >
            <span className="mr-1.5">{tab.emoji}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="p-7">
        {!activeTab && (
          <p className="text-gray-500 text-sm text-center py-4">
            Select an action above to respond to this proposal.
          </p>
        )}

        {/* ── ACCEPT ── */}
        {activeTab === "accept" && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your Full Name *</label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="e.g. John Kimani"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-gray-400 font-medium">Digital Signature <span className="text-gray-600">(optional — draw below)</span></label>
                {hasSignature && (
                  <button onClick={clearSignature} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <canvas
                ref={canvasRef}
                width={600}
                height={150}
                className="w-full rounded-xl border border-white/10 bg-white/5 cursor-crosshair touch-none"
                style={{ height: "150px" }}
              />
              <p className="text-xs text-gray-600 mt-1.5">Draw your signature above using your mouse or finger.</p>
            </div>

            {result?.error && (
              <p className="text-red-400 text-sm bg-red-500/8 px-4 py-2.5 rounded-lg">{result.error}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-150 disabled:opacity-50"
              style={{ backgroundColor: shopBrandColor }}
            >
              {loading ? "Submitting…" : "✅ Accept & Sign Proposal"}
            </button>
            <p className="text-center text-xs text-gray-600">
              By clicking accept, you formally agree to the terms outlined in this proposal.
            </p>
          </div>
        )}

        {/* ── AMEND ── */}
        {activeTab === "amend" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Your Name</label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">What changes do you need? *</label>
              <textarea
                value={amendmentNotes}
                onChange={e => setAmendmentNotes(e.target.value)}
                rows={4}
                placeholder="Describe what you'd like changed or added…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Contact Email <span className="text-gray-600">(optional)</span></label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25"
              />
            </div>
            {result?.error && (
              <p className="text-red-400 text-sm bg-red-500/8 px-4 py-2.5 rounded-lg">{result.error}</p>
            )}
            <button
              onClick={handleAmend}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-50 bg-amber-500/15 text-amber-300 hover:bg-amber-500/20"
            >
              {loading ? "Sending…" : "📝 Submit Amendment Request"}
            </button>
          </div>
        )}

        {/* ── DECLINE ── */}
        {activeTab === "decline" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Reason for declining <span className="text-gray-600">(optional)</span></label>
              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                rows={3}
                placeholder="Help us understand why this proposal didn't meet your needs…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/25 resize-none"
              />
            </div>
            {result?.error && (
              <p className="text-red-400 text-sm bg-red-500/8 px-4 py-2.5 rounded-lg">{result.error}</p>
            )}
            <button
              onClick={handleDecline}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-red-500/10 text-red-400 hover:bg-red-500/15 disabled:opacity-50"
            >
              {loading ? "Declining…" : "❌ Decline This Proposal"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
