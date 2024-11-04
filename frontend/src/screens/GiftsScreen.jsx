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
import { supabase } from "../lib/supabase"; // Import Supabase client for Database Operations
import useStore from "../store/store"; // Import store for state management
import Header from "../components/Header"; //Import Header Component

const GiftsScreen = ({ navigation }) => {
  const { user } = useStore(); // Retrieve the user from the store
  const [userId, setUserId] = useState(null); // State for storing the user ID
  const [banners, setBanners] = useState([]); // State for storing fetched banners
  const [stickers, setStickers] = useState([]); // State for storing fetched stickers
  const [showOwned, setShowOwned] = useState(false); // State for toggle switch
  const [user_banners, setUserBanners] = useState(new Set()); // Set to track owned banners
  const [user_stickers, setUserStickers] = useState(new Set()); // Set to track owned stickers

  // Fetch and log user ID, banners (IDs), stickers (IDs), user_banners (IDs), and user_stickers (IDs)
  useEffect(() => {
    // side effects in function compenents
    const logUserData = async () => {
      if (user) {
        setUserId(user.id); // Set the user ID in the state
        console.log("User ID:", user.id); // Log user ID

        // Fetch user-owned banners from Supabase
        const { data: userBanners, error: userBannersError } = await supabase
          .from("user_banners")
          .select("banner_id") // Select only the banner_id column
          .eq("user_id", user.id); // Filter by user ID

        if (userBannersError) {
          console.error(
            "Error fetching user_banners:",
            userBannersError.message
          ); // Log any errors
        } else {
          const userBannerIds = userBanners.map((ub) => ub.banner_id); // Extract banner IDs from the response
          console.log("user_banners:", userBannerIds); // Log user_banners IDs once
          setUserBanners(new Set(userBannerIds)); // Store owned banners in state
        }

        // Fetch user-owned stickers
        const { data: userStickers, error: userStickersError } = await supabase
          .from("user_stickers")
          .select("sticker_id") // Select only the sticker_id column
          .eq("user_id", user.id); // Filter by user ID

        if (userStickersError) {
          console.error(
            "Error fetching user_stickers:",
            userStickersError.message
          ); // Log any errors
        } else {
          const userStickerIds = userStickers.map((us) => us.sticker_id); // Extract sticker IDs from the response
          console.log("user_stickers:", userStickerIds); // Log user_stickers IDs once
          setUserStickers(new Set(userStickerIds)); //Store owned stickers in state as a Set for unique values
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

      // Fetch all banners from the database
      const { data: allBanners, error: fetchError } = await supabase
        .from("banners")
        .select(); // Fetch all records

      data = allBanners;
      error = fetchError;

      if (error) {
        console.error("Error fetching banners:", error.message);
      } else {
        setBanners(data || []); // Store fetched banners
      }
    };

    fetchBanners(); // Invoke the fetchBanners function
  }, []);

  // Fetch stickers based on toggle state
  useEffect(() => {
    const fetchStickers = async () => {
      let data;
      let error;

      // Fetch all stickers from the database
      const { data: allStickers, error: fetchError } = await supabase
        .from("stickers")
        .select(); // Fetch all records

      data = allStickers;
      error = fetchError;

      if (error) {
        console.error("Error fetching stickers:", error.message);
      } else {
        setStickers(data || []); // Store fetched stickers
      }
    };

    fetchStickers(); // Invoke the fetchStickers function
  }, []);

  // Toggle function for switch to show owned items
  const toggleSwitch = () => {
    setShowOwned((prev) => !prev);
    console.log("Show Owned:", !showOwned); // Log the toggle switch state
  };

  const handleGetBanner = async (bannerId) => {
    // Function to handle acquiring a banner
    if (!userId) return;

    const { data, error: checkError } = await supabase // Check if the user already owns this banner
      .from("user_banners")
      .select("id")
      .eq("user_id", userId)
      .eq("banner_id", bannerId);

    if (checkError) {
      console.error("Error checking user_banners:", checkError.message);
      Alert.alert(
        "Error",
        "Failed to check banner ownership. Please try again."
      );
      return;
    }

    if (data.length > 0) {
      Alert.alert("Notice", "You already own this banner.");
      return;
    }

    const { error } = await supabase // Insert the banner acquisition into the user_banners table
      .from("user_banners")
      .insert([{ user_id: userId, banner_id: bannerId }]); // Insert new ownership record

    if (error) {
      console.error("Error inserting into user_banners:", error.message);
      Alert.alert("Error", "Failed to acquire banner. Please try again.");
    } else {
      Alert.alert("Success", "You have acquired the banner!"); // Notify success
      console.log("Acquired Banner ID:", bannerId); // Log the acquired banner ID
      setUserBanners((prev) => new Set(prev).add(bannerId)); // Update owned banners in state
    }
  };

  const handleGetSticker = async (stickerId) => {
    // Function to handle acquiring a sticker
    if (!userId) return; // If user ID is not available, exit

    const { data, error: checkError } = await supabase // Check if the user already owns this sticker
      .from("user_stickers")
      .select("id") // Select any ID to check existence
      .eq("user_id", userId)
      .eq("sticker_id", stickerId);

    if (checkError) {
      console.error("Error checking user_stickers:", checkError.message);
      Alert.alert(
        "Error",
        "Failed to check sticker ownership. Please try again."
      );
      return;
    }

    if (data.length > 0) {
      Alert.alert("Notice", "You already own this sticker."); // Notify the user if they already own the sticker
      return;
    }

    const { error } = await supabase // Insert the sticker acquisition into the user_stickers table
      .from("user_stickers")
      .insert([{ user_id: userId, sticker_id: stickerId }]); // Insert new ownership record

    if (error) {
      console.error("Error inserting into user_stickers:", error.message); // Log any errors
      Alert.alert("Error", "Failed to acquire sticker. Please try again."); // Show error alert
    } else {
      Alert.alert("Success", "You have acquired the sticker!"); // Notify success
      console.log("Acquired Sticker ID:", stickerId); // Log the acquired sticker ID
      setUserStickers((prev) => new Set(prev).add(stickerId)); // Update owned stickers in state
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header
        event="shop" // Pass event prop for identifying shop context
        navigation={navigation} // Pass navigation prop for navigation
        title="Shop" // Set static title for the Header
        toggleSwitch={toggleSwitch} // Pass toggleSwitch function for handling switch
        switchValue={showOwned} // Pass switch value to Header
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* Banners Category Box */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>Banners</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false} // Hide horizontal scroll indicator
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.itemsContainer}>
            {banners.map((banner) => {
              const isOwned = user_banners.has(banner.id); // Check if the current banner is owned
              return showOwned ? (
                isOwned ? ( // If showOwned is true, render owned banners only
                  <View key={banner.id} style={styles.itemFrame}>
                    <Image
                      source={{ uri: banner.image_url }} //  image_url is available
                      style={styles.image}
                      resizeMode="contain"
                    />
                    {/* Banner Name */}
                    <Text style={styles.bannerName}>{banner.name}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.ownedButton]} // Always use ownedButton style
                      disabled // Disable the button for owned items
                    >
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              ) : !isOwned ? ( // If showOwned is false, render unowned banners only
                <View key={banner.id} style={styles.itemFrame}>
                  <Image
                    source={{ uri: banner.image_url }} // image_url is available
                    style={styles.image}
                    resizeMode="contain"
                  />
                  {/* Banner Name */}
                  <Text style={styles.bannerName}>{banner.name}</Text>
                  <TouchableOpacity
                    style={[styles.button, styles.getButton]}
                    onPress={() => handleGetBanner(banner.id)}
                  >
                    <Text style={styles.buttonText}>Get</Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
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
            {stickers.map((sticker) => {
              const isOwned = user_stickers.has(sticker.id);
              return showOwned ? (
                isOwned ? (
                  <View key={sticker.id} style={styles.itemFrame}>
                    <Image
                      source={{ uri: sticker.image_url }} // Assuming image_url is available
                      style={styles.image}
                      resizeMode="contain"
                    />
                    {/* Sticker Name */}
                    <Text style={styles.bannerName}>{sticker.name}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.ownedButton]} // Always use ownedButton style
                      disabled // Disable the button for owned items
                    >
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              ) : !isOwned ? (
                <View key={sticker.id} style={styles.itemFrame}>
                  <Image
                    source={{ uri: sticker.image_url }} // image_url is available
                    style={styles.image}
                    resizeMode="contain"
                  />
                  {/* Sticker Name */}
                  <Text style={styles.bannerName}>{sticker.name}</Text>
                  <TouchableOpacity
                    style={[styles.button, styles.getButton]}
                    onPress={() => handleGetSticker(sticker.id)}
                  >
                    <Text style={styles.buttonText}>Get</Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Main container fir GiftSCreen component
    // padding: 10, //Providing some space between container's border and its content
  },
  categoryContainer: {
    //Style for boxes for Banners and Stickers
    marginBottom: 8, //Adds vertical margin (Space above and below)
    padding: 10, // Adds Padding inside the box
    borderWidth: 1, // Defines the border's width as 1 pixel.
    borderColor: "#ccc", // Sets the border color to a loght gray
    borderRadius: 8, // Rounds the corners of the box.
    marginHorizontal: 10,
  },
  categoryText: {
    // Style adds text to display Catefgory names (Banners/Stickers)
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContainer: {
    // USed for SCrollView for contain items
    flexDirection: "row", // Horizontal
    paddingVertical: 10, // vertical space
  },
  itemsContainer: {
    //Individual item box
    flexDirection: "row", 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25, 
    shadowRadius: 2,
    elevation: 3,
    marginLeft: 10,
    marginBottom: 10, 
  },
  itemFrame: {
    // image displayed for each banner or sticker
    backgroundColor: "#D1EBEF", //light blue
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    marginRight: 10,
    padding: 10,
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
  },
  bannerName: {
    marginVertical: 5,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    marginTop: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  getButton: {
    backgroundColor: "#F6D6EE",
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25, 
    shadowRadius: 3,
    elevation: 3,
  },
  ownedButton: {
    backgroundColor: "#adb5bd",
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25, 
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    fontWeight: "lightbold",
  },
});

export default GiftsScreen;
