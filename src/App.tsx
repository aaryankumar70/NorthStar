import { AuthProvider, useAuth } from "@/lib/auth";
import { AuthPage } from "@/components/AuthPage";
import { Onboarding } from "@/components/Onboarding";
import { Dashboard } from "@/components/Dashboard";
import { SettingsPage } from "@/components/SettingsPage";
import { LandingPage } from "@/components/LandingPage";
import { Logo } from "@/components/Logo";
import { useState } from "react";

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [authView, setAuthView] = useState<"landing" | "auth">("landing");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 scale-in">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200/40" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Logo className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <p className="text-sm text-slate-400 animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    if (authView === "auth") {
      return (
        <AuthPage
          initialMode={authMode}
          onBack={() => setAuthView("landing")}
        />
      );
    }
    return (
      <LandingPage
        onGetStarted={() => {
          setAuthMode("signup");
          setAuthView("auth");
        }}
        onSignIn={() => {
          setAuthMode("signin");
          setAuthView("auth");
        }}
      />
    );
  }

  if (showSettings) {
    return <SettingsPage onBack={() => setShowSettings(false)} />;
  }

  if (!profile?.onboarded) {
    return <Onboarding />;
  }

  return <Dashboard onNavigateSettings={() => setShowSettings(true)} />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-bg min-h-screen">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
