import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/colors";
import { MOCK_VENUES, Venue } from "@/context/BookingsContext";

const MOSUL_REGION = {
  latitude: 36.335,
  longitude: 43.119,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function VenueMarkerLabel({ name }: { name: string }) {
  return (
    <View style={markerStyles.container}>
      <View style={markerStyles.label}>
        <Text style={markerStyles.labelText} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={markerStyles.pin}>
        <Ionicons name="football" size={12} color="#fff" />
      </View>
      <View style={markerStyles.tail} />
    </View>
  );
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={MOSUL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {MOCK_VENUES.map(venue => (
          <Marker
            key={venue.id}
            coordinate={{ latitude: venue.lat, longitude: venue.lon }}
            onPress={() => setSelectedVenue(venue)}
          >
            <VenueMarkerLabel name={venue.name} />
          </Marker>
        ))}
      </MapView>

      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <View style={styles.headerPill}>
          <Ionicons name="map" size={16} color={Colors.primary} />
          <Text style={styles.headerPillText}>خريطة الملاعب</Text>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{MOCK_VENUES.length}</Text>
          </View>
        </View>
      </View>

      {selectedVenue && (
        <View style={[styles.venueCard, { bottom: insets.bottom + 100 }]}>
          <Pressable
            style={styles.venueCardInner}
            onPress={() => router.push(`/venue/${selectedVenue.id}`)}
          >
            <View style={[styles.venueCardColor, { backgroundColor: selectedVenue.imageColor }]}>
              <Ionicons name="football" size={20} color="rgba(255,255,255,0.6)" />
            </View>
            <View style={styles.venueCardInfo}>
              <Text style={styles.venueCardName}>{selectedVenue.name}</Text>
              <Text style={styles.venueCardLocation}>{selectedVenue.location}</Text>
              <View style={styles.venueCardMeta}>
                <View style={[styles.openDot, { backgroundColor: selectedVenue.isOpen ? Colors.primary : Colors.destructive }]} />
                <Text style={styles.venueCardStatus}>{selectedVenue.isOpen ? "مفتوح" : "مغلق"}</Text>
                <Text style={styles.venueCardPrice}>
                  {(selectedVenue.pricePerHour / 1000).toFixed(0)}k د.ع/س
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
          </Pressable>
          <Pressable style={styles.closeCard} onPress={() => setSelectedVenue(null)}>
            <Ionicons name="close" size={16} color={Colors.textSecondary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const markerStyles = StyleSheet.create({
  container: { alignItems: "center" },
  label: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  headerOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  headerPillText: { color: Colors.text, fontSize: 14, fontFamily: "Cairo_600SemiBold" },
  headerBadge: {
    backgroundColor: Colors.primary,
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 5,
  },
  headerBadgeText: { color: "#000", fontSize: 11, fontFamily: "Cairo_700Bold" },
  venueCard: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  venueCardInner: { flex: 1, flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  venueCardColor: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  venueCardInfo: { flex: 1, gap: 3 },
  venueCardName: { color: Colors.text, fontSize: 15, fontFamily: "Cairo_600SemiBold" },
  venueCardLocation: { color: Colors.textSecondary, fontSize: 12, fontFamily: "Cairo_400Regular" },
  venueCardMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  venueCardStatus: { color: Colors.textSecondary, fontSize: 12, fontFamily: "Cairo_400Regular" },
  venueCardPrice: { color: Colors.primary, fontSize: 12, fontFamily: "Cairo_600SemiBold" },
  closeCard: { padding: 14, alignSelf: "flex-start" },
});
