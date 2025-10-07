import React, { createContext, useContext, useState } from "react";
import i18n from "../i18n";   // ✅ correct path to i18n.js

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [fontSize, setFontSize] = useState("md");      // sm | md | lg
  const [primaryColor, setPrimaryColor] = useState("#3182ce");

  const changeLanguage = (lng) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  return (
    <SettingsContext.Provider
      value={{ language, fontSize, primaryColor, changeLanguage, setFontSize, setPrimaryColor }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
