import React, { useState, useEffect, useCallback } from "react"; // Added useEffect
import {
  StyleSheet,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Switch,
  Image,
  Modal,
  Pressable,
} from "react-native";
import FeatherIcon from "react-native-vector-icons/Feather";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
const profilePic = require("../../assets/icons/pfp_icon.png");
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect

export default function Example({ navigation }) {
  const { setUser, setAccessToken, setRefreshToken, user } = useStore();
  const [activeBannerData, setActiveBannerData] = useState(null);

  const route = useRoute();
  const { profilephoto } = route.params; // Ensure this param is passed correctly

  const [form, setForm] = useState({
    emailNotifications: true,
    pushNotifications: false,
  });

  const contactInfo = {
    contactID: user?.user_metadata?.id,
    contactPFP: profilephoto,
    contactFirst: user?.user_metadata?.first_name,
    contactLast: user?.user_metadata?.last_name,
    contactUsername: user?.user_metadata?.username,
    contactEmail: user?.user_metadata?.email,
    contactPassword: user?.user_metadata?.password,
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut(); // Sign out from Supabase
    if (!error) {
      setUser(null); // Clear user data
      setAccessToken(null); // Clear access token
      setRefreshToken(null); // Clear refresh token
      navigation.navigate("SignIn");
    } else {
      console.error("Error logging out:", error.message);
    }
  };

  // Function to fetch the active banner
  const fetchActiveBanner = async () => {
    if (!user) return;
  
    const { data, error } = await supabase
      .from("active_banner")
      .select("banner_id")
      .eq("user_id", user.id)
      .single();
  
    if (error) {
      if (error.code === "PGRST116") { // No rows returned for single query
        setActiveBannerData(null); // Set active banner data to null if no active banner
      } else {
        console.error("Error fetching active banner:", error.message);
      }
      return;
    }
  
    if (data) {
      const { data: bannerData, error: bannerError } = await supabase
        .from("banners")
        .select("image_url")
        .eq("id", data.banner_id)
        .single();
  
      if (bannerError) {
        console.error("Error fetching banner details:", bannerError.message);
        setActiveBannerData(null); // Fallback to null if there's an error with banner details
      } else {
        setActiveBannerData(bannerData); 
      }
    } else {
      setActiveBannerData(null); // Explicitly set to null if no data returned
    }
  };
  

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBanner();
    }, [user, fetchActiveBanner]) // Re-run when user changes
  );

  useEffect(() => {
    fetchActiveBanner(); // Fetch the active banner when the component mounts
  }, [user]); // Dependency on user to refetch when user state changes

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#f8f8f8",
        marginTop: Constants.statusBarHeight,
      }}
    >
      <View style={styles.header}>
        <View style={styles.headerAction}>
          <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
            <FeatherIcon color="#000" name="arrow-left" size={24} />
          </TouchableOpacity>
        </View>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Settings
        </Text>

        <View style={[styles.headerAction, { alignItems: "flex-end" }]}>
          <TouchableOpacity
            onPress={() => {
              /* handle onPress */
            }}
          >
            <FeatherIcon color="#000" name="more-vertical" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {user ? (
          <Pressable style={[styles.section, { paddingTop: 4 }]}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.sectionBody}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("ProfileSettings", { contactInfo });
                }}
                style={styles.profile}
              >
                {activeBannerData && (
                  <Image
                    source={{ uri: activeBannerData.image_url }}
                    style={styles.bannerImage}
                  />
                )}
                <Image
                  accessibilityLabel=""
                  source={{
                    uri: profilephoto || profilePic.uri,
                  }}
                  style={styles.profileAvatar}
                />

                <View style={styles.profileBody}>
                  <Text style={styles.profileName}>
                    {user.user_metadata?.first_name || ""}{" "}
                    {user.user_metadata?.last_name || ""}
                  </Text>

                  <Text style={styles.profileHandle}>
                    {user.user_metadata?.username || "Unknown User"}
                  </Text>
                  <Text style={styles.profileHandle}>
                    email: {user.email || "Unknown User"}
                  </Text>
                </View>

                <FeatherIcon color="#bcbcbc" name="chevron-right" size={22} />
              </TouchableOpacity>
            </View>
          </Pressable>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text>No user logged in</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.sectionBody}>
            <View style={[styles.rowWrapper, styles.rowFirst]}>
              <TouchableOpacity
                onPress={() => {
                  // handle onPress
                }}
                style={styles.row}
              >
                <Text style={styles.rowLabel}>Language</Text>

                <View style={styles.rowSpacer} />

                <Text style={styles.rowValue}>English</Text>

                <FeatherIcon color="#bcbcbc" name="chevron-right" size={19} />
              </TouchableOpacity>
            </View>

            <View style={styles.rowWrapper}>
              <TouchableOpacity
                onPress={() => {
                  // handle onPress
                }}
                style={styles.row}
              >
                <Text style={styles.rowLabel}>Location</Text>

                <View style={styles.rowSpacer} />

                <Text style={styles.rowValue}>Los Angeles, CA</Text>

                <FeatherIcon color="#bcbcbc" name="chevron-right" size={19} />
              </TouchableOpacity>
            </View>

            <View style={styles.rowWrapper}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email Notifications</Text>

                <View style={styles.rowSpacer} />

                <Switch
                  onValueChange={(emailNotifications) =>
                    setForm({ ...form, emailNotifications })
                  }
                  style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                  value={form.emailNotifications}
                />
              </View>
            </View>

            <View style={[styles.rowWrapper, styles.rowLast]}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Push Notifications</Text>

                <View style={styles.rowSpacer} />

                <Switch
                  onValueChange={(pushNotifications) =>
                    setForm({ ...form, pushNotifications })
                  }
                  style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
                  value={form.pushNotifications}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionBody}>
            <View
              style={[
                styles.rowWrapper,
                styles.rowFirst,
                styles.rowLast,
                { alignItems: "center" },
              ]}
            >
              <TouchableOpacity onPress={handleLogout} style={styles.row}>
                <Text style={[styles.rowLabel, styles.rowLabelLogout]}>
                  Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.contentFooter}>App Version 2.24 #50491</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /** Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 16,
  },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "600",
    color: "#000",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    textAlign: "center",
  },
  /** Content */
  content: {
    paddingHorizontal: 16,
  },
  contentFooter: {
    marginTop: 24,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    color: "#a69f9f",
  },
  /** Section */
  section: {
    paddingVertical: 12,
  },
  sectionTitle: {
    margin: 8,
    marginLeft: 12,
    fontSize: 13,
    letterSpacing: 0.33,
    fontWeight: "500",
    color: "#a69f9f",
    textTransform: "uppercase",
  },
  sectionBody: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  /** Profile */
  profile: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  bannerImage: {
    position: 'absolute',
    width: 80, // Slightly wider than the profile picture
    height: 80, // Fixed height to fit the banner
    top: 7, // Adjust this value to position the banner above the profile picture
    left: 3, // Center the banner horizontally (adjust as necessary)
    zIndex: 1, // Ensure the banner is infront the profile picture
    borderRadius: 20, // Adjust to create a smoother edge
    justifyContent: "center",
    alignItems: "center",

  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 9999,
    marginRight: 12,
  },
  profileBody: {
    marginRight: "auto",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#292929",
  },
  profileHandle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "400",
    color: "#858585",
  },
  /** Row */
  row: {
    height: 44,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingRight: 12,
  },
  rowWrapper: {
    paddingLeft: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  rowFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  rowLabel: {
    fontSize: 16,
    letterSpacing: 0.24,
    color: "#000",
  },
  rowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ababab",
    marginRight: 4,
  },
  rowLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  rowLabelLogout: {
    width: "100%",
    textAlign: "center",
    fontWeight: "600",
    color: "#dc2626",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    height: "70%",
    padding: 40,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    backgroundColor: "#FFABAB", // Cancel button color
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginRight: 15,
    width: "30%",
    alignSelf: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: "#333",
  },
});
