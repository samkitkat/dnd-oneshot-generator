// src/components/GenerateView.tsx
import React, { useState, useEffect } from "react";
import { OneShot } from "../types";
import { OneShotDetail } from "./OneShotDetail";

type GenerateViewProps = {
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

export const GenerateView: React.FC<GenerateViewProps> = ({
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
  onNotesChange,
  onNameChange,
  onPartySizeChange,
  onAverageLevelChange,
  onEnvironmentChange,
  onGenerate,
  onSave,
  onToggleCompleted,
  onDelete,
  error,
  success,
}) => {
  const loadingMessages = [
    "Consulting the grand library...",
    "Summoning monsters...",
    "Retrieving magical items...",
  ];

  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (!isGenerating) {
      setLoadingMessageIndex(0); // reset when done
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % loadingMessages.length);
    }, 1200); // change message every 1.2 seconds

    return () => clearInterval(interval);
  }, [isGenerating, loadingMessages.length]);

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h2>Generate a New One-Shot</h2>
          <p className="panel-subtitle">
            Create a ready-to-run adventure in seconds. Just choose your party
            size, level, and environment, and we’ll generate monsters, magic
            items, and story sparks to get you rolling.
          </p>
          <p className="panel-subtitle">
            Choose your party and setting, then let the library conjure an
            adventure.
          </p>
        </header>

        <form className="form" onSubmit={onGenerate}>
          <label className="field">
            <span className="field-label">One-Shot Name</span>
            <input
              type="text"
              placeholder="The Goblins of Grayhill"
              value={currentName}
              onChange={(e) => onNameChange(e.target.value)}
              required
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span className="field-label">Party Size</span>
              <input
                type="number"
                min={1}
                max={8}
                value={partySize}
                onChange={(e) => onPartySizeChange(Number(e.target.value))}
                required
              />
            </label>

            <label className="field">
              <span className="field-label">Average Level</span>
              <input
                type="number"
                min={1}
                max={20}
                value={averageLevel}
                onChange={(e) =>
                  onAverageLevelChange(Number(e.target.value))
                }
                required
              />
            </label>
          </div>

          <label className="field">
            <span className="field-label">Environment</span>
            <select
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value)}
              required
            >
              <option value="forest">Forest</option>
              <option value="dungeon">Dungeon</option>
              <option value="mountain">Mountain</option>
              <option value="city">City</option>
              <option value="swamp">Swamp</option>
            </select>
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={isGenerating}
            >
              {isGenerating ? "Summoning..." : "Generate"}
            </button>
            <span className="hint-text">
              {sessionPresent
                ? ""
                : "You can generate without signing in. Sign in if you want to save."}
            </span>
          </div>
        </form>

        {isGenerating && (
          <div className="loading-row">
            <div className="dice-spinner" />
            <span className="loading-text">
              {loadingMessages[loadingMessageIndex]}
            </span>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </section>

      {currentOneShot && (
        <OneShotDetail
          oneShot={currentOneShot}
          title={currentName || currentOneShot.title}
          editableTitle={true}
          onTitleChange={onNameChange}
          notes={currentNotes}
          onNotesChange={onNotesChange}
          actions={
            <>
              {!currentShotId && (
                <button className="btn-primary btn-forest" onClick={onSave}>
                  💾 Save this one-shot
                </button>
              )}
              {currentShotId && (
                <>
                  <button className="btn-secondary" onClick={onToggleCompleted}>
                    {currentCompleted
                      ? "⬜ Mark Incomplete"
                      : "✅ Mark Completed"}
                  </button>
                  <button
                    className="btn-secondary btn-danger"
                    onClick={onDelete}
                  >
                    🗑️ Delete
                  </button>
                </>
              )}
            </>
          }
        />
      )}
    </>
  );
};
