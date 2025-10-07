// ✅ Put all imports at the very top
import React, { useState } from "react";
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  Flex,
  Switch,
  Text,
  useColorMode,
  useColorModeValue
} from "@chakra-ui/react";

// Simple horizontal separator
function HSeparator() {
  return <Box h="1px" bg="gray.300" my="12px" />;
}

export default function Configurator(props) {
  const {
    isOpen,
    onClose,
    onSwitch,
    onLanguageChange,
    onPrimaryColorChange,
    onFontSizeChange,
    onNotificationToggle,
    onTimeFormatChange,
    onLogout
  } = props;

  const [navbarFixed, setNavbarFixed] = useState(false);

  const { colorMode, toggleColorMode } = useColorMode();
  const bgDrawer = useColorModeValue("white", "gray.800");

  // Apply changes to parent
  const handleApply = () => {
    onSwitch?.(navbarFixed);
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      placement={document.documentElement.dir === "rtl" ? "left" : "right"}
    >
      <DrawerContent bg={bgDrawer}>
        <DrawerCloseButton />
        <DrawerHeader>Settings</DrawerHeader>

        <DrawerBody>
          <Flex direction="column" gap="20px">
            {/* 📌 Navbar Fixed */}
            <Flex justify="space-between" align="center">
              <Text>Navbar Fixed</Text>
              <Switch
                isChecked={navbarFixed}
                onChange={() => setNavbarFixed(!navbarFixed)}
              />
            </Flex>

            {/* 🌙 Theme */}
            <Flex justify="space-between" align="center">
              <Text>Theme</Text>
              <Button size="sm" onClick={toggleColorMode}>
                Toggle {colorMode === "light" ? "Dark" : "Light"}
              </Button>
            </Flex>

            <HSeparator />

            {/* 🚪 Logout */}
            <Button colorScheme="red" onClick={onLogout}>
              Log Out
            </Button>

            <Button mt={4} colorScheme="blue" onClick={handleApply}>
              Apply Changes
            </Button>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
