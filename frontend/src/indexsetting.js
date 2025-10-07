import { SettingsProvider } from "./context/SettingsContext";
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ChakraProvider>
  </React.StrictMode>
);
