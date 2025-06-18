import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { WarrantyService } from "../../services/WarrantyService";
import { WarrantyRequest } from "../../types";
import WarrantyDetailsModal from "../../components/WarrantyDetailsModal";

export default function WarrantyHistoryScreen() {
  const [warranties, setWarranties] = useState<WarrantyRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [selectedWarranty, setSelectedWarranty] =
    useState<WarrantyRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load warranty data on component mount
  useEffect(() => {
    loadWarranties();
  }, []); // Function to load warranties from service
  const loadWarranties = async (refresh = false) => {
    try {
      if (!refresh) {
        setIsLoading(true);
      }
      setError(null);
      const response = await WarrantyService.getAllWarranties();
      setWarranties(response.warranties); // Extract just the warranties array
    } catch (err) {
      setError("Failed to load warranty data. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadWarranties(true);
  };

  // Filter warranties based on status
  const filteredWarranties =
    activeFilter === "all"
      ? warranties
      : warranties.filter((warranty) => warranty.status === activeFilter);
  // Render status badge with appropriate colors
  const renderStatusBadge = (status: WarrantyRequest["status"]) => {
    let badgeStyle = {};
    let textColor = {};
    let statusText = "";

    switch (status) {
      case "approved":
        badgeStyle = { backgroundColor: "#d4edda" };
        textColor = { color: "#155724" };
        statusText = "אושר";
        break;
      case "rejected":
        badgeStyle = { backgroundColor: "#f8d7da" };
        textColor = { color: "#721c24" };
        statusText = "נדחה";
        break;
      case "pending":
        badgeStyle = { backgroundColor: "#fff3cd" };
        textColor = { color: "#856404" };
        statusText = "בתהליך";
        break;
      case "in_progress":
        badgeStyle = { backgroundColor: "#d1ecf1" };
        textColor = { color: "#0c5460" };
        statusText = "בבדיקה";
        break;
      default:
        badgeStyle = { backgroundColor: "#e2e3e5" };
        textColor = { color: "#383d41" };
        statusText = status;
    }

    return (
      <View style={[styles.statusBadge, badgeStyle]}>
        <Text style={[styles.statusText, textColor]}>{statusText}</Text>
      </View>
    );
  };

  const renderStatusText = (status: WarrantyRequest["status"]) => {
    switch (status) {
      case "approved":
        return "אושר";
      case "rejected":
        return "נדחה";
      case "pending":
        return "בתהליך";
      case "in_progress":
        return "בבדיקה";
      default:
        return String(status ?? "לא ידוע"); // Fallback for any other status
    }
  };

  // Render filter tabs
  const renderFilterTabs = () => {
    const filters = [
      { id: "all", label: "הכל" },
      { id: "approved", label: "אושר" },
      { id: "rejected", label: "נדחה" },
      { id: "pending", label: "בתהליך" },
      { id: "in_progress", label: "בבדיקה" },
    ];

    return (
      <View style={styles.filterContainer}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              activeFilter === filter.id && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter(filter.id)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === filter.id && styles.activeFilterText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render warranty item
  const renderWarrantyItem = ({ item }: { item: WarrantyRequest }) => {
    return (
      <View style={styles.warrantyItem}>
        <View style={styles.warrantyHeader}>
          <Text style={styles.clientName}>{item.clientName}</Text>
          {renderStatusBadge(item.status)}
        </View>

        <View style={styles.warrantyInfo}>
          <View style={styles.infoRow}>
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={Colors.dark.text}
            />
            <Text style={styles.infoText}>מספר סידורי: {item.productInfo}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={Colors.dark.text}
            />
            <Text style={styles.infoText}>
              הותקן : {new Date(item.installationDate).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={Colors.dark.text} />
            <Text style={styles.infoText}>
              נשלח : {new Date(item.submissionDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            setSelectedWarranty(item);
            setModalVisible(true);
          }}>

          <Text style={styles.detailsButtonText}>הצג פרטים</Text>
        </TouchableOpacity>
      </View>
    );
  };
  // If loading, show loading indicator
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Loading warranty data...</Text>
      </View>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={64} color="#f00" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadWarranties()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      {renderFilterTabs()}
      {filteredWarranties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No warranty activations found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWarranties}
          keyExtractor={(item) => item.id}
          renderItem={renderWarrantyItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      )}

      <WarrantyDetailsModal
        visible={modalVisible}
        warranty={selectedWarranty}
        onClose={() => {
          setModalVisible(false);
          setSelectedWarranty(null);
        }}
        renderStatusText={renderStatusText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.dark.text,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#f00",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: Colors.dark.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: Colors.dark.primary,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row-reverse",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
    flexWrap: "wrap",
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  activeFilterTab: {
    backgroundColor: Colors.dark.primary,
  },
  filterText: {
    color: Colors.dark.text,
    fontSize: 14,
  },
  activeFilterText: {
    color: "#fff",
    fontWeight: "bold",
  },
  listContainer: {
    paddingBottom: 20,
  },
  warrantyItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    direction: "rtl", // Right-to-left for Hebrew
  },
  warrantyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.dark.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  warrantyInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 16,
    color: Colors.dark.text,
    marginRight: 8,
  },
  detailsButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  detailsButtonText: {
    color: Colors.dark.primary,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: "#999",
  },
});
