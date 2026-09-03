"use client";

import { useState } from "react";
import { addDocumentNoteAction, deleteDocumentNoteAction } from "@/lib/actions/documents";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

export interface NoteItem {
  id: string;
  note: string;
  createdAt: string | Date;
  user?: { name: string; email: string } | null;
}

interface DocumentInternalNotesProps {
  documentId: string;
  shopId: string;
  shopSlug: string;
  notes: NoteItem[];
}

export function DocumentInternalNotes({
  documentId,
  shopId,
  shopSlug,
  notes = [],
}: DocumentInternalNotesProps) {
  const [noteText, setNoteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Saving internal note...");

    try {
      const res = await addDocumentNoteAction({
        documentId,
        shopId,
        shopSlug,
        note: noteText.trim(),
      });

      if (res.success) {
        toast.success("Internal note added.", { id: toastId });
        setNoteText("");
      } else {
        toast.error(res.error || "Failed to save note.", { id: toastId });
      }
    } catch (err) {
      toast.error("Error saving internal note.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    setDeletingId(noteId);
    try {
      const res = await deleteDocumentNoteAction({
        noteId,
        documentId,
        shopId,
        shopSlug,
      });

      if (res.success) {
        toast.success("Note removed.");
      } else {
        toast.error(res.error || "Failed to delete note.");
      }
    } catch (err) {
      toast.error("Error removing note.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card-modern p-5 sm:p-6 bg-white space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Audit Trail</span>
          <h3 className="font-bold uppercase tracking-tight text-sm font-sans text-black mt-0.5 flex items-center gap-1.5">
            <span>🔒</span>
            <span>Internal Notes &amp; Activity Log</span>
          </h3>
        </div>
        <span className="text-[10px] text-zinc-400 font-sans italic">Private to workspace team</span>
      </div>

      {/* NOTES LIST */}
      <div className="space-y-2.5">
        {notes.map((n) => (
          <div
            key={n.id}
            className="p-3 bg-zinc-50/80 border border-zinc-200/80 rounded-lg flex items-start justify-between gap-3 group"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="font-bold text-black font-sans">{n.user?.name || "Operator"}</span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-400">
                  {new Date(n.createdAt).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="font-sans text-xs text-zinc-800 whitespace-pre-wrap leading-relaxed">
                {n.note}
              </p>
            </div>

            <button
              type="button"
              disabled={deletingId === n.id}
              onClick={() => handleDeleteNote(n.id)}
              className="text-zinc-300 hover:text-rose-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete note"
            >
              ✕
            </button>
          </div>
        ))}

        {notes.length === 0 && (
          <p className="text-zinc-400 italic text-[11px] font-sans py-2">
            No internal notes recorded yet. Notes left here are never visible to the client.
          </p>
        )}
      </div>

      {/* ADD NOTE FORM */}
      <form onSubmit={handleAddNote} className="pt-2 border-t border-zinc-100 space-y-2">
        <textarea
          rows={2}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Add an internal note or communication update (e.g. Promised payment on Thursday via bank transfer)..."
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !noteText.trim()}
            className="btn-primary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider disabled:opacity-40 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Spinner size={10} color="white" />
                <span>Saving...</span>
              </>
            ) : (
              "+ Add Internal Note"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
