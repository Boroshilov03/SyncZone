import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  Animated, // Import Animated
} from "react-native";
import React, { useEffect, useState, useRef  } from "react";
import { supabase } from "../lib/supabase"; // Import Supabase client for Database Operations
import useStore from "../store/store"; // Import store for state management
import Header from "../components/Header"; //Import Header Component
//import BannerCategory from "../../assets/icons/OwnedButton.png";
//import BannerStickers from "../../assets/icons/OwnedButton1.png";
import { Pacifico_400Regular } from "@expo-google-fonts/pacifico"; // Import Pacifico font
import { Poppins_400Regular } from "@expo-google-fonts/poppins"; // Import Poppins font
import { useFonts } from "expo-font";
import { LinearGradient } from "expo-linear-gradient";

const GiftsScreen = ({ navigation }) => {
  const { user } = useStore(); // Retrieve the user from the store
  const [userId, setUserId] = useState(null); // State for storing the user ID
  const [banners, setBanners] = useState([]); // State for storing fetched banners
  const [stickers, setStickers] = useState([]); // State for storing fetched stickers
  const [showOwned, setShowOwned] = useState(false); // State for toggle switch
  const [user_banners, setUserBanners] = useState(new Set()); // Set to track owned banners
  const [user_stickers, setUserStickers] = useState(new Set()); // Set to track owned stickers

  // Animated values for button scale and success message
  const scaleAnim = useRef(new Animated.Value(1)).current; // Start with normal size
  const opacityAnim = useRef(new Animated.Value(0)).current; // Start with hidden success message


    // Load fonts
  const [fontsLoaded] = useFonts({
    Pacifico: Pacifico_400Regular,
    Poppins: Poppins_400Regular,
  });

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
    if (!userId) return;

    const { data, error: checkError } = await supabase // Check if the user already owns this banner
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

    const { error } = await supabase // Insert the banner acquisition into the user_banners table
      .from("user_banners")
      .insert([{ user_id: userId, banner_id: bannerId }]);

    if (error) {
      console.error("Error inserting into user_banners:", error.message);
      Alert.alert("Error", "Failed to acquire banner. Please try again.");
    } else {
      // Success Animation for button and success message
      Animated.sequence([
        // Scale up the button
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        // Scale back to normal size
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Show the success message with opacity animation
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Alert.alert("Success", "You have acquired the banner!");
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
    <LinearGradient
      colors={[ "#FFE4E1","#fff" ]}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        <Header
          event="shop"
          navigation={navigation}
          title="Shop"
          toggleSwitch={toggleSwitch}
          switchValue={showOwned}
        />
      </View>
  
      {/* Main Vertical ScrollView */}
      <ScrollView contentContainerStyle={styles.verticalScrollContainer}>
        {/* Banners Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.bannersTitle}>BANNERS</Text>
  
          {/* Horizontal ScrollView for Banners */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContainer}
          >
            {banners.map((banner) => {
              const isOwned = user_banners.has(banner.id);
              return showOwned ? (
                isOwned ? (
                  <View key={banner.id} style={styles.itemFrame}>
                    <Image
                      source={{ uri: banner.image_url }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                    <Text style={styles.bannerName}>{banner.name}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.ownedButton]}
                      disabled
                    >
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              ) : !isOwned ? (
                <View key={banner.id} style={styles.itemFrame}>
                  <Image
                    source={{ uri: banner.image_url }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                  <Text style={styles.bannerName}>{banner.name}</Text>
                  <TouchableOpacity
                    style={[styles.button, styles.getButton]}
                    onPress={() => handleGetBanner(banner.id)}
                  >
                    <Animated.Text
                      style={[styles.buttonText, { transform: [{ scale: scaleAnim }] }]}
                    >
                      Get
                    </Animated.Text>
                  </TouchableOpacity>
                </View>
              ) : null;
            })}
          </ScrollView>
  
          {/* Show "More Banners Coming Soon..." only if all banners are owned */}
          {!showOwned && banners.filter(banner => !user_banners.has(banner.id)).length === 0 && (
            <Text style={styles.moreMessage}>More Banners Coming Soon...</Text>
          )}
        </View>
  
        {/* Stickers Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.bannersTitle}>STICKERS</Text>
  
          {/* Horizontal ScrollView for Stickers */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {stickers.map((sticker) => {
              const isOwned = user_stickers.has(sticker.id);
              return showOwned ? (
                isOwned ? (
                  <View key={sticker.id} style={styles.itemFrame}>
                    <Image
                      source={{ uri: sticker.image_url }}
                      style={styles.image}
                      resizeMode="contain"
                    />
                    <Text style={styles.bannerName}>{sticker.name}</Text>
                    <TouchableOpacity
                      style={[styles.button, styles.ownedButton]}
                      disabled
                    >
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  </View>
                ) : null
              ) : !isOwned ? (
                <View key={sticker.id} style={styles.itemFrame}>
                  <Image
                    source={{ uri: sticker.image_url }}
                    style={styles.image}
                    resizeMode="contain"
                  />
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
          </ScrollView>
  
          {/* Show "More Stickers Coming Soon..." only if all stickers are owned */}
          {!showOwned && stickers.filter(sticker => !user_stickers.has(sticker.id)).length === 0 && (
            <Text style={styles.moreMessage}>More Stickers Coming Soon...</Text>
          )}
        </View>
      </ScrollView>
  
      {/* Success Message Animation */}
      <Animated.View
        style={[
          styles.successMessageContainer,
          { opacity: opacityAnim }, // Success message visibility
        ]}
      >
        <Text style={styles.successMessage}>Banner Acquired!</Text>
      </Animated.View>
    </LinearGradient>
  );
  
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "relative",
    zIndex: 1,
    top: -10.1,

  },

  sectionContainer: {
    marginBottom: 30, // Space between sections
  },
  bannersTitle: {
    // fontFamily: "Pacifico",
    fontSize: 40,
    fontWeight: 'bold',
    color: "gray",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "#FFE4E1",
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  verticalScrollContainer: {
    paddingVertical: 0,
    paddingHorizontal: 1,
  },
  scrollContainer: {
    flexDirection: "row", // Items will be displayed horizontally
    alignItems: "center",
  },
  itemFrame: {
    backgroundColor: "#FFE4E1",
    borderWidth: 1,
    borderColor: "#FFB6C1",
    borderRadius: 20,
    marginRight: 20, // Space between items horizontally
    padding: 15,
    alignItems: "center",
    width: 130,
    shadowColor: "#FFC0CB",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 10,
  },
  bannerName: {
    marginVertical: 5,
    fontSize: 20,
    color: "#7A6FDC",
    fontWeight: "bold",
    textAlign: "center",
  },
  button: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  getButton: {
    backgroundColor: "#FF69B4",
  },
  ownedButton: {
    backgroundColor: "#F8BBD0",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  moreMessage: {
    textAlign: "center",
    fontSize: 18,
    color: "#FF69B4",
    fontWeight: "bold",
    marginTop: 20,
  },
});


export default GiftsScreen;