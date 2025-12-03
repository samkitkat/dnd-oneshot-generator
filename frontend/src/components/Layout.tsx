// src/components/Layout.tsx
import React from "react";
import type { Tab } from "../useOneShots";

type LayoutProps = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  userEmail: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({
  activeTab,
  onTabChange,
  userEmail,
  onSignIn,
  onSignOut,
  children,
}) => {
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
            onClick={() => onTabChange("generate")}
          >
            Generate
          </button>
          <button
            className={
              "nav-link" + (activeTab === "myshots" ? " nav-link-active" : "")
            }
            onClick={() => onTabChange("myshots")}
          >
            My One-Shots
          </button>
          <div className="sidebar-auth">
            {!userEmail ? (
              <button className="btn-primary" onClick={onSignIn}>
                Sign in with Google
              </button>
            ) : (
              <button className="nav-link" onClick={onSignOut}>
                Sign out
              </button>
            )}
          </div>
        </nav>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
};
