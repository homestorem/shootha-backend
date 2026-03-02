import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { useLang } from "@/context/LanguageContext";

function PulseText({ text }: { text: string }) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text
      style={[styles.comingSoon, { color: colors.primary, transform: [{ scale: pulse }] }]}
    >
      {text}
    </Animated.Text>
  );
}

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLang();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topPadding, paddingBottom: bottomPadding, backgroundColor: colors.background },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="bag-handle" size={52} color={Colors.primary} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{t("storeTab")}</Text>
          <View style={styles.underline} />
        </View>

        <PulseText text={t("comingSoon")} />

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {t("storeDesc")}
        </Text>

        <View style={styles.placeholders}>
          {[
            { icon: "shirt-outline", label: "منتجات رياضية" },
            { icon: "cart-outline", label: "سلة التسوق" },
            { icon: "pricetag-outline", label: "عروض وخصومات" },
          ].map(({ icon, label }) => (
            <View
              key={icon}
              style={[
                styles.placeholderRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Ionicons name={icon as any} size={20} color={colors.textTertiary} />
              <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 36,
    gap: 20,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "rgba(46,204,113,0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(46,204,113,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  titleBlock: { alignItems: "center", gap: 6 },
  title: {
    fontSize: 36,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  underline: {
    height: 3,
    width: 60,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  comingSoon: {
    fontSize: 24,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  placeholders: {
    marginTop: 12,
    gap: 12,
    alignSelf: "stretch",
  },
  placeholderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    justifyContent: "flex-end",
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
  },
});
