"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";

interface KeyboardShortcutsProviderProps {
  slug: string;
  children: React.ReactNode;
}

export function KeyboardShortcutsProvider({ slug, children }: KeyboardShortcutsProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // 1. Ignore keystrokes when typing inside inputs, textareas, selects, or editable fields
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // 2. Ignore when modifier keys (Ctrl, Alt, Meta/Cmd) are pressed, except Shift for "?"
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      const key = e.key.toUpperCase();

      // Help Modal
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
        return;
      }

      // Navigation Shortcuts
      switch (key) {
        case "N":
          e.preventDefault();
          router.push(`/workspaces/${slug}/documents/new`);
          break;
        case "B":
          e.preventDefault();
          router.push(`/workspaces/${slug}/documents`);
          break;
        case "R":
          e.preventDefault();
          router.push(`/workspaces/${slug}/documents/recurring`);
          break;
        case "P":
          e.preventDefault();
          router.push(`/workspaces/${slug}/products`);
          break;
        case "E":
          e.preventDefault();
          router.push(`/workspaces/${slug}/expenses`);
          break;
        case "I":
          e.preventDefault();
          router.push(`/workspaces/${slug}/inbox`);
          break;
        case "O":
        case "D":
          e.preventDefault();
          router.push(`/workspaces/${slug}`);
          break;
        case "A":
          e.preventDefault();
          router.push(`/workspaces/${slug}/analytics`);
          break;
        case "C":
          e.preventDefault();
          router.push(`/workspaces/${slug}/clients`);
          break;
        case "S":
          e.preventDefault();
          router.push(`/workspaces/${slug}/suppliers`);
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slug, router]);

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slug={slug}
      />
    </>
  );
}
