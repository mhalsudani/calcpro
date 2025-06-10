import { useState, useEffect } from "react";
import { Calculator } from "@/components/Calculator";
import { CleanSimpleFileManager } from "@/components/CleanSimpleFileManager";
import { CloudFileManager } from "@/components/CloudFileManager";
import { PinSetup } from "@/components/PinSetup";
import { useTheme } from "@/hooks/useTheme";

type View = "calculator" | "pin-setup" | "file-manager";

export default function CalcPro() {
  const [currentView, setCurrentView] = useState<View>("calculator");
  const [currentUser, setCurrentUser] = useState<{ id: number; pin: string; subscriptionType?: string } | null>(null);
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setCurrentView("calculator");
  }, []);

  const handlePinSetup = (pin: string, userId: number) => {
    localStorage.setItem("calcpro_pin_setup", "true");
    setCurrentUser({ id: userId, pin, subscriptionType: pin === '1234' ? 'pro' : 'free' });
    setCurrentView("calculator");
  };

  const handleSecretAccess = async (userId: number, pin: string) => {
    console.log("handleSecretAccess called with:", { userId, pin });
    
    const user = {
      id: userId,
      pin: pin,
      subscriptionType: pin === '1234' ? 'pro' : 'free'
    };
    
    console.log("Setting user and view:", user);
    setCurrentUser(user);
    setCurrentView("file-manager");
  };

  const handleBackToCalculator = () => {
    setCurrentView("calculator");
  };

  const handleSetupNewPin = () => {
    setCurrentView("pin-setup");
  };

  const handleLanguageChange = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const renderFileManager = () => {
    if (!currentUser) return null;
    
    const renderFileManager = () => {
  if (!currentUser) return null;
  
  return (
    <CloudFileManager 
      userId={currentUser.id} 
      onBackToCalculator={handleBackToCalculator}
      language={language}
      onLanguageChange={handleLanguageChange}
      onThemeChange={toggleTheme}
    />
  );
};
    } else {
      return (
        <CleanSimpleFileManager 
          userId={currentUser.id} 
          userPin={currentUser.pin}
          onBackToCalculator={handleBackToCalculator}
        />
      );
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {currentView === "calculator" && (
          <Calculator 
            onSecretAccess={handleSecretAccess} 
            onSetupNewPin={handleSetupNewPin}
          />
        )}
        
        {currentView === "pin-setup" && (
          <PinSetup 
            onPinSetup={handlePinSetup}
            onBack={handleBackToCalculator}
          />
        )}
        
        {currentView === "file-manager" && renderFileManager()}
      </div>
    </div>
  );
}
