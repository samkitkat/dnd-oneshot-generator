// src/App.tsx
import React from "react";
import { useAuth } from "./useAuth";
import { useOneShots } from "./useOneShots";
import { Layout } from "./components/Layout";
import { GenerateView } from "./components/GenerateView";
import { MyOneshotsView } from "./components/MyOneshotsView";

const App: React.FC = () => {
  const { session, userEmail, handleSignIn, handleSignOut } = useAuth();
  const { activeTab, handleTabChange, generateProps, myShotsProps } =
    useOneShots(session);

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      userEmail={userEmail}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    >
      {activeTab === "generate" && <GenerateView {...generateProps} />}
      {activeTab === "myshots" && <MyOneshotsView {...myShotsProps} />}
    </Layout>
  );
};

export default App;
