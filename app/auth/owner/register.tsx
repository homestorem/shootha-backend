import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useAuth, PENDING_REG_KEY, PendingOwnerData } from "@/context/AuthContext";
import { AuthInput } from "@/components/AuthInput";
import { MapPicker } from "@/components/MapPicker";

const MOSUL_LAT = 36.335;
const MOSUL_LON = 43.119;

const FIELD_SIZES = ["5 ضد 5", "7 ضد 7", "11 ضد 11"];

export default function OwnerRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { sendOtp } = useAuth();

  const [name, setName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [areaName, setAreaName] = useState("");
  const [fieldSize, setFieldSize] = useState(FIELD_SIZES[0]);
  const [bookingPrice, setBookingPrice] = useState("");
  const [hasBathrooms, setHasBathrooms] = useState(false);
  const [hasMarket, setHasMarket] = useState(false);
  const [latitude, setLatitude] = useState(MOSUL_LAT);
  const [longitude, setLongitude] = useState(MOSUL_LON);
  const [locationSelected, setLocationSelected] = useState(false);

  const [nameError, setNameError] = useState("");
  const [venueNameError, setVenueNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [areaNameError, setAreaNameError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleLocationSelect = (lat: number, lon: number) => {
    setLatitude(lat);
    setLongitude(lon);
    setLocationSelected(true);
    setLocationError("");
  };

  const validate = () => {
    let valid = true;

    if (!name.trim()) { setNameError("اسم المالك مطلوب"); valid = false; } else setNameError("");
    if (!venueName.trim()) { setVenueNameError("اسم الملعب مطلوب"); valid = false; } else setVenueNameError("");
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
      setPhoneError("رقم الهاتف غير صحيح"); valid = false;
    } else setPhoneError("");

    if (!password.trim()) {
      setPasswordError("كلمة المرور مطلوبة"); valid = false;
    } else if (password.length < 6) {
      setPasswordError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); valid = false;
    } else setPasswordError("");

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("تأكيد كلمة المرور مطلوب"); valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("كلمتا المرور غير متطابقتين"); valid = false;
    } else setConfirmPasswordError("");

    if (!areaName.trim()) { setAreaNameError("اسم المنطقة مطلوب"); valid = false; } else setAreaNameError("");

    const priceNum = parseFloat(bookingPrice);
    if (!bookingPrice.trim()) {
      setPriceError("سعر الحجز مطلوب"); valid = false;
    } else if (isNaN(priceNum) || priceNum <= 0) {
      setPriceError("يجب أن يكون السعر رقماً موجباً"); valid = false;
    } else setPriceError("");

    if (!locationSelected && Platform.OS !== "web") {
      setLocationError("يرجى تحديد موقع الملعب على الخريطة");
      valid = false;
    } else if (Platform.OS === "web" && (latitude === MOSUL_LAT && longitude === MOSUL_LON)) {
      setLocationError("");
    } else setLocationError("");

    return valid;
  };

  const handleNext = async () => {
    if (!validate()) return;
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const pendingData: PendingOwnerData = {
        name: name.trim(),
        phone: phone.trim(),
        password,
        venueName: venueName.trim(),
        areaName: areaName.trim(),
        fieldSize,
        bookingPrice: bookingPrice.trim(),
        hasBathrooms,
        hasMarket,
        latitude: String(latitude),
        longitude: String(longitude),
      };
      await AsyncStorage.setItem(PENDING_REG_KEY, JSON.stringify(pendingData));

      const res = await sendOtp(phone.trim());
      router.push({
        pathname: "/auth/owner/verify-otp",
        params: {
          phone: phone.trim(),
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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.roleIcon}>
            <Ionicons name="business" size={32} color={Colors.blue} />
          </View>
          <Text style={styles.title}>تسجيل ملعب جديد</Text>
          <Text style={styles.subtitle}>أضف ملعبك وابدأ استقبال الحجوزات اليوم</Text>
        </View>

        <View style={styles.form}>
          <AuthInput
            label="اسم المالك"
            icon="person-outline"
            placeholder="اسم صاحب الملعب"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(""); }}
            error={nameError}
          />

          <AuthInput
            label="اسم الملعب"
            icon="football-outline"
            placeholder="ملعب النجوم"
            value={venueName}
            onChangeText={(v) => { setVenueName(v); setVenueNameError(""); }}
            error={venueNameError}
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
            label="كلمة المرور"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(""); }}
            isPassword
            error={passwordError}
          />

          <AuthInput
            label="تأكيد كلمة المرور"
            icon="lock-closed-outline"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setConfirmPasswordError(""); }}
            isPassword
            error={confirmPasswordError}
          />

          <AuthInput
            label="اسم المنطقة / الحي"
            icon="map-outline"
            placeholder="حي النور"
            value={areaName}
            onChangeText={(v) => { setAreaName(v); setAreaNameError(""); }}
            error={areaNameError}
          />

          <View style={styles.fieldSizeSection}>
            <Text style={styles.sectionLabel}>حجم الملعب</Text>
            <View style={styles.fieldSizeRow}>
              {FIELD_SIZES.map(size => (
                <Pressable
                  key={size}
                  style={[styles.sizeBtn, fieldSize === size && styles.sizeBtnActive]}
                  onPress={() => setFieldSize(size)}
                >
                  <Ionicons
                    name="football"
                    size={14}
                    color={fieldSize === size ? "#000" : Colors.textSecondary}
                  />
                  <Text style={[styles.sizeBtnText, fieldSize === size && styles.sizeBtnTextActive]}>
                    {size}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <AuthInput
            label="سعر الحجز (دينار / ساعة)"
            icon="cash-outline"
            placeholder="25000"
            value={bookingPrice}
            onChangeText={(v) => { setBookingPrice(v); setPriceError(""); }}
            keyboardType="numeric"
            error={priceError}
          />

          <View style={styles.togglesSection}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="water-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.toggleLabel}>غرف تبديل ودورات مياه</Text>
              </View>
              <Switch
                value={hasBathrooms}
                onValueChange={setHasBathrooms}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={hasBathrooms ? "#000" : Colors.textTertiary}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Ionicons name="storefront-outline" size={18} color={Colors.textSecondary} />
                <Text style={styles.toggleLabel}>بسطة / كافيتيريا</Text>
              </View>
              <Switch
                value={hasMarket}
                onValueChange={setHasMarket}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={hasMarket ? "#000" : Colors.textTertiary}
              />
            </View>
          </View>

          <View style={styles.mapSection}>
            <Text style={styles.sectionLabel}>موقع الملعب على الخريطة</Text>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={handleLocationSelect}
            />
            {locationError ? (
              <Text style={styles.errorText}>{locationError}</Text>
            ) : locationSelected ? (
              <View style={styles.locationConfirm}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
                <Text style={styles.locationConfirmText}>تم تحديد الموقع</Text>
              </View>
            ) : null}
          </View>

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
  content: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
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
  sectionLabel: { color: Colors.textSecondary, fontSize: 13, fontFamily: "Cairo_600SemiBold" },
  fieldSizeSection: { gap: 10 },
  fieldSizeRow: { flexDirection: "row", gap: 8 },
  sizeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
  },
  sizeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sizeBtnText: { color: Colors.textSecondary, fontSize: 13, fontFamily: "Cairo_600SemiBold" },
  sizeBtnTextActive: { color: "#000" },
  togglesSection: {
    backgroundColor: Colors.card, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    overflow: "hidden",
  },
  toggleRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  toggleInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggleLabel: { color: Colors.text, fontSize: 14, fontFamily: "Cairo_400Regular" },
  mapSection: { gap: 8 },
  errorText: { color: Colors.destructive, fontSize: 12, fontFamily: "Cairo_400Regular" },
  locationConfirm: { flexDirection: "row", alignItems: "center", gap: 5 },
  locationConfirmText: { color: Colors.primary, fontSize: 12, fontFamily: "Cairo_400Regular" },
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
