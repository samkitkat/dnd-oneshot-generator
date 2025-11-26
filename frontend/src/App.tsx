// src/App.tsx
import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { OneShot, SavedOneShotSummary, SavedOneShotDetail } from "./types";
import { GenerateView } from "./components/GenerateView";
import { MyOneshotsView } from "./components/MyOneshotsView";

type Tab = "generate" | "myshots";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  const [session, setSession] = useState<Session | null>(null);

  const [currentOneShot, setCurrentOneShot] = useState<OneShot | null>(null);
  const [currentName, setCurrentName] = useState<string>("");
  const [currentShotId, setCurrentShotId] = useState<string | null>(null);
  const [currentCompleted, setCurrentCompleted] = useState<boolean>(false);

  const [savedShots, setSavedShots] = useState<SavedOneShotSummary[]>([]);

  const [partySize, setPartySize] = useState<number>(4);
  const [averageLevel, setAverageLevel] = useState<number>(3);
  const [environment, setEnvironment] = useState<string>("forest");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const userEmail = session?.user?.email ?? null;

  // ===== Supabase auth =====
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError("");
    setSuccess("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const handleSignOut = async () => {
    setError("");
    setSuccess("");
    await supabase.auth.signOut();
    setSession(null);
    setSavedShots([]);
    setCurrentShotId(null);
    setCurrentOneShot(null);
    setCurrentCompleted(false);
  };

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
      void loadSavedShots();
    }
  };

  // ===== Generate =====
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsGenerating(true);

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
        body: JSON.stringify({ name: currentName, oneShot: currentOneShot }),
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

  const showGenerateView = activeTab === "generate";
  const showMyShotsView = activeTab === "myshots";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">One-Shot Archive</h1>
          <p className="app-subtitle">A cozy D&amp;D library.</p>
          <span className="auth-status">
              {userEmail ? `Signed in as ${userEmail}` : "Not signed in"}
            </span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={
              "nav-link" + (activeTab === "generate" ? " nav-link-active" : "")
            }
            onClick={() => handleTabChange("generate")}
          >
            Generate
          </button>
          <button
            className={
              "nav-link" + (activeTab === "myshots" ? " nav-link-active" : "")
            }
            onClick={() => handleTabChange("myshots")}
          >
            My One-Shots
          </button>
          <div className="sidebar-auth">
            {!userEmail ? (
              <button className="btn-primary" onClick={handleSignIn}>
                Sign in with Google
              </button>
            ) : (
              <button className="nav-link" onClick={handleSignOut}>
                Sign out
              </button>
            )}
          </div>
        </nav>
      </aside>

      <main className="main-content">
        {showGenerateView && (
          <GenerateView
            sessionPresent={!!session}
            currentName={currentName}
            partySize={partySize}
            averageLevel={averageLevel}
            environment={environment}
            isGenerating={isGenerating}
            currentOneShot={currentOneShot}
            currentShotId={currentShotId}
            currentCompleted={currentCompleted}
            onNameChange={setCurrentName}
            onPartySizeChange={setPartySize}
            onAverageLevelChange={setAverageLevel}
            onEnvironmentChange={setEnvironment}
            onGenerate={handleGenerate}
            onSave={handleSaveClick}
            onToggleCompleted={handleToggleCompletedCurrent}
            onDelete={handleDeleteCurrent}
            error={error}
            success={success}
          />
        )}

        {showMyShotsView && (
          <MyOneshotsView
            sessionPresent={!!session}
            savedShots={savedShots}
            currentOneShot={currentOneShot}
            currentName={currentName}
            currentCompleted={currentCompleted}
            onOpenShot={handleOpenShot}
            onBackToShelf={handleBackToShelf}
            onToggleCompletedShot={handleToggleCompleted}
            onDeleteShot={handleDeleteShot}
            onToggleCompletedCurrent={handleToggleCompletedCurrent}
            onDeleteCurrent={handleDeleteCurrent}
            onRenameCurrent={handleRenameCurrent}
            error={error}
            success={success}
          />
        )}
      </main>
    </div>
  );
};

export default App;
