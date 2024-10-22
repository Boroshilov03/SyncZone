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
  const [ownedBanners, setOwnedBanners] = useState(new Set()); // Set to track owned banners
  const [ownedStickers, setOwnedStickers] = useState(new Set()); // Set to track owned stickers

  // Fetch and log user ID, banners (IDs), stickers (IDs), user_banners (IDs), and user_stickers (IDs)
  useEffect(() => {
    const logUserData = async () => {
      if (user) {
        setUserId(user.id);
        console.log("User ID:", user.id); // Log user ID

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
          setOwnedBanners(new Set(userBannerIds)); // Store owned banners in state
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
          setOwnedStickers(new Set(userStickerIds)); // Store owned stickers in state
        }
      }
    };

    // Call logUserData once when component mounts
    logUserData();
  }, [user]);

  // Fetch banners based on toggle state
  useEffect(() => {
    const fetchBanners = async () => {
      let data;
      let error;

      if (showOwned && userId) {
        // Fetch only user-owned banners
        const { data: ownedBannersData, error: ownedError } = await supabase
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
          .in("id", ownedBannersData.map((b) => b.banner_id));

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
        const { data: ownedStickersData, error: ownedError } = await supabase
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
          .in("id", ownedStickersData.map((s) => s.sticker_id));

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
      setOwnedBanners((prev) => new Set(prev).add(bannerId)); // Update owned banners
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
      setOwnedStickers((prev) => new Set(prev).add(stickerId)); // Update owned stickers
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
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Banners</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.itemsContainer}>
            {banners.map((banner) => (
              <View key={banner.id} style={styles.itemFrame}>
                <Image
                  source={{ uri: banner.image_url }} // Assuming image_url is available
                  style={styles.image}
                  resizeMode="contain"
                />
                {/* Banner Name */}
                <Text style={styles.bannerName}>{banner.name}</Text>
                <TouchableOpacity
                  style={[
                    styles.button,
                    ownedBanners.has(banner.id)
                      ? styles.ownedButton // Greyed out style for "Owned"
                      : styles.getButton, // Green style for "Get"
                  ]}
                  onPress={() => handleGetBanner(banner.id)}
                  disabled={ownedBanners.has(banner.id)} // Disable if owned
                >
                  <Text style={styles.buttonText}>
                    {ownedBanners.has(banner.id) ? "Owned" : "Get"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Stickers Category Box */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Stickers</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.itemsContainer}>
            {stickers.map((sticker) => (
              <View key={sticker.id} style={styles.itemFrame}>
                <Image
                  source={{ uri: sticker.image_url }} // Assuming image_url is available
                  style={styles.image}
                  resizeMode="contain"
                />
                {/* Sticker Name */}
                <Text style={styles.stickerName}>{sticker.name}</Text>
                <TouchableOpacity
                  style={[
                    styles.button,
                    ownedStickers.has(sticker.id)
                      ? styles.ownedButton // Greyed out style for "Owned"
                      : styles.getButton, // Green style for "Get"
                  ]}
                  onPress={() => handleGetSticker(sticker.id)}
                  disabled={ownedStickers.has(sticker.id)} // Disable if owned
                >
                  <Text style={styles.buttonText}>
                    {ownedStickers.has(sticker.id) ? "Owned" : "Get"}
                  </Text>
                </TouchableOpacity>
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
  },
  categoryContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc', // Border color for the category box
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  itemsContainer: {
    flexDirection: 'row',
  },
  itemFrame: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
  },
  bannerName: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  stickerName: {
    marginTop: 5,
    fontWeight: 'bold',
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  getButton: {
    backgroundColor: '#28a745', // Green color for "Get"
  },
  ownedButton: {
    backgroundColor: '#cccccc', // Grey color for "Owned"
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default GiftsScreen;
