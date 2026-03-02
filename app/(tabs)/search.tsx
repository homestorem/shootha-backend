import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";
import { Venue } from "@/context/BookingsContext";
import { VenueCard } from "@/components/VenueCard";
import { SkeletonVenueCard } from "@/components/SkeletonCard";
import SearchMapView from "@/components/SearchMapView";

const FILTERS = ["الكل", "5 ضد 5", "7 ضد 7", "11 ضد 11", "متاح الآن"];
const SORT_OPTIONS = ["الأعلى تقييمًا", "الأقل سعرًا", "الأعلى سعرًا"];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [sortBy, setSortBy] = useState("الأعلى تقييمًا");
  const [showSort, setShowSort] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : 0;

  const { data, isLoading } = useQuery<{ venues: Venue[] }>({
    queryKey: ["/api/venues"],
    staleTime: 30000,
  });

  const allVenues = data?.venues ?? [];

  const filtered = useMemo(() => {
    let venues = [...allVenues];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      venues = venues.filter(v =>
        v.name.includes(q) || v.location.includes(q) || v.district.includes(q)
      );
    }

    if (activeFilter === "متاح الآن") {
      venues = venues.filter(v => v.isOpen);
    } else if (activeFilter !== "الكل") {
      venues = venues.filter(v => v.fieldSizes.includes(activeFilter));
    }

    if (sortBy === "الأعلى تقييمًا") {
      venues.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "الأقل سعرًا") {
      venues.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "الأعلى سعرًا") {
      venues.sort((a, b) => b.pricePerHour - a.pricePerHour);
    }

    return venues;
  }, [query, activeFilter, sortBy, allVenues]);

  return (
    <View style={[styles.container, { paddingTop: topPadding, backgroundColor: colors.background }]}>
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>استكشاف الملاعب</Text>
          <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list"
                size={15}
                color={viewMode === "list" ? Colors.primary : Colors.textTertiary}
              />
              <Text style={[styles.toggleText, viewMode === "list" && styles.toggleTextActive]}>
                قائمة
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
              onPress={() => setViewMode("map")}
            >
              <Ionicons
                name="map"
                size={15}
                color={viewMode === "map" ? Colors.primary : Colors.textTertiary}
              />
              <Text style={[styles.toggleText, viewMode === "map" && styles.toggleTextActive]}>
                خريطة
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="ابحث عن ملعب أو حي..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map(f => (
            <Pressable
              key={f}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {viewMode === "list" ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <>
              <SkeletonVenueCard />
              <SkeletonVenueCard />
              <SkeletonVenueCard />
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>{filtered.length} ملعب</Text>
                <Pressable style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
                  <Ionicons name="funnel-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.sortBtnText}>{sortBy}</Text>
                  <Ionicons name={showSort ? "chevron-up" : "chevron-down"} size={13} color={Colors.textSecondary} />
                </Pressable>
              </View>

              {showSort && (
                <View style={[styles.sortDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {SORT_OPTIONS.map(opt => (
                    <Pressable
                      key={opt}
                      style={[styles.sortOption, sortBy === opt && styles.sortOptionActive]}
                      onPress={() => { setSortBy(opt); setShowSort(false); }}
                    >
                      <Text style={[styles.sortOptionText, sortBy === opt && styles.sortOptionTextActive]}>
                        {opt}
                      </Text>
                      {sortBy === opt && <Ionicons name="checkmark" size={16} color={Colors.primary} />}
                    </Pressable>
                  ))}
                </View>
              )}

              {allVenues.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="football-outline" size={52} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>لا توجد ملاعب حالياً</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    ستظهر الملاعب هنا فور تسجيل أصحابها في التطبيق
                  </Text>
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>لا توجد نتائج</Text>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>جرّب البحث بكلمة مختلفة أو تغيير الفلتر</Text>
                </View>
              ) : (
                filtered.map(venue => <VenueCard key={venue.id} venue={venue} />)
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <SearchMapView venues={filtered} bottomPadding={bottomPadding} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontFamily: "Cairo_700Bold",
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  toggleBtnActive: {
    backgroundColor: "rgba(46,204,113,0.12)",
  },
  toggleText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontFamily: "Cairo_400Regular",
  },
  toggleTextActive: {
    color: Colors.primary,
    fontFamily: "Cairo_600SemiBold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: "Cairo_400Regular",
    fontSize: 15,
    textAlign: "right",
  },
  filtersRow: {
    gap: 8,
    paddingBottom: 4,
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: "rgba(46,204,113,0.15)",
    borderColor: Colors.primary,
  },
  filterText: {
    color: Colors.textSecondary,
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
  },
  filterTextActive: {
    color: Colors.primary,
    fontFamily: "Cairo_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  resultsCount: {
    color: Colors.textSecondary,
    fontFamily: "Cairo_400Regular",
    fontSize: 13,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortBtnText: {
    color: Colors.textSecondary,
    fontFamily: "Cairo_400Regular",
    fontSize: 12,
  },
  sortDropdown: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortOptionActive: {
    backgroundColor: "rgba(46,204,113,0.08)",
  },
  sortOptionText: {
    color: Colors.text,
    fontFamily: "Cairo_400Regular",
    fontSize: 14,
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontFamily: "Cairo_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: "Cairo_700Bold",
    textAlign: "center",
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: "Cairo_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
