import React, { memo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { PhotoCategory } from "../types";

interface Props {
  selectedCategory: PhotoCategory;
  onSelectCategory: (category: PhotoCategory) => void;
  filterCategory?: PhotoCategory | null;
  onFilterCategory?: (category: PhotoCategory | null) => void;
}

const CATEGORIES: {
  value: PhotoCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "Circuit", label: "Circuit", icon: "⚡", color: "#FF9800" },
  { value: "Space", label: "Space", icon: "📐", color: "#2196F3" },
  { value: "Power", label: "Power", icon: "🔌", color: "#F44336" },
  { value: "Site", label: "Site", icon: "📍", color: "#4CAF50" },
];

const FilterDropdown = memo(function FilterDropdown({
  filterCategory,
  onFilterCategory,
}: {
  filterCategory: PhotoCategory | null;
  onFilterCategory: (category: PhotoCategory | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const currentFilter = filterCategory
    ? CATEGORIES.find((c) => c.value === filterCategory)
    : null;

  const displayText = currentFilter
    ? `${currentFilter.icon} ${currentFilter.label}`
    : "All Photos";

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={styles.dropdownText}>{displayText}</Text>
        <Text style={styles.dropdownArrow}>{isOpen ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={[
              styles.dropdownItem,
              filterCategory === null && styles.dropdownItemActive,
            ]}
            onPress={() => {
              onFilterCategory(null);
              setIsOpen(false);
            }}
          >
            <Text style={styles.dropdownItemText}>All Photos</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => {
            const isActive = filterCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.dropdownItem,
                  isActive && styles.dropdownItemActive,
                ]}
                onPress={() => {
                  onFilterCategory(cat.value);
                  setIsOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
});

export default memo(function CategoryPicker({
  selectedCategory,
  onSelectCategory,
  filterCategory,
  onFilterCategory,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Section for selecting category for new photos */}
      <View style={styles.section}>
        <Text style={styles.label}>New Photo Category:</Text>
        <View style={styles.buttonRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryButton,
                  isSelected && {
                    backgroundColor: cat.color,
                    borderColor: cat.color,
                  },
                ]}
                onPress={() => onSelectCategory(cat.value)}
              >
                <Text style={styles.icon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Compact dropdown filter */}
      {onFilterCategory && (
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Filter:</Text>
          <FilterDropdown
            filterCategory={filterCategory ?? null}
            onFilterCategory={onFilterCategory}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    zIndex: 1000,
  },
  section: {
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 1001,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  dropdownContainer: {
    flex: 1,
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#666",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10000,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemActive: {
    backgroundColor: "#f0f8ff",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    gap: 4,
  },
  icon: {
    fontSize: 20,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  categoryTextSelected: {
    color: "#fff",
  },
});
