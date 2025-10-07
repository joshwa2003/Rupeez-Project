import i18n from "i18next";
import './i18n';

import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      settings: "Settings",
      language: "Language",
      theme: "Theme",
      fontSize: "Font Size",
      primaryColor: "Primary Color"
    }
  },
  ta: {
    translation: {
      settings: "அமைப்புகள்",
      language: "மொழி",
      theme: "தீம்",
      fontSize: "எழுத்து அளவு",
      primaryColor: "முதன்மை நிறம்"
    }
  },
  hi: {
    translation: {
      settings: "सेटिंग्स",
      language: "भाषा",
      theme: "थीम",
      fontSize: "फ़ॉन्ट आकार",
      primaryColor: "प्राथमिक रंग"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
