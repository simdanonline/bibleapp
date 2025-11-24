import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { BibleProvider } from "@/src/context/BibleContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <BibleProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="chapters"
            options={{
              title: "Chapters",
              headerBackTitle: "Back",
            }}
          />
          <Stack.Screen
            name="chapter-detail"
            options={{
              title: "Verses",
              headerBackTitle: "Back",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="plan-detail"
            options={{
              title: "Reading Plan",
              headerBackTitle: "Back",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
          <Stack.Screen
            name="privacy-policy"
            options={{ title: "Privacy Policy", headerBackTitle: "Back" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </BibleProvider>
  );
}
