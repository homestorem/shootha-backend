import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonCardProps {
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonCard({ height = 120, borderRadius = 16, style }: SkeletonCardProps) {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85],
  });

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.shimmer2, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonVenueCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.venueCard, { backgroundColor: colors.card }]}>
      <SkeletonCard height={160} borderRadius={16} style={styles.imageArea} />
      <View style={styles.textArea}>
        <SkeletonCard height={16} borderRadius={8} style={{ width: "60%" }} />
        <SkeletonCard height={12} borderRadius={6} style={{ width: "40%", marginTop: 6 }} />
        <SkeletonCard height={12} borderRadius={6} style={{ width: "30%", marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  venueCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  imageArea: { width: "100%", borderRadius: 0 },
  textArea: { padding: 14, gap: 4 },
});
