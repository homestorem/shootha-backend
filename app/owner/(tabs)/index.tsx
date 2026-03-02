import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getApiUrl } from "@/lib/query-client";
import {
  OwnerBooking,
  VenueOwner,
  getActiveBooking,
  getTimeRemaining,
  formatBookingTime,
  formatPrice,
  getTodayString,
} from "@/constants/owner";

const { width: W } = Dimensions.get("window");

const ADS = [
  { id: "1", text: "سجّل حجوزاتك اليومية بسهولة", sub: "لا حاجة للدفاتر الورقية", color: "#0D2B1D" },
  { id: "2", text: "تابع إيراداتك بالإحصائيات", sub: "تقارير يومية وشهرية وسنوية", color: "#0D1F2B" },
  { id: "3", text: "تطبيق شوطها للملاعب", sub: "الموصل • العراق", color: "#1E0D2B" },
];

function AdBanner() {
  const { colors } = useTheme();
  const flatRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % ADS.length;
        flatRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.adContainer, { backgroundColor: colors.surface }]}>
      <FlatList
        ref={flatRef}
        data={ADS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.adSlide, { backgroundColor: item.color, width: W - 32 }]}>
            <Text style={styles.adText}>{item.text}</Text>
            <Text style={styles.adSub}>{item.sub}</Text>
          </View>
        )}
      />
      <View style={styles.dotsRow}>
        {ADS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i === current ? colors.primary : colors.border }]}
          />
        ))}
      </View>
    </View>
  );
}

function CountdownTimer({ booking }: { booking: OwnerBooking }) {
  const [remaining, setRemaining] = useState(getTimeRemaining(booking));
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(getTimeRemaining(booking));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);
  return <Text style={styles.countdownText}>{remaining}</Text>;
}

export default function OwnerHomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const authFetch = useCallback(
    async (route: string) => {
      const url = new URL(route, getApiUrl()).toString();
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).message || res.statusText);
      }
      return res.json();
    },
    [token]
  );

  const { data: venueData, isLoading: venueLoading } = useQuery<VenueOwner>({
    queryKey: ["/api/owner/venue", token],
    queryFn: () => authFetch("/api/owner/venue"),
    enabled: !!token,
  });

  const { data: todayData, isLoading: bookingsLoading } = useQuery<{ bookings: OwnerBooking[] }>({
    queryKey: ["/api/owner/bookings/today", token],
    queryFn: () => authFetch("/api/owner/bookings?filter=today"),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const { data: allData } = useQuery<{ bookings: OwnerBooking[] }>({
    queryKey: ["/api/owner/bookings/all", token],
    queryFn: () => authFetch("/api/owner/bookings"),
    enabled: !!token,
    refetchInterval: 60000,
  });

  const todayBookings = todayData?.bookings ?? [];
  const allBookings = allData?.bookings ?? [];
  const activeBooking = getActiveBooking(todayBookings);
  const todayNonCancelled = todayBookings.filter((b) => b.status !== "cancelled");
  const todayRevenue = todayNonCancelled.reduce((sum, b) => sum + b.price * b.duration, 0);
  const recentBookings = [...allBookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const upcomingToday = todayNonCancelled.filter((b) => {
    const startH = parseInt(b.time.split(":")[0]);
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    return startH > nowH;
  });

  const s = makeStyles(colors);

  if (venueLoading || bookingsLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 80, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>
            مرحباً، {user?.name?.split(" ")[0] ?? "صاحب الملعب"}
          </Text>
          <Text style={s.venueName}>{venueData?.venueName ?? "ملعبك"}</Text>
        </View>
        <View style={[s.avatarBox, { backgroundColor: colors.primary + "22" }]}>
          <Ionicons name="football" size={24} color={colors.primary} />
        </View>
      </View>

      <AdBanner />

      {activeBooking ? (
        <View style={[s.activeCard, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "55" }]}>
          <View style={s.activeCardHeader}>
            <View style={[s.liveBadge, { backgroundColor: colors.primary }]}>
              <Text style={s.liveBadgeText}>جارية الآن</Text>
            </View>
            <CountdownTimer booking={activeBooking} />
          </View>
          <Text style={[s.activePlayerName, { color: colors.text }]}>{activeBooking.playerName}</Text>
          <View style={s.activeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[s.activeDetail, { color: colors.textSecondary }]}>
              {formatBookingTime(activeBooking)}
            </Text>
            <Ionicons name="football-outline" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={[s.activeDetail, { color: colors.textSecondary }]}>
              {activeBooking.fieldSize}
            </Text>
          </View>
          <Text style={[s.activePriceText, { color: colors.primary }]}>
            {formatPrice(activeBooking.price, activeBooking.duration)}
          </Text>
        </View>
      ) : (
        <View style={[s.noActiveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="moon-outline" size={28} color={colors.textTertiary} />
          <Text style={[s.noActiveText, { color: colors.textSecondary }]}>لا يوجد حجز جارٍ حالياً</Text>
        </View>
      )}

      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNum, { color: colors.primary }]}>{todayNonCancelled.length}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>حجوزات اليوم</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[s.statNum, { color: colors.primary }]}>{todayRevenue.toLocaleString("ar-IQ")}</Text>
          <Text style={[s.statLabel, { color: colors.textSecondary }]}>إيراد اليوم (د.ع)</Text>
        </View>
      </View>

      {upcomingToday.length > 0 && (
        <View style={[s.alertCard, { backgroundColor: "#F39C1218", borderColor: "#F39C1244" }]}>
          <Ionicons name="notifications-outline" size={16} color="#F39C12" />
          <Text style={[s.alertText, { color: "#F39C12" }]}>
            لديك {upcomingToday.length} حجز قادم اليوم
          </Text>
        </View>
      )}

      <Text style={[s.sectionTitle, { color: colors.text }]}>آخر الحجوزات</Text>

      {recentBookings.length === 0 ? (
        <View style={[s.emptyCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="calendar-outline" size={32} color={colors.textTertiary} />
          <Text style={[s.emptyText, { color: colors.textSecondary }]}>لا توجد حجوزات بعد</Text>
          <Text style={[s.emptySubText, { color: colors.textTertiary }]}>
            اذهب إلى تبويب الحجوزات لإضافة حجز يدوي
          </Text>
        </View>
      ) : (
        recentBookings.map((b) => (
          <View key={b.id} style={[s.recentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View
              style={[
                s.recentSourceDot,
                { backgroundColor: b.source === "app" ? colors.primary : "#F39C12" },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.recentPlayerName, { color: colors.text }]}>{b.playerName}</Text>
              <Text style={[s.recentMeta, { color: colors.textSecondary }]}>
                {b.date} • {formatBookingTime(b)}
              </Text>
            </View>
            <View style={[s.recentStatusBadge, { backgroundColor: statusColor(b.status) + "22" }]}>
              <Text style={[s.recentStatusText, { color: statusColor(b.status) }]}>
                {statusLabel(b.status)}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

function statusColor(status: string) {
  switch (status) {
    case "upcoming": return "#F39C12";
    case "active": return "#2ECC71";
    case "completed": return "#3498DB";
    case "cancelled": return "#E74C3C";
    default: return "#888";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "upcoming": return "قادم";
    case "active": return "جارٍ";
    case "completed": return "منتهٍ";
    case "cancelled": return "ملغى";
    default: return status;
  }
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    greeting: { fontFamily: "Cairo_400Regular", fontSize: 14, color: colors.textSecondary },
    venueName: { fontFamily: "Cairo_700Bold", fontSize: 22, color: colors.text },
    avatarBox: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    activeCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
    activeCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    liveBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
    liveBadgeText: { fontFamily: "Cairo_700Bold", fontSize: 12, color: "#000" },
    activePlayerName: { fontFamily: "Cairo_700Bold", fontSize: 20, marginBottom: 6 },
    activeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
    activeDetail: { fontFamily: "Cairo_400Regular", fontSize: 13 },
    activePriceText: { fontFamily: "Cairo_700Bold", fontSize: 16 },
    noActiveCard: { borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, alignItems: "center", gap: 6 },
    noActiveText: { fontFamily: "Cairo_400Regular", fontSize: 14 },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center" },
    statNum: { fontFamily: "Cairo_700Bold", fontSize: 22 },
    statLabel: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "center" },
    alertCard: { borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    alertText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
    sectionTitle: { fontFamily: "Cairo_700Bold", fontSize: 16, marginBottom: 10 },
    emptyCard: { borderRadius: 14, padding: 28, alignItems: "center", gap: 8 },
    emptyText: { fontFamily: "Cairo_600SemiBold", fontSize: 15 },
    emptySubText: { fontFamily: "Cairo_400Regular", fontSize: 12, textAlign: "center" },
    recentCard: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    recentSourceDot: { width: 10, height: 10, borderRadius: 5 },
    recentPlayerName: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
    recentMeta: { fontFamily: "Cairo_400Regular", fontSize: 12 },
    recentStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    recentStatusText: { fontFamily: "Cairo_600SemiBold", fontSize: 11 },
  });
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  adContainer: { borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 100 },
  adSlide: { height: 80, justifyContent: "center", paddingHorizontal: 20 },
  adText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#fff" },
  adSub: { fontFamily: "Cairo_400Regular", fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  dotsRow: { flexDirection: "row", justifyContent: "center", gap: 5, paddingVertical: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  countdownText: { fontFamily: "Cairo_700Bold", fontSize: 18, color: "#2ECC71" },
});
