import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Assuming this handles user and tokens
import Header from "../components/Header";

const GiftsScreen = ({ navigation }) => {

  const { user } = useStore(); // Retrieve the user from the store
  const [userId, setUserId] = useState(null);
  const [banners, setBanners] = useState([]); // State for storing fetched banners
  const [stickers, setStickers] = useState([]); // State for storing fetched stickers
  const [showOwned, setShowOwned] = useState(false); // State for toggle switch

  // Fetch and log user ID, banners (IDs), stickers (IDs), user_banners (IDs), and user_stickers (IDs)
  useEffect(() => {
    const logUserData = async () => {
      if (user) {
        setUserId(user.id);
        console.log("User ID:", user.id); // Log user ID

        // Fetch all banners
        const { data: allBanners, error: bannersError } = await supabase
          .from("banners")
          .select("id");

        if (bannersError) {
          console.error("Error fetching banners:", bannersError.message);
        } else {
          const bannerIds = allBanners.map((b) => b.id);
          console.log("Banners:", bannerIds); // Log banner IDs once
        }

        // Fetch all stickers
        const { data: allStickers, error: stickersError } = await supabase
          .from("stickers")
          .select("id");

        if (stickersError) {
          console.error("Error fetching stickers:", stickersError.message);
        } else {
          const stickerIds = allStickers.map((s) => s.id);
          console.log("Stickers:", stickerIds); // Log sticker IDs once
        }

        // Fetch user-owned banners
        const { data: userBanners, error: userBannersError } = await supabase
          .from("user_banners")
          .select("banner_id")
          .eq("user_id", user.id);

        if (userBannersError) {
          console.error("Error fetching user_banners:", userBannersError.message);
        } else {
          const userBannerIds = userBanners.map((ub) => ub.banner_id);
          console.log("user_banners:", userBannerIds); // Log user_banners IDs once
        }

        // Fetch user-owned stickers
        const { data: userStickers, error: userStickersError } = await supabase
          .from("user_stickers")
          .select("sticker_id")
          .eq("user_id", user.id);

        if (userStickersError) {
          console.error("Error fetching user_stickers:", userStickersError.message);
        } else {
          const userStickerIds = userStickers.map((us) => us.sticker_id);
          console.log("user_stickers:", userStickerIds); // Log user_stickers IDs once
        }
      }
    };

    // Call logUserData once when component mounts
    logUserData();
  }, []); // Empty dependency array ensures this runs only once

  // Fetch banners based on toggle state
  useEffect(() => {
    const fetchBanners = async () => {
      let data;
      let error;

      if (showOwned && userId) {
        // Fetch only user-owned banners
        const { data: ownedBanners, error: ownedError } = await supabase
          .from("user_banners")
          .select("banner_id")
          .eq("user_id", userId);

        if (ownedError) {
          console.error("Error fetching owned banners:", ownedError.message);
          return;
        }

        const { data: allBanners, error: fetchError } = await supabase
          .from("banners")
          .select()
          .in("id", ownedBanners.map((b) => b.banner_id));

        data = allBanners;
        error = fetchError;
      } else {
        // Fetch all banners
        const { data: allBanners, error: fetchError } = await supabase
          .from("banners")
          .select();

        data = allBanners;
        error = fetchError;
      }

      if (error) {
        console.error("Error fetching banners:", error.message);
      } else {
        setBanners(data || []); // Store fetched banners
      }
    };

    fetchBanners();
  }, [showOwned, userId]);

  // Fetch stickers based on toggle state
  useEffect(() => {
    const fetchStickers = async () => {
      let data;
      let error;

      if (showOwned && userId) {
        // Fetch only user-owned stickers
        const { data: ownedStickers, error: ownedError } = await supabase
          .from("user_stickers")
          .select("sticker_id")
          .eq("user_id", userId);

        if (ownedError) {
          console.error("Error fetching owned stickers:", ownedError.message);
          return;
        }

        const { data: allStickers, error: fetchError } = await supabase
          .from("stickers")
          .select()
          .in("id", ownedStickers.map((s) => s.sticker_id));

        data = allStickers;
        error = fetchError;
      } else {
        // Fetch all stickers
        const { data: allStickers, error: fetchError } = await supabase
          .from("stickers")
          .select();

        data = allStickers;
        error = fetchError;
      }

      if (error) {
        console.error("Error fetching stickers:", error.message);
      } else {
        setStickers(data || []); // Store fetched stickers
      }
    };

    fetchStickers();
  }, [showOwned, userId]);

  // Toggle function for switch
  const toggleSwitch = () => {
    setShowOwned((prev) => !prev);
    console.log("Show Owned:", !showOwned); // Log the toggle switch state
  };

  const handleGetBanner = async (bannerId) => {
    if (!userId) return;

    const { data, error: checkError } = await supabase
      .from("user_banners")
      .select("id")
      .eq("user_id", userId)
      .eq("banner_id", bannerId);

    if (checkError) {
      console.error("Error checking user_banners:", checkError.message);
      Alert.alert("Error", "Failed to check banner ownership. Please try again.");
      return;
    }

    if (data.length > 0) {
      Alert.alert("Notice", "You already own this banner.");
      return;
    }

    const { error } = await supabase
      .from("user_banners")
      .insert([{ user_id: userId, banner_id: bannerId }]);

    if (error) {
      console.error("Error inserting into user_banners:", error.message);
      Alert.alert("Error", "Failed to acquire banner. Please try again.");
    } else {
      Alert.alert("Success", "You have acquired the banner!");
      console.log("Acquired Banner ID:", bannerId);
    }
  };

  const handleGetSticker = async (stickerId) => {
    if (!userId) return;

    const { data, error: checkError } = await supabase
      .from("user_stickers")
      .select("id")
      .eq("user_id", userId)
      .eq("sticker_id", stickerId);

    if (checkError) {
      console.error("Error checking user_stickers:", checkError.message);
      Alert.alert("Error", "Failed to check sticker ownership. Please try again.");
      return;
    }

    if (data.length > 0) {
      Alert.alert("Notice", "You already own this sticker.");
      return;
    }

    const { error } = await supabase
      .from("user_stickers")
      .insert([{ user_id: userId, sticker_id: stickerId }]);

    if (error) {
      console.error("Error inserting into user_stickers:", error.message);
      Alert.alert("Error", "Failed to acquire sticker. Please try again.");
    } else {
      Alert.alert("Success", "You have acquired the sticker!");
      console.log("Acquired Sticker ID:", stickerId);
    }
  };

  return (
    <View>
      <Header
        event="shop"
        navigation={navigation}
        title="Shop"
        toggleSwitch={toggleSwitch} // Pass toggleSwitch function
        switchValue={showOwned} // Pass switch value
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Banners Category Box */}
        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Banners</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.itemsContainer}>
            {banners.map((banner) => (
              <View key={banner.id} style={styles.mergedFrame}>
                <View style={styles.itemFrame}>
                  <Image
                    source={{ uri: banner.image_url }} // Assuming image_url is available
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    onPress={() => handleGetBanner(banner.id)}
                    style={styles.getButton}
                  >
                    <Text style={styles.buttonText}>Get</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Stickers Category Box */}
        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Stickers</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.itemsContainer}>
            {stickers.map((sticker) => (
              <View key={sticker.id} style={styles.mergedFrame}>
                <View style={styles.itemFrame}>
                  <Image
                    source={{ uri: sticker.image_url }} // Assuming image_url is available
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    onPress={() => handleGetSticker(sticker.id)}
                    style={styles.getButton}
                  >
                    <Text style={styles.buttonText}>Get</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "flex-start", // Align items to the left
  },
  categoryBox: {
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    width: "100%", // Full width for category boxes
  },
  categoryText: {
    fontSize: 24, // Larger font size for category names
    fontWeight: "bold",
    textAlign: "left",
  },
  scrollContainer: {
    flexDirection: "row",
    marginBottom: 20, // Space between categories
  },
  itemsContainer: {
    flexDirection: "row",
    alignItems: "flex-start", // Align items to the top
    height: 200, // Increased height for better visibility
  },
  mergedFrame: {
    marginRight: 10,
  },
  itemFrame: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 20,
    width: 180, // Width of the item
    height: 200, // Height of the item
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Adjusted padding
    overflow: "hidden", // Ensures image doesn't overflow
  },
  image: {
    width: "100%",
    height: "100%", // Adjusted height to fit within the item frame
    marginBottom: -5, // Space between image and button
  },
  getButton: {
    backgroundColor: "#4CAF50",
    padding: 10, // Reduced padding for the button
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default GiftsScreen;
