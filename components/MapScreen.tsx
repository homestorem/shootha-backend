import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { MOCK_VENUES } from "@/context/BookingsContext";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>خريطة الملاعب</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{MOCK_VENUES.length}</Text>
        </View>
      </View>

      <View style={styles.webNote}>
        <Ionicons name="phone-portrait-outline" size={16} color={Colors.textSecondary} />
        <Text style={styles.webNoteText}>الخريطة التفاعلية متاحة على التطبيق المحمول</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_VENUES.map(venue => (
          <Pressable
            key={venue.id}
            style={styles.card}
            onPress={() => router.push(`/venue/${venue.id}`)}
          >
            <View style={[styles.colorDot, { backgroundColor: venue.imageColor }]}>
              <Ionicons name="football" size={16} color="rgba(255,255,255,0.7)" />
            </View>
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{venue.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: venue.isOpen ? Colors.primary : Colors.destructive }]} />
              </View>
              <Text style={styles.location}>{venue.location}</Text>
              <View style={styles.coordRow}>
                <Ionicons name="location-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.coords}>
                  {venue.lat.toFixed(4)}, {venue.lon.toFixed(4)}
                </Text>
              </View>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.price}>{(venue.pricePerHour / 1000).toFixed(0)}k</Text>
              <Text style={styles.priceUnit}>د.ع/س</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 10,
  },
  headerTitle: { color: Colors.text, fontSize: 26, fontFamily: "Cairo_700Bold" },
  badge: {
    backgroundColor: Colors.primary, minWidth: 22, height: 22,
    borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  badgeText: { color: "#000", fontSize: 12, fontFamily: "Cairo_700Bold" },
  webNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 20, marginBottom: 14,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: Colors.card, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  webNoteText: { color: Colors.textSecondary, fontSize: 12, fontFamily: "Cairo_400Regular" },
  content: { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 14, gap: 12,
  },
  colorDot: {
    width: 44, height: 44, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: Colors.text, fontSize: 15, fontFamily: "Cairo_600SemiBold" },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  location: { color: Colors.textSecondary, fontSize: 12, fontFamily: "Cairo_400Regular" },
  coordRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  coords: { color: Colors.textTertiary, fontSize: 11, fontFamily: "Cairo_400Regular" },
  priceBadge: { alignItems: "center" },
  price: { color: Colors.primary, fontSize: 16, fontFamily: "Cairo_700Bold" },
  priceUnit: { color: Colors.textTertiary, fontSize: 10, fontFamily: "Cairo_400Regular" },
});
