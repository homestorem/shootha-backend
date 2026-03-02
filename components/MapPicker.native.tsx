import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={(e: any) => {
          const { latitude: lat, longitude: lon } = e.nativeEvent.coordinate;
          onLocationSelect(lat, lon);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          draggable
          onDragEnd={(e: any) => {
            const { latitude: lat, longitude: lon } = e.nativeEvent.coordinate;
            onLocationSelect(lat, lon);
          }}
          pinColor={Colors.primary}
        />
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.coordText}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>
      <View style={styles.hint}>
        <Text style={styles.hintText}>اضغط على الخريطة أو اسحب الدبوس لتحديد الموقع</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    overflow: "hidden",
    height: 260,
    borderWidth: 1,
    borderColor: Colors.border,
    position: "relative",
  },
  map: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 36,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coordText: { color: Colors.text, fontSize: 11, fontFamily: "Cairo_400Regular" },
  hint: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  hintText: { color: Colors.textSecondary, fontSize: 11, fontFamily: "Cairo_400Regular" },
});
