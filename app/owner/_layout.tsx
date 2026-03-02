import { Stack, router } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function OwnerLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "owner")) {
      router.replace("/select-role");
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
