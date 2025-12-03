// src/components/MyOneshotsView.tsx
import React from "react";
import { OneShot, SavedOneShotSummary } from "../types";
import { OneShotDetail } from "./OneShotDetail";

type MyOneshotsViewProps = {
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

export const MyOneshotsView: React.FC<MyOneshotsViewProps> = ({
  sessionPresent,
  savedShots,
  currentOneShot,
  currentName,
  currentCompleted,
  currentNotes,
  onNotesChange,
  onOpenShot,
  onBackToShelf,
  onToggleCompletedShot,
  onDeleteShot,
  onToggleCompletedCurrent,
  onDeleteCurrent,
  onRenameCurrent,
  error,
  success,
}) => {
  const showingShelf = !currentOneShot;

  return (
    <>
      {showingShelf && (
        <section className="panel">
          <header className="panel-header">
            <h2>My One-Shots</h2>
            <p className="panel-subtitle">
              Saved adventures from your personal shelf.
            </p>
          </header>

          <div className="oneshot-grid">
            {!sessionPresent ? (
              <p className="hint-text">Sign in to see your saved one-shots.</p>
            ) : savedShots.length === 0 ? (
              <p className="hint-text">
                No one-shots yet. Generate one and save it!
              </p>
            ) : (
              savedShots.map((shot) => (
                <article
                  key={shot.id}
                  className="oneshot-card"
                  onClick={() => onOpenShot(shot.id)}
                >
                  <div className="oneshot-card-body">
                    <div className="oneshot-name">{shot.name}</div>
                    <div className="oneshot-meta">
                      <span className="oneshot-date">
                        {new Date(shot.created_at).toLocaleString()}
                      </span>
                      <span
                        className={
                          "oneshot-status" +
                          (shot.completed ? " completed" : "")
                        }
                      >
                        {shot.completed ? "✅ Completed" : "⬜ Not completed"}
                      </span>
                    </div>
                  </div>
                  <div className="oneshot-card-actions">
                    <button
                      className="btn-icon"
                      title="Toggle completed"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCompletedShot(shot);
                      }}
                    >
                      {shot.completed ? "⬜" : "✅"}
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteShot(shot);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </section>
      )}

      {currentOneShot && (
        <OneShotDetail
          oneShot={currentOneShot}
          title={currentName || currentOneShot.title}
          editableTitle={true}
          onTitleChange={onRenameCurrent}
          headerRight={
            <button className="btn-secondary" onClick={onBackToShelf}>
              ← Back to shelf
            </button>
          }
          notes={currentNotes}
          onNotesChange={onNotesChange}
          actions={
            <>
              <button
                className="btn-secondary"
                onClick={onToggleCompletedCurrent}
              >
                {currentCompleted ? "⬜ Mark Incomplete" : "✅ Mark Completed"}
              </button>
              <button
                className="btn-secondary btn-danger"
                onClick={onDeleteCurrent}
              >
                🗑️ Delete
              </button>
            </>
          }
        />
      )}
    </>
  );
};
