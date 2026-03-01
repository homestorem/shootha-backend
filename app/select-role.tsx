import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/colors";

interface RoleCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  onPress: () => void;
  delay: number;
}

function RoleCard({ icon, title, subtitle, accent, onPress, delay }: RoleCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const enterAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(enterAnim, {
      toValue: 1,
      damping: 14,
      stiffness: 100,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: enterAnim,
          transform: [
            { scale: scaleAnim },
            {
              translateY: enterAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Pressable
        style={styles.roleCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.roleIconCircle, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
          <Ionicons name={icon} size={28} color={accent} />
        </View>
        <View style={styles.roleTextBlock}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleSubtitle}>{subtitle}</Text>
        </View>
        <View style={[styles.roleArrow, { backgroundColor: accent + "15" }]}>
          <Ionicons name="chevron-back" size={18} color={accent} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function SelectRoleScreen() {
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 40 : insets.bottom + 20;

  const handleGuest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await continueAsGuest();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoMini}>
            <Ionicons name="football" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Shoot'ha</Text>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.title}>اختر طريقة الدخول</Text>
          <Text style={styles.subtitle}>
            انضم إلى آلاف اللاعبين في الموصل{"\n"}وابدأ الحجز في ثوانٍ
          </Text>
        </View>

        <View style={styles.cardsSection}>
          <RoleCard
            icon="football"
            title="لاعب"
            subtitle="احجز ملاعب، دعوة أصدقاء، تقييم الملاعب"
            accent={Colors.primary}
            delay={100}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/auth/player/login");
            }}
          />

          <RoleCard
            icon="business"
            title="صاحب ملعب"
            subtitle="أدر ملعبك، تتبع الحجوزات، راقب الإيرادات"
            accent={Colors.blue}
            delay={200}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/auth/owner/login");
            }}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.divider} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.guestBtn,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleGuest}
        >
          <Ionicons name="eye-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.guestBtnText}>الدخول كضيف – تصفح فقط</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            بالمتابعة، أنت توافق على{" "}
            <Text style={styles.footerLink}>الشروط والأحكام</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 48,
  },
  logoMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(46,204,113,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(46,204,113,0.25)",
  },
  appName: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: "Cairo_700Bold",
  },
  heroSection: {
    marginBottom: 36,
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 30,
    fontFamily: "Cairo_700Bold",
    lineHeight: 42,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: "Cairo_400Regular",
    lineHeight: 24,
  },
  cardsSection: {
    gap: 12,
    marginBottom: 28,
  },
  cardWrapper: {
    width: "100%",
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  roleTextBlock: {
    flex: 1,
    gap: 3,
  },
  roleTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: "Cairo_700Bold",
  },
  roleSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
    lineHeight: 18,
  },
  roleArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textTertiary,
    fontSize: 13,
    fontFamily: "Cairo_400Regular",
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    marginBottom: 24,
  },
  guestBtnText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
  },
  footerLink: {
    color: Colors.primary,
    textDecorationLine: "underline",
  },
});
