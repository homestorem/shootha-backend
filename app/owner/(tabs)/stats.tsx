import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getApiUrl } from "@/lib/query-client";
import { OwnerStats } from "@/constants/owner";

function StatCard({
  icon,
  label,
  value,
  sub,
  colors,
  highlight,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: highlight ? colors.primary + "15" : colors.surface,
          borderColor: highlight ? colors.primary + "44" : colors.border,
        },
      ]}
    >
      <Ionicons name={icon as any} size={22} color={highlight ? colors.primary : colors.textSecondary} />
      <Text style={[styles.statValue, { color: highlight ? colors.primary : colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: colors.textTertiary }]}>{sub}</Text>}
    </View>
  );
}

function BarChart({
  data,
  colors,
  labelKey,
  valueKey,
  formatLabel,
}: {
  data: any[];
  colors: any;
  labelKey: string;
  valueKey: string;
  formatLabel: (item: any) => string;
}) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1);
  return (
    <View style={styles.chartContainer}>
      {data.map((item, i) => (
        <View key={i} style={styles.barCol}>
          <Text style={[styles.barCount, { color: colors.textTertiary }]}>
            {item[valueKey] > 0 ? item[valueKey] : ""}
          </Text>
          <View
            style={[
              styles.bar,
              {
                height: Math.max((item[valueKey] / max) * 100, item[valueKey] > 0 ? 4 : 2),
                backgroundColor: item[valueKey] > 0 ? colors.primary : colors.border,
              },
            ]}
          />
          <Text style={[styles.barLabel, { color: colors.textTertiary }]} numberOfLines={2}>
            {formatLabel(item)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function OwnerStatsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

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

  const { data: stats, isLoading } = useQuery<OwnerStats>({
    queryKey: ["/api/owner/stats", token],
    queryFn: () => authFetch("/api/owner/stats"),
    enabled: !!token,
    refetchInterval: 60000,
  });

  if (isLoading || !stats) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const day7Labels = stats.last7Days.map((d) => {
    const dt = new Date(d.date);
    return WEEKDAYS[dt.getDay()];
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        paddingTop: topPad + 8,
        paddingBottom: bottomPad + 90,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.screenTitle, { color: colors.text }]}>الإحصائيات</Text>

      <View style={styles.statsGrid}>
        <StatCard
          icon="calendar-outline"
          label="حجوزات التطبيق"
          value={String(stats.appBookings)}
          colors={colors}
          highlight
        />
        <StatCard
          icon="cash-outline"
          label="مجموع الإيراد"
          value={stats.totalRevenue.toLocaleString("ar-IQ")}
          sub="د.ع"
          colors={colors}
          highlight
        />
        <StatCard
          icon="today-outline"
          label="حجوزات اليوم"
          value={String(stats.todayBookings)}
          sub={
            stats.todayRevenue > 0
              ? `${stats.todayRevenue.toLocaleString("ar-IQ")} د.ع`
              : undefined
          }
          colors={colors}
        />
        <StatCard
          icon="pie-chart-outline"
          label="نسبة الإشغال"
          value={`${stats.occupancyRate}%`}
          sub="هذا الشهر"
          colors={colors}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>الحجوزات — آخر 7 أيام</Text>
        {stats.last7Days.every((d) => d.count === 0) ? (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyChartText, { color: colors.textTertiary }]}>لا توجد بيانات</Text>
          </View>
        ) : (
          <BarChart
            data={stats.last7Days}
            colors={colors}
            labelKey="count"
            valueKey="count"
            formatLabel={(item) => {
              const dt = new Date(item.date);
              return WEEKDAYS[dt.getDay()];
            }}
          />
        )}
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>أوقات الذروة</Text>
        {stats.peakHours.every((h) => h.count === 0) ? (
          <View style={styles.emptyChart}>
            <Ionicons name="time-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.emptyChartText, { color: colors.textTertiary }]}>لا توجد بيانات</Text>
          </View>
        ) : (
          <BarChart
            data={stats.peakHours}
            colors={colors}
            labelKey="count"
            valueKey="count"
            formatLabel={(item) => `${item.hour}`}
          />
        )}
        <Text style={[styles.peakHint, { color: colors.textTertiary }]}>
          الأرقام تمثل الساعة (08 — 23)
        </Text>
      </View>

      <View style={[styles.totalSummary, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "44" }]}>
        <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
        <Text style={[styles.totalSummaryText, { color: colors.text }]}>
          إجمالي {stats.totalBookings} حجز خلال كل الأوقات
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  screenTitle: { fontFamily: "Cairo_700Bold", fontSize: 22, marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  statValue: { fontFamily: "Cairo_700Bold", fontSize: 22, textAlign: "center" },
  statLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 12, textAlign: "center" },
  statSub: { fontFamily: "Cairo_400Regular", fontSize: 11, textAlign: "center" },
  section: { borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontFamily: "Cairo_700Bold", fontSize: 16, marginBottom: 16 },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 140,
    gap: 4,
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 4 },
  barCount: { fontFamily: "Cairo_700Bold", fontSize: 10 },
  bar: { width: "80%", borderRadius: 4, minHeight: 2 },
  barLabel: { fontFamily: "Cairo_400Regular", fontSize: 9, textAlign: "center" },
  emptyChart: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyChartText: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  peakHint: { fontFamily: "Cairo_400Regular", fontSize: 11, textAlign: "center", marginTop: 8 },
  totalSummary: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  totalSummaryText: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
});
