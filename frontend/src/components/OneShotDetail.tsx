// src/components/OneShotDetail.tsx
import React, { useEffect, useState } from "react";
import { OneShot } from "../types";

type OneShotDetailProps = {
  oneShot: OneShot;
  title: string;
  headerRight?: React.ReactNode;
  actions?: React.ReactNode;
  editableTitle?: boolean;
  onTitleChange?: (value: string) => void;
};

export const OneShotDetail: React.FC<OneShotDetailProps> = ({
  oneShot,
  title,
  headerRight,
  actions,
  editableTitle,
  onTitleChange,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    setDraftTitle(title);
  }, [title]);

  const commitTitle = () => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setDraftTitle(title);
      setIsEditingTitle(false);
      return;
    }
    if (trimmed !== title && onTitleChange) {
      onTitleChange(trimmed);
    }
    setIsEditingTitle(false);
  };

  return (
    <section className="panel panel-results">
      <header className="panel-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <div>
            <div className="title-row">
              {isEditingTitle ? (
                <input
                  className="title-edit-input"
                  value={draftTitle}
                  autoFocus
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTitle();
                    if (e.key === "Escape") {
                      setDraftTitle(title);
                      setIsEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <>
                  <h2>{title}</h2>
                  {editableTitle && (
                    <button
                      type="button"
                      className="btn-icon title-edit-button"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      ✏️
                    </button>
                  )}
                </>
              )}
            </div>
            <p className="hook-text">{oneShot.hook}</p>
            <p className="meta-text">
              Party of {oneShot.partySize}, level {oneShot.averageLevel} —{" "}
              Environment: {oneShot.environment}.
            </p>
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>

        {actions && <div className="results-actions">{actions}</div>}
      </header>

      <div className="section-block">
        <h3>Bestiary Entries</h3>
        <div className="card-grid">
          {oneShot.monsters.map((m) => (
            <article key={m.name} className="monster-card">
              <header className="monster-card-header">
                <div>
                  <h4 className="monster-name">{m.name}</h4>
                  <div className="monster-subtitle">
                    {[m.size, m.type, m.alignment].filter(Boolean).join(" ")}
                  </div>
                </div>
                <span className="monster-cr">CR {m.cr}</span>
              </header>
              <div className="monster-divider" />
              <div className="monster-stats">
                <div className="stat">
                  <span className="stat-label">Armor Class</span>
                  <span className="stat-value">{m.ac}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Hit Points</span>
                  <span className="stat-value">
                    {m.hp} ({m.hitDice || "—"})
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Speed</span>
                  <span className="stat-value">{m.speed || "—"}</span>
                </div>
              </div>
              <div className="abilities-row">
                {(["str", "dex", "con", "int", "wis", "cha"] as const).map(
                  (k) => (
                    <div key={k} className="ability">
                      <span className="ability-label">{k.toUpperCase()}</span>
                      <span className="ability-value">{m.stats[k]}</span>
                    </div>
                  )
                )}
              </div>
              {(m.senses || m.languages) && (
                <div className="monster-extra">
                  {m.senses && (
                    <div>
                      <span className="extra-label">Senses</span>{" "}
                      <span className="extra-value">{m.senses}</span>
                    </div>
                  )}
                  {m.languages && (
                    <div>
                      <span className="extra-label">Languages</span>{" "}
                      <span className="extra-value">{m.languages}</span>
                    </div>
                  )}
                </div>
              )}
              {m.actions && m.actions.length > 0 && (
                <div className="monster-actions">
                  <div className="monster-subtitle">Actions</div>
                  {m.actions.slice(0, 3).map((a) => (
                    <div key={a.name} className="action">
                      <span className="action-name">{a.name}.</span>
                      <span className="action-text">{a.desc}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="section-block">
        <h3>Treasures &amp; Curiosities</h3>
        <div className="card-grid card-grid-loot">
          {oneShot.loot.map((item) => (
            <article key={item.name} className="loot-card">
              <header className="loot-card-header">
                <h4 className="loot-name">{item.name}</h4>
              </header>
              <div className="loot-body">
                <div className="loot-meta">
                  {item.type && <span className="loot-type">{item.type}</span>}
                  {item.rarity && (
                    <span className="loot-rarity">{item.rarity}</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
