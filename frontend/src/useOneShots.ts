// src/useOneShots.ts
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  OneShot,
  SavedOneShotSummary,
  SavedOneShotDetail,
} from "./types";

export type Tab = "generate" | "myshots";

type UseOneShotsResult = {
  activeTab: Tab;
  handleTabChange: (tab: Tab) => void;

  generateProps: {
    sessionPresent: boolean;
    currentName: string;
    partySize: number;
    averageLevel: number;
    environment: string;
    isGenerating: boolean;
    currentOneShot: OneShot | null;
    currentShotId: string | null;
    currentCompleted: boolean;
    currentNotes: string;
    onNotesChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onPartySizeChange: (value: number) => void;
    onAverageLevelChange: (value: number) => void;
    onEnvironmentChange: (value: string) => void;
    onGenerate: (e: React.FormEvent) => void;
    onSave: () => void;
    onToggleCompleted: () => void;
    onDelete: () => void;
    error: string;
    success: string;
  };

  myShotsProps: {
    sessionPresent: boolean;
    savedShots: SavedOneShotSummary[];
    currentOneShot: OneShot | null;
    currentName: string;
    currentCompleted: boolean;
    currentNotes: string;
    onNotesChange: (value: string) => void;
    onOpenShot: (id: string) => void;
    onBackToShelf: () => void;
    onToggleCompletedShot: (shot: SavedOneShotSummary) => void;
    onDeleteShot: (shot: SavedOneShotSummary) => void;
    onToggleCompletedCurrent: () => void;
    onDeleteCurrent: () => void;
    onRenameCurrent: (newName: string) => void;
    error: string;
    success: string;
  };
};

export function useOneShots(session: Session | null): UseOneShotsResult {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const [currentOneShot, setCurrentOneShot] = useState<OneShot | null>(null);
  const [currentName, setCurrentName] = useState<string>("");
  const [currentShotId, setCurrentShotId] = useState<string | null>(null);
  const [currentCompleted, setCurrentCompleted] = useState<boolean>(false);
  const [currentNotes, setCurrentNotes] = useState<string>("");

  const [savedShots, setSavedShots] = useState<SavedOneShotSummary[]>([]);

  const [partySize, setPartySize] = useState<number>(1);
  const [averageLevel, setAverageLevel] = useState<number>(1);
  const [environment, setEnvironment] = useState<string>("forest");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const notesSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const sessionPresent = !!session;

  // Clear state when session logs out
  useEffect(() => {
    if (!sessionPresent) {
      setSavedShots([]);
      setCurrentShotId(null);
      setCurrentOneShot(null);
      setCurrentCompleted(false);
      setCurrentNotes("");
    }
  }, [sessionPresent]);

  // Cleanup pending notes save on unmount
  useEffect(() => {
    return () => {
      if (notesSaveTimeoutRef.current) {
        clearTimeout(notesSaveTimeoutRef.current);
      }
    };
  }, []);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!session) {
      throw new Error("You must be signed in to perform this action.");
    }
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: "Bearer " + session.access_token,
      },
    });
  };

  const loadSavedShots = async () => {
    if (!session) {
      setSavedShots([]);
      return;
    }
    try {
      setError("");
      const res = await fetchWithAuth("/api/oneshots");
      if (!res.ok) {
        throw new Error("Failed to load one-shots");
      }
      const data = (await res.json()) as SavedOneShotSummary[];
      setSavedShots(data);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while loading one-shots.";
      setError(msg);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setError("");
    setSuccess("");

    if (tab === "myshots") {
      setCurrentOneShot(null);
      setCurrentShotId(null);
      setCurrentCompleted(false);
      setCurrentNotes("");
      if (sessionPresent) {
        void loadSavedShots();
      } else {
        setSavedShots([]);
      }
    }

    if (tab === "generate") {
      setCurrentOneShot(null);
      setCurrentShotId(null);
      setCurrentCompleted(false);
      setCurrentNotes("");
      setCurrentName("");
      setPartySize(1);
      setAverageLevel(1);
      setEnvironment("forest");
      setError("");
      setSuccess("");
      setIsGenerating(false);
    }
  };

  const scheduleAutoSaveNotes = (value: string) => {
    if (!currentShotId || !session) return;

    if (notesSaveTimeoutRef.current) {
      clearTimeout(notesSaveTimeoutRef.current);
    }

    notesSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(`/api/oneshots/${currentShotId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: value }),
        });

        if (!res.ok) {
          throw new Error("Failed to save notes.");
        }

        setSuccess("Notes saved.");
      } catch (err) {
        console.error(err);
        const msg =
          err instanceof Error
            ? err.message
            : "An error occurred while saving notes.";
        setError(msg);
      }
    }, 500);
  };

  // ===== Generate =====
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsGenerating(true);
    setCurrentNotes("");

    if (!currentName.trim()) {
      setError("Please enter a name for your one-shot.");
      setIsGenerating(false);
      return;
    }

    try {
      const res = await fetch("/api/oneshots/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partySize,
          averageLevel,
          environment,
        }),
      });

      if (!res.ok) {
        let message = "Failed to generate one-shot.";
        try {
          const body = await res.json();
          if (body?.error) message = body.error;
        } catch {
          //
        }
        throw new Error(message);
      }

      const oneShot = (await res.json()) as OneShot;

      setCurrentOneShot(oneShot);
      setCurrentShotId(null);
      setCurrentCompleted(false);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "Something went wrong generating.";
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ===== Save current =====
  const handleSaveClick = async () => {
    setError("");
    setSuccess("");

    if (!currentOneShot) {
      setError("Generate a one-shot first.");
      return;
    }
    if (!session) {
      setError("Sign in with Google to save your one-shot.");
      return;
    }
    if (!currentName.trim()) {
      setError("Please enter a name for your one-shot.");
      return;
    }

    try {
      const res = await fetchWithAuth("/api/oneshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: currentName,
          oneShot: currentOneShot,
          notes: currentNotes,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Failed to save:", errText);
        throw new Error("There was an issue saving this one-shot.");
      }

      const saved = (await res.json()) as SavedOneShotSummary;
      setCurrentShotId(saved.id);
      setCurrentCompleted(saved.completed);
      setSuccess("One-shot saved to your library.");

      if (activeTab === "myshots") {
        void loadSavedShots();
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "Something went wrong while saving.";
      setError(msg);
    }
  };

  // ===== Open saved detail =====
  const handleOpenShot = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/oneshots/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load one-shot.");
      }
      const shot = (await res.json()) as SavedOneShotDetail;
      setCurrentOneShot(shot.data);
      setCurrentName(shot.name);
      setCurrentShotId(shot.id);
      setCurrentCompleted(shot.completed);
      setCurrentNotes(shot.notes ?? "");
      setActiveTab("myshots");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while loading the one-shot.";
      setError(msg);
    }
  };

  // ===== Toggle completed =====
  const handleToggleCompleted = async (shot: SavedOneShotSummary) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/oneshots/${shot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !shot.completed }),
      });

      if (!res.ok) {
        throw new Error("Failed to update one-shot.");
      }

      await loadSavedShots();
      if (currentShotId === shot.id) {
        setCurrentCompleted(!shot.completed);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while updating.";
      setError(msg);
    }
  };

  const handleToggleCompletedCurrent = async () => {
    if (!currentShotId || !currentOneShot) return;
    const fake: SavedOneShotSummary = {
      id: currentShotId,
      name: currentName,
      created_at: "",
      completed: currentCompleted,
    };
    await handleToggleCompleted(fake);
  };

  // ===== Delete =====
  const handleDeleteShot = async (shot: SavedOneShotSummary) => {
    if (!window.confirm(`Delete "${shot.name}" from your library?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetchWithAuth(`/api/oneshots/${shot.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete one-shot.");
      }

      await loadSavedShots();
      if (currentShotId === shot.id) {
        setCurrentShotId(null);
        setCurrentOneShot(null);
        setCurrentCompleted(false);
        setCurrentNotes("");
      }
      setSuccess("One-shot deleted.");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while deleting.";
      setError(msg);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!currentShotId) return;
    const fake: SavedOneShotSummary = {
      id: currentShotId,
      name: currentName,
      created_at: "",
      completed: currentCompleted,
    };
    await handleDeleteShot(fake);
  };

  const handleBackToShelf = () => {
    setCurrentOneShot(null);
    setCurrentShotId(null);
    setCurrentCompleted(false);
    setCurrentNotes("");
    setError("");
    setSuccess("");
  };

  const handleRenameCurrent = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setCurrentName(trimmed);
    setError("");
    setSuccess("");

    if (!currentShotId || !session) return;

    try {
      const res = await fetchWithAuth(`/api/oneshots/${currentShotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Failed to rename one-shot.");
      }

      await loadSavedShots();
      setSuccess("One-shot renamed.");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "An error occurred while renaming.";
      setError(msg);
    }
  };

  const handleNotesChange = (value: string) => {
    setCurrentNotes(value);
    if (currentShotId && session) {
      scheduleAutoSaveNotes(value);
    }
  };

  const generateProps = {
    sessionPresent,
    currentName,
    partySize,
    averageLevel,
    environment,
    isGenerating,
    currentOneShot,
    currentShotId,
    currentCompleted,
    currentNotes,
    onNotesChange: handleNotesChange,
    onNameChange: setCurrentName,
    onPartySizeChange: setPartySize,
    onAverageLevelChange: setAverageLevel,
    onEnvironmentChange: setEnvironment,
    onGenerate: handleGenerate,
    onSave: handleSaveClick,
    onToggleCompleted: handleToggleCompletedCurrent,
    onDelete: handleDeleteCurrent,
    error,
    success,
  };

  const myShotsProps = {
    sessionPresent,
    savedShots,
    currentOneShot,
    currentName,
    currentCompleted,
    currentNotes,
    onNotesChange: handleNotesChange,
    onOpenShot: handleOpenShot,
    onBackToShelf: handleBackToShelf,
    onToggleCompletedShot: handleToggleCompleted,
    onDeleteShot: handleDeleteShot,
    onToggleCompletedCurrent: handleToggleCompletedCurrent,
    onDeleteCurrent: handleDeleteCurrent,
    onRenameCurrent: handleRenameCurrent,
    error,
    success,
  };

  return { activeTab, handleTabChange, generateProps, myShotsProps };
}
