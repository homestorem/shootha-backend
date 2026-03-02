import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetch } from "expo/fetch";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getApiUrl } from "@/lib/query-client";
import {
  OwnerBooking,
  VenueOwner,
  BOOKING_HOURS,
  DURATION_OPTIONS,
  formatHour,
  formatBookingTime,
  formatPrice,
  getTodayString,
} from "@/constants/owner";

type FilterTab = "today" | "month" | "year";
const FILTER_LABELS: Record<FilterTab, string> = {
  today: "اليوم",
  month: "هذا الشهر",
  year: "هذه السنة",
};

const NEXT_7_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    date: d.toISOString().split("T")[0],
    label:
      i === 0
        ? "اليوم"
        : i === 1
        ? "غداً"
        : d.toLocaleDateString("ar-IQ", { weekday: "short", day: "numeric" }),
  };
});

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

type TimeSlot = {
  hour: number;
  booking: OwnerBooking | null;
  isStart: boolean;
};

function buildTimeSlots(bookings: OwnerBooking[]): TimeSlot[] {
  return BOOKING_HOURS.map((hour) => {
    const booking =
      bookings.find((b) => {
        if (b.status === "cancelled") return false;
        const startH = parseInt(b.time.split(":")[0]);
        return hour >= startH && hour < startH + b.duration;
      }) ?? null;
    const isStart = booking ? parseInt(booking.time.split(":")[0]) === hour : false;
    return { hour, booking, isStart };
  });
}

function SlotRow({
  slot,
  colors,
  onTapBooking,
  onTapEmpty,
}: {
  slot: TimeSlot;
  colors: any;
  onTapBooking: (b: OwnerBooking) => void;
  onTapEmpty: (hour: number) => void;
}) {
  const isApp = slot.booking?.source === "app";
  const bgColor = slot.booking
    ? isApp
      ? colors.primary + "22"
      : "#F39C1218"
    : colors.surface;
  const borderColor = slot.booking ? (isApp ? colors.primary + "44" : "#F39C1244") : colors.border;

  return (
    <Pressable
      onPress={() => {
        if (slot.booking && slot.isStart) {
          onTapBooking(slot.booking);
        } else if (!slot.booking) {
          onTapEmpty(slot.hour);
        }
      }}
      style={[slotStyles.row, { backgroundColor: bgColor, borderColor }]}
    >
      <Text style={[slotStyles.timeLabel, { color: colors.textTertiary }]}>
        {String(slot.hour).padStart(2, "0")}:00
      </Text>
      <View style={slotStyles.slotContent}>
        {slot.booking ? (
          slot.isStart ? (
            <View style={slotStyles.bookingInfo}>
              <Text style={[slotStyles.playerName, { color: colors.text }]} numberOfLines={1}>
                {slot.booking.playerName}
              </Text>
              <View style={slotStyles.badgeRow}>
                <View
                  style={[
                    slotStyles.sourceBadge,
                    { backgroundColor: isApp ? colors.primary : "#F39C12" },
                  ]}
                >
                  <Text style={slotStyles.sourceBadgeText}>
                    {isApp ? "تطبيق" : "يدوي"}
                  </Text>
                </View>
                <Text style={[slotStyles.bookingDur, { color: colors.textSecondary }]}>
                  {slot.booking.duration} ساعة
                </Text>
              </View>
            </View>
          ) : (
            <View style={[slotStyles.continuationLine, { backgroundColor: slot.booking?.source === "app" ? colors.primary + "33" : "#F39C1233" }]} />
          )
        ) : (
          <Text style={[slotStyles.emptyText, { color: colors.textTertiary }]}>فارغ</Text>
        )}
      </View>
      {slot.booking && slot.isStart && (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
      {!slot.booking && (
        <Ionicons name="add-circle-outline" size={18} color={colors.textTertiary} />
      )}
    </Pressable>
  );
}

function BookingCard({
  booking,
  colors,
  onCancel,
}: {
  booking: OwnerBooking;
  colors: any;
  onCancel: (id: string) => void;
}) {
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={cardStyles.cardHeader}>
        <Text style={[cardStyles.playerName, { color: colors.text }]}>{booking.playerName}</Text>
        <View style={[cardStyles.statusBadge, { backgroundColor: statusColor(booking.status) + "22" }]}>
          <Text style={[cardStyles.statusText, { color: statusColor(booking.status) }]}>
            {statusLabel(booking.status)}
          </Text>
        </View>
      </View>
      <View style={cardStyles.metaRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
        <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
          {booking.date} • {formatBookingTime(booking)}
        </Text>
      </View>
      <View style={cardStyles.metaRow}>
        <Ionicons name="cash-outline" size={13} color={colors.textSecondary} />
        <Text style={[cardStyles.meta, { color: colors.textSecondary }]}>
          {formatPrice(booking.price, booking.duration)} • {booking.fieldSize}
        </Text>
      </View>
      <View style={[cardStyles.sourceRow, { borderTopColor: colors.border }]}>
        <View style={[cardStyles.sourceDot, { backgroundColor: booking.source === "app" ? colors.primary : "#F39C12" }]} />
        <Text style={[cardStyles.sourceLabel, { color: colors.textTertiary }]}>
          {booking.source === "app" ? "حجز عبر التطبيق" : "حجز يدوي"}
        </Text>
        {booking.status !== "cancelled" && (
          <Pressable
            onPress={() =>
              Alert.alert("إلغاء الحجز", `هل تريد إلغاء حجز ${booking.playerName}؟`, [
                { text: "تراجع", style: "cancel" },
                { text: "إلغاء الحجز", style: "destructive", onPress: () => onCancel(booking.id) },
              ])
            }
            style={[cardStyles.cancelBtn, { borderColor: "#E74C3C" + "44" }]}
          >
            <Text style={cardStyles.cancelText}>إلغاء</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function OwnerBookingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [filterTab, setFilterTab] = useState<FilterTab>("today");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<OwnerBooking | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    playerName: "",
    playerPhone: "",
    date: NEXT_7_DAYS[0].date,
    hour: 8,
    duration: 1,
    price: "",
  });

  const authFetch = useCallback(
    async (method: string, route: string, data?: unknown) => {
      const url = new URL(route, getApiUrl()).toString();
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any).message || res.statusText);
      }
      return res.json();
    },
    [token]
  );

  const { data: venueData } = useQuery<VenueOwner>({
    queryKey: ["/api/owner/venue", token],
    queryFn: () => authFetch("GET", "/api/owner/venue"),
    enabled: !!token,
  });

  useEffect(() => {
    if (venueData?.bookingPrice) {
      setForm((f) => ({ ...f, price: venueData.bookingPrice ?? "" }));
    }
  }, [venueData]);

  const queryKey = ["/api/owner/bookings", filterTab, token];
  const { data, isLoading, refetch } = useQuery<{ bookings: OwnerBooking[] }>({
    queryKey,
    queryFn: () => authFetch("GET", `/api/owner/bookings?filter=${filterTab}`),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const bookings = data?.bookings ?? [];
  const timeSlots = filterTab === "today" ? buildTimeSlots(bookings) : [];

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await authFetch("DELETE", `/api/owner/bookings/${id}`);
        queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings"] });
        queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings/today"] });
      } catch (e: any) {
        Alert.alert("خطأ", e.message);
      }
    },
    [authFetch, queryClient]
  );

  const handleAddBooking = useCallback(async () => {
    if (!form.playerName.trim()) {
      Alert.alert("خطأ", "اسم اللاعب مطلوب");
      return;
    }
    if (!form.price || isNaN(Number(form.price))) {
      Alert.alert("خطأ", "يرجى إدخال سعر صحيح");
      return;
    }
    setIsSaving(true);
    try {
      await authFetch("POST", "/api/owner/bookings", {
        playerName: form.playerName.trim(),
        playerPhone: form.playerPhone.trim() || null,
        date: form.date,
        time: `${String(form.hour).padStart(2, "0")}:00`,
        duration: form.duration,
        price: Number(form.price),
        source: "manual",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings/all"] });
      setShowAddModal(false);
      setForm((f) => ({
        ...f,
        playerName: "",
        playerPhone: "",
        date: NEXT_7_DAYS[0].date,
        hour: 8,
        duration: 1,
      }));
    } catch (e: any) {
      Alert.alert("خطأ", e.message);
    } finally {
      setIsSaving(false);
    }
  }, [form, authFetch, queryClient]);

  const s = makeStyles(colors);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.headerSection, { paddingTop: topPad + 8 }]}>
        <Text style={[s.screenTitle, { color: colors.text }]}>الحجوزات</Text>
        <View style={[s.filterRow, { backgroundColor: colors.surface }]}>
          {(Object.keys(FILTER_LABELS) as FilterTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilterTab(tab)}
              style={[
                s.filterTab,
                filterTab === tab && { backgroundColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  s.filterTabText,
                  { color: filterTab === tab ? "#000" : colors.textSecondary },
                ]}
              >
                {FILTER_LABELS[tab]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filterTab === "today" ? (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomPad + 90,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          {timeSlots.map((slot) => (
            <SlotRow
              key={slot.hour}
              slot={slot}
              colors={colors}
              onTapBooking={(b) => {
                setSelectedBooking(b);
              }}
              onTapEmpty={(hour) => {
                setForm((f) => ({ ...f, hour, date: getTodayString() }));
                setShowAddModal(true);
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomPad + 90,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[s.emptyBox, { backgroundColor: colors.surface }]}>
              <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
              <Text style={[s.emptyText, { color: colors.textSecondary }]}>لا توجد حجوزات</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard booking={item} colors={colors} onCancel={handleCancel} />
          )}
        />
      )}

      <Pressable
        onPress={() => {
          setForm((f) => ({ ...f, playerName: "", playerPhone: "", hour: 8, date: NEXT_7_DAYS[0].date, duration: 1 }));
          setShowAddModal(true);
        }}
        style={[s.fab, { backgroundColor: colors.primary, bottom: bottomPad + 72 }]}
      >
        <Ionicons name="add" size={28} color="#000" />
      </Pressable>

      {selectedBooking && (
        <Modal
          transparent
          animationType="slide"
          visible={!!selectedBooking}
          onRequestClose={() => setSelectedBooking(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedBooking(null)}>
            <Pressable
              style={[styles.detailSheet, { backgroundColor: colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                {selectedBooking.playerName}
              </Text>
              <DetailRow icon="calendar-outline" label="التاريخ" value={selectedBooking.date} colors={colors} />
              <DetailRow icon="time-outline" label="الوقت" value={formatBookingTime(selectedBooking)} colors={colors} />
              <DetailRow icon="hourglass-outline" label="المدة" value={`${selectedBooking.duration} ساعة`} colors={colors} />
              <DetailRow icon="cash-outline" label="الإجمالي" value={formatPrice(selectedBooking.price, selectedBooking.duration)} colors={colors} />
              <DetailRow icon="football-outline" label="حجم الملعب" value={selectedBooking.fieldSize} colors={colors} />
              {selectedBooking.playerPhone && (
                <DetailRow icon="call-outline" label="الهاتف" value={selectedBooking.playerPhone} colors={colors} />
              )}
              <DetailRow
                icon={selectedBooking.source === "app" ? "phone-portrait-outline" : "create-outline"}
                label="المصدر"
                value={selectedBooking.source === "app" ? "حجز عبر التطبيق" : "حجز يدوي"}
                colors={colors}
              />
              {selectedBooking.status !== "cancelled" && (
                <Pressable
                  onPress={() => {
                    setSelectedBooking(null);
                    handleCancel(selectedBooking.id);
                  }}
                  style={styles.cancelBookingBtn}
                >
                  <Text style={styles.cancelBookingText}>إلغاء الحجز</Text>
                </Pressable>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      )}

      <Modal
        transparent
        animationType="slide"
        visible={showAddModal}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
            <Pressable
              style={[styles.addSheet, { backgroundColor: colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[styles.addTitle, { color: colors.text }]}>إضافة حجز</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>اسم اللاعب *</Text>
                <TextInput
                  value={form.playerName}
                  onChangeText={(t) => setForm((f) => ({ ...f, playerName: t }))}
                  placeholder="أدخل اسم اللاعب"
                  placeholderTextColor={colors.textTertiary}
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  textAlign="right"
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>رقم الهاتف (اختياري)</Text>
                <TextInput
                  value={form.playerPhone}
                  onChangeText={(t) => setForm((f) => ({ ...f, playerPhone: t }))}
                  placeholder="07xxxxxxxxx"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  textAlign="right"
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>التاريخ</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {NEXT_7_DAYS.map((d) => (
                    <Pressable
                      key={d.date}
                      onPress={() => setForm((f) => ({ ...f, date: d.date }))}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: form.date === d.date ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          { color: form.date === d.date ? "#000" : colors.text },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>الساعة</Text>
                <View style={styles.hourGrid}>
                  {BOOKING_HOURS.map((h) => (
                    <Pressable
                      key={h}
                      onPress={() => setForm((f) => ({ ...f, hour: h }))}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: form.hour === h ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hourChipText,
                          { color: form.hour === h ? "#000" : colors.text },
                        ]}
                      >
                        {String(h).padStart(2, "0")}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>المدة</Text>
                <View style={styles.durationRow}>
                  {DURATION_OPTIONS.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setForm((f) => ({ ...f, duration: d }))}
                      style={[
                        styles.durChip,
                        {
                          backgroundColor: form.duration === d ? colors.primary : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.durChipText, { color: form.duration === d ? "#000" : colors.text }]}>
                        {d} ساعة
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  السعر (للساعة الواحدة - د.ع)
                </Text>
                <TextInput
                  value={form.price}
                  onChangeText={(t) => setForm((f) => ({ ...f, price: t.replace(/[^0-9]/g, "") }))}
                  placeholder="مثال: 15000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  textAlign="right"
                />

                {form.price && !isNaN(Number(form.price)) && (
                  <Text style={[styles.totalPreview, { color: colors.primary }]}>
                    الإجمالي: {(Number(form.price) * form.duration).toLocaleString("ar-IQ")} د.ع
                  </Text>
                )}

                <Pressable
                  onPress={handleAddBooking}
                  disabled={isSaving}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Text style={styles.saveBtnText}>حفظ الحجز</Text>
                  )}
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  colors,
}: {
  icon: string;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={16} color={colors.textSecondary} />
      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    headerSection: { paddingHorizontal: 16, paddingBottom: 8, backgroundColor: colors.background },
    screenTitle: { fontFamily: "Cairo_700Bold", fontSize: 22, marginBottom: 10 },
    filterRow: { flexDirection: "row", borderRadius: 12, padding: 4, marginBottom: 4 },
    filterTab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
    filterTabText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
    emptyBox: { margin: 16, borderRadius: 14, padding: 40, alignItems: "center", gap: 10 },
    emptyText: { fontFamily: "Cairo_400Regular", fontSize: 15 },
    fab: {
      position: "absolute",
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
  });
}

const slotStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  timeLabel: { fontFamily: "Cairo_700Bold", fontSize: 13, width: 48 },
  slotContent: { flex: 1, paddingHorizontal: 8 },
  bookingInfo: { gap: 2 },
  playerName: { fontFamily: "Cairo_600SemiBold", fontSize: 14 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sourceBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sourceBadgeText: { fontFamily: "Cairo_700Bold", fontSize: 10, color: "#000" },
  bookingDur: { fontFamily: "Cairo_400Regular", fontSize: 11 },
  emptyText: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  continuationLine: { height: 3, borderRadius: 2, flex: 1 },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  playerName: { fontFamily: "Cairo_700Bold", fontSize: 16, flex: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: "Cairo_600SemiBold", fontSize: 11 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  meta: { fontFamily: "Cairo_400Regular", fontSize: 13 },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  sourceDot: { width: 8, height: 8, borderRadius: 4 },
  sourceLabel: { fontFamily: "Cairo_400Regular", fontSize: 12, flex: 1 },
  cancelBtn: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  cancelText: { fontFamily: "Cairo_600SemiBold", fontSize: 12, color: "#E74C3C" },
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  detailSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  addSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%", paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  detailTitle: { fontFamily: "Cairo_700Bold", fontSize: 20, textAlign: "center", marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 0 },
  detailLabel: { fontFamily: "Cairo_400Regular", fontSize: 13, width: 80 },
  detailValue: { fontFamily: "Cairo_600SemiBold", fontSize: 14, flex: 1, textAlign: "left" },
  cancelBookingBtn: { marginTop: 16, backgroundColor: "#E74C3C", borderRadius: 12, padding: 14, alignItems: "center" },
  cancelBookingText: { fontFamily: "Cairo_700Bold", fontSize: 15, color: "#fff" },
  addTitle: { fontFamily: "Cairo_700Bold", fontSize: 20, textAlign: "center", marginBottom: 16 },
  fieldLabel: { fontFamily: "Cairo_600SemiBold", fontSize: 13, marginBottom: 6 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
    marginBottom: 14,
  },
  dayChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  dayChipText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
  hourGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  hourChip: {
    borderRadius: 10,
    borderWidth: 1,
    width: "22%",
    paddingVertical: 8,
    alignItems: "center",
  },
  hourChipText: { fontFamily: "Cairo_700Bold", fontSize: 13 },
  durationRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  durChip: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: "center" },
  durChipText: { fontFamily: "Cairo_600SemiBold", fontSize: 13 },
  totalPreview: { fontFamily: "Cairo_700Bold", fontSize: 15, textAlign: "center", marginBottom: 12 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: "center", marginTop: 4 },
  saveBtnText: { fontFamily: "Cairo_700Bold", fontSize: 16, color: "#000" },
});
