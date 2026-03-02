import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lon: number) => void;
}

export function MapPicker({ latitude, longitude, onLocationSelect }: MapPickerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="location-outline" size={20} color={Colors.textSecondary} />
      <Text style={styles.title}>إحداثيات الموقع</Text>
      <View style={styles.coordRow}>
        <View style={styles.coordInput}>
          <Text style={styles.coordLabel}>خط العرض</Text>
          <TextInput
            style={styles.coordField}
            value={String(latitude)}
            onChangeText={(v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) onLocationSelect(n, longitude);
            }}
            keyboardType="decimal-pad"
            placeholder="36.335"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
        <View style={styles.coordInput}>
          <Text style={styles.coordLabel}>خط الطول</Text>
          <TextInput
            style={styles.coordField}
            value={String(longitude)}
            onChangeText={(v) => {
              const n = parseFloat(v);
              if (!isNaN(n)) onLocationSelect(latitude, n);
            }}
            keyboardType="decimal-pad"
            placeholder="43.119"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        أدخل إحداثيات الموصل (خط العرض: 36.2-36.5، خط الطول: 43.0-43.3)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    padding: 16,
    gap: 12,
    alignItems: "center",
  },
  title: { color: Colors.textSecondary, fontSize: 14, fontFamily: "Cairo_600SemiBold" },
  coordRow: { flexDirection: "row", gap: 12, width: "100%" },
  coordInput: { flex: 1, gap: 6 },
  coordLabel: { color: Colors.textSecondary, fontSize: 12, fontFamily: "Cairo_600SemiBold", textAlign: "right" },
  coordField: {
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: Colors.text, fontFamily: "Cairo_400Regular", fontSize: 14, textAlign: "right",
  },
  hint: { color: Colors.textTertiary, fontSize: 11, fontFamily: "Cairo_400Regular", textAlign: "center" },
});
