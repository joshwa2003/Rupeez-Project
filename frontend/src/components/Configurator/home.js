import React from "react";
import { useSettings } from "../context/SettingsContext";  // ✅ correct path
import { Text, Button } from "@chakra-ui/react";

export default function Home() {
  const { fontSize, primaryColor } = useSettings();  // 👈 use settings here

  return (
    <div style={{ padding: "20px" }}>
      <Text fontSize={fontSize}>
        Dynamic Font Size Example
      </Text>

      <Button bg={primaryColor} color="white" mt={4}>
        Primary Color Button
      </Button>
    </div>
  );
}
