import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { AuthInput } from "@/components/AuthInput";

export default function OwnerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [venueName, setVenueName] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [venueNameError, setVenueNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const validate = () => {
    let valid = true;
    if (!name.trim()) { setNameError("الاسم مطلوب"); valid = false; } else setNameError("");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) { setPhoneError("رقم الهاتف غير صحيح"); valid = false; } else setPhoneError("");
    if (!venueName.trim()) { setVenueNameError("اسم الملعب مطلوب"); valid = false; } else setVenueNameError("");
    return valid;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await sendOtp(phone.trim());
      router.push({
        pathname: "/auth/owner/verify-otp",
        params: {
          phone: phone.trim(),
          name: name.trim(),
          venueName: venueName.trim(),
          mode: "register",
          role: "owner",
          devOtp: res.devOtp ?? "",
        },
      });
    } catch (e: any) {
      Alert.alert("خطأ", e?.message ?? "حدث خطأ");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heroSection}>
          <View style={styles.roleIcon}>
            <Ionicons name="business" size={32} color={Colors.blue} />
          </View>
          <Text style={styles.title}>تسجيل ملعب جديد</Text>
          <Text style={styles.subtitle}>أضف ملعبك وابدأ استقبال الحجوزات اليوم</Text>
        </View>

        <View style={styles.form}>
          <AuthInput
            label="اسمك الكامل"
            icon="person-outline"
            placeholder="اسم صاحب الملعب"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(""); }}
            error={nameError}
          />
          <AuthInput
            label="رقم الهاتف"
            icon="call-outline"
            placeholder="07XX XXX XXXX"
            value={phone}
            onChangeText={(v) => { setPhone(v); setPhoneError(""); }}
            keyboardType="phone-pad"
            error={phoneError}
          />
          <AuthInput
            label="اسم الملعب"
            icon="football-outline"
            placeholder="ملعب النجوم"
            value={venueName}
            onChangeText={(v) => { setVenueName(v); setVenueNameError(""); }}
            error={venueNameError}
          />

          <Pressable
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Ionicons name={isLoading ? "hourglass-outline" : "checkmark-circle"} size={20} color="#fff" />
            <Text style={styles.submitBtnText}>{isLoading ? "جاري الإرسال..." : "إرسال رمز التحقق"}</Text>
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginHint}>لديك حساب؟</Text>
          <Pressable onPress={() => router.replace("/auth/owner/login")}>
            <Text style={styles.loginLink}>تسجيل الدخول</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.card, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.border,
  },
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, gap: 0 },
  heroSection: { alignItems: "center", gap: 12, marginBottom: 36 },
  roleIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(0,122,255,0.1)",
    borderWidth: 2, borderColor: "rgba(0,122,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  title: { color: Colors.text, fontSize: 24, fontFamily: "Cairo_700Bold", textAlign: "center" },
  subtitle: { color: Colors.textSecondary, fontSize: 14, fontFamily: "Cairo_400Regular", textAlign: "center", lineHeight: 22 },
  form: { gap: 16, marginBottom: 24 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.blue, borderRadius: 14, paddingVertical: 15, marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: Colors.disabled },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "Cairo_700Bold" },
  loginRow: { flexDirection: "row", justifyContent: "center", gap: 6, alignItems: "center" },
  loginHint: { color: Colors.textSecondary, fontSize: 14, fontFamily: "Cairo_400Regular" },
  loginLink: { color: Colors.blue, fontSize: 14, fontFamily: "Cairo_600SemiBold" },
});
