/**
 * Common style utilities to reduce duplication across screens
 */
import { StyleSheet } from "react-native";

/**
 * Common button style with given background color
 */
export const buttonStyle = (
  backgroundColor: string,
  paddingHorizontal: number = 12,
  paddingVertical: number = 6
) => ({
  marginTop: 8,
  backgroundColor,
  paddingHorizontal,
  paddingVertical,
  borderRadius: 4,
  alignSelf: "flex-start" as const,
});

/**
 * Common button text style
 */
export const buttonTextStyle = () => ({
  color: "#fff",
  fontSize: 12,
  fontWeight: "600" as const,
});

/**
 * Create a common small text style
 */
export const smallTextStyle = (color: string = "#999") => ({
  fontSize: 12,
  color,
});

/**
 * Create a modal style
 */
export const modalStyles = () =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
  });

/**
 * Common auth screen (Login/Signup) styles
 */
export const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  formContainer: {
    width: "100%",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#f44336",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    color: "#f44336",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },
  togglePasswordText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "500",
    paddingHorizontal: 12,
  },
  authButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 24,
  },
  authButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    marginHorizontal: 12,
    color: "#999",
    fontSize: 14,
  },
  authLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  authLinkText: {
    color: "#666",
    fontSize: 14,
  },
  authLinkButton: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: "600",
  },
  linkDisabled: {
    opacity: 0.5,
  },
});

/**
 * Asset management screen and component styles
 */
export const assetManagementStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    title: { fontSize: 18, fontWeight: "600", color: "#000" },
    backButton: { padding: 8, width: 60 },
    backButtonText: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: { fontSize: 16, color: "#999" },
    listContent: { padding: 12 },
    navButtonRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
      gap: 8,
    },
    navButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: "#FFD700",
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#FFD700",
      overflow: "hidden",
    },
    navButtonActive: {
      backgroundColor: "#FF6B9D",
      borderWidth: 2,
      borderColor: "#FF6B9D",
    },
    navButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#000",
    },
    navButtonTextActive: { color: "#fff", fontWeight: "700" },
  });

/**
 * Asset card component styles
 */
export const assetCardStyles = () =>
  StyleSheet.create({
    card: {
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
      alignItems: "center",
    },
    thumbWrap: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "#f0f0f0",
    },
    thumb: { width: "100%", height: "100%" },
    thumbPlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f0f0f0",
    },
    placeholderText: { fontSize: 10, color: "#999" },
    info: { flex: 1 },
    filename: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    meta: { fontSize: 12, color: "#666", marginBottom: 2 },
    statusWrap: { marginTop: 6 },
    status: {
      fontSize: 10,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
      alignSelf: "flex-start",
    },
    uploaded: { backgroundColor: "#C8E6C9", color: "#2E7D32" },
    pending: { backgroundColor: "#FFE0B2", color: "#E65100" },
    delete: {
      width: 40,
      height: 40,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 4,
      backgroundColor: "#FFE8E8",
    },
    deleteText: { fontSize: 18 },
  });

/**
 * Asset preview modal styles
 */
export const assetPreviewStyles = () =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
    content: {
      width: "90%",
      maxHeight: "90%",
      backgroundColor: "#fff",
      borderRadius: 8,
      overflow: "hidden",
    },
    image: { width: "100%", height: 400 },
    info: { padding: 16, backgroundColor: "#f5f5f5" },
    title: { fontSize: 16, fontWeight: "600", color: "#000", marginBottom: 8 },
    meta: { fontSize: 12, color: "#666", marginBottom: 4 },
    noImage: { color: "#999", padding: 40, textAlign: "center" },
  });

/**
 * User profile screen styles
 */
export const userProfileStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    backButton: { paddingHorizontal: 8, paddingVertical: 4 },
    backButtonText: { fontSize: 16, color: "#007AFF", fontWeight: "600" },
    title: { fontSize: 18, fontWeight: "600", color: "#000" },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: { fontSize: 14, color: "#999" },
    listContent: { paddingHorizontal: 0, paddingVertical: 0 },
    imagesHeader: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    imagesTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  });

/**
 * User card styles
 */
export const userCardStyles = () =>
  StyleSheet.create({
    card: {
      backgroundColor: "#fff",
      margin: 16,
      padding: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    info: { flex: 1 },
    username: {
      fontSize: 18,
      fontWeight: "700",
      color: "#000",
      marginBottom: 4,
    },
    email: { fontSize: 14, color: "#666", marginBottom: 8 },
    roleContainer: { alignSelf: "flex-start" },
    role: {
      fontSize: 12,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    roleAdmin: { backgroundColor: "#FFD700", color: "#000" },
    roleSuperAdmin: { backgroundColor: "#FF6B9D", color: "#fff" },
    roleUser: { backgroundColor: "#E8F4F8", color: "#0277BD" },
    statsContainer: { flexDirection: "row", gap: 16 },
    stat: { alignItems: "center" },
    statNumber: { fontSize: 20, fontWeight: "700", color: "#007AFF" },
    statLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  });

/**
 * User management screen styles
 */
export const userManagementStyles = () =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f5f5f5" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    title: { fontSize: 18, fontWeight: "600", color: "#000" },
    backButton: { padding: 8, width: 60 },
    backButtonText: { fontSize: 16, color: "#007AFF", fontWeight: "500" },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: { fontSize: 16, color: "#999" },
    listContent: { padding: 12 },
    navButtonRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
      gap: 8,
    },
    navButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: "#FFD700",
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#FFD700",
      overflow: "hidden",
    },
    navButtonActive: {
      backgroundColor: "#FF6B9D",
      borderWidth: 2,
      borderColor: "#FF6B9D",
    },
    navButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: "#000",
    },
    navButtonTextActive: { color: "#fff", fontWeight: "700" },
  });

/**
 * User card item styles
 */
export const userItemStyles = () =>
  StyleSheet.create({
    card: {
      backgroundColor: "#fff",
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    info: { flex: 1 },
    username: {
      fontSize: 16,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    email: { fontSize: 13, color: "#666", marginBottom: 8 },
    roleContainer: { flexDirection: "row", alignItems: "center" },
    role: {
      fontSize: 12,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    roleAdmin: { backgroundColor: "#FFD700", color: "#000" },
    roleSuperAdmin: { backgroundColor: "#FF6B9D", color: "#fff" },
    roleUser: { backgroundColor: "#E8F4F8", color: "#0277BD" },
    buttonContainer: { flexDirection: "row", gap: 4, alignItems: "center" },
    button: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      minWidth: 60,
      justifyContent: "center",
      alignItems: "center",
    },
    promoteButton: { backgroundColor: "#4CAF50" },
    demoteButton: { backgroundColor: "#FF9800" },
    deleteButton: { backgroundColor: "#FF6B6B" },
    viewButton: { backgroundColor: "#2196F3" },
    buttonText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  });

/**
 * List item styles (images, promotions, deletions)
 */
export const listItemStyles = () =>
  StyleSheet.create({
    imageItem: {
      flexDirection: "row",
      padding: 12,
      backgroundColor: "#fff",
      borderBottomWidth: 1,
      borderBottomColor: "#e0e0e0",
    },
    imageThumbnail: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: "#f0f0f0",
    },
    deletedImageThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 6,
      marginRight: 12,
      backgroundColor: "#f0f0f0",
    },
    imageInfo: { flex: 1, justifyContent: "center" },
    filename: {
      fontSize: 14,
      fontWeight: "600",
      color: "#000",
      marginBottom: 4,
    },
    timestamp: { fontSize: 12, color: "#999", marginBottom: 2 },
    fileSize: { fontSize: 11, color: "#666" },
    actionItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: "#fff",
      marginVertical: 4,
      marginHorizontal: 8,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: "#4CAF50",
    },
    actionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#E8F5E9",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    deleteIcon: { backgroundColor: "#FFEBEE", borderLeftColor: "#F44336" },
    actionIconText: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
    actionContent: { flex: 1 },
    actionTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: "#333",
      marginBottom: 4,
    },
    actionUsername: { fontWeight: "700", color: "#2196F3" },
    actionFilename: { fontWeight: "700", color: "#F44336" },
    actionSubtext: { fontSize: 12, color: "#666", marginBottom: 4 },
    actionDate: { fontSize: 12, color: "#999" },
  });

/**
 * Modal styles for user profile
 */
export const profileModalStyles = () =>
  StyleSheet.create({
    modal: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.95)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
    },
    modalContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      paddingHorizontal: 16,
    },
    modalImage: { flex: 1, width: "100%", height: "70%" },
    modalInfo: {
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
      width: "100%",
    },
    modalFilename: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginBottom: 8,
    },
    modalDate: { fontSize: 13, color: "#ccc" },
  });
