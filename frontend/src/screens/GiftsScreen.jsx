import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  SafeAreaView,
} from "react-native";
import React, { useEffect, useState } from "react";
import Dog from "../../assets/icons/Dogo.gif"; // Import the animated image
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Assuming this handles user and tokens
import Header from "../components/Header";


const GiftsScreen = ({navigation}) => {
  const { user } = useStore(); // Retrieve the user from the store
  const [userId, setUserId] = useState(null);
  const [banners, setBanners] = useState([]); // State for storing fetched banners
  const [stickers, setStickers] = useState([]); // State for storing fetched stickers

  // Log user ID and check if user is authenticated
  useEffect(() => {
    if (user) {
      setUserId(user.id);
      console.log("User ID:", user.id); // Log user ID
    } else {
      console.log("User is not authenticated");
    }
  }, [user]);

  // Fetch banners
  useEffect(() => {
    const fetchBanners = async () => {
      const { data, error } = await supabase.from("banners").select(); // Fetch all banners

      if (error) {
        console.error("Error fetching banners:", error.message);
      } else {
        setBanners(data); // Store fetched banners
        // Log fetched banner IDs
        console.log(
          "Fetched Banners IDs:",
          data.map((banner) => banner.id)
        ); // Log banner IDs
      }
    };

    fetchBanners();
  }, []);

  // Fetch stickers
  useEffect(() => {
    const fetchStickers = async () => {
      const { data, error } = await supabase.from("stickers").select(); // Fetch all stickers

      if (error) {
        console.error("Error fetching stickers:", error.message);
      } else {
        setStickers(data); // Store fetched stickers
        // Log fetched sticker IDs
        console.log(
          "Fetched Stickers IDs:",
          data.map((sticker) => sticker.id)
        ); // Log sticker IDs
      }
    };

    fetchStickers();
  }, []);

  // Function to handle "Get" button press for banners
  const handleGetBanner = async (bannerId) => {
    if (!userId) {
      console.log(
        "User is not authenticated. Cannot insert into user_banners."
      );
      return;
    }

    // Log the userId and bannerId before checking
    console.log("User ID:", userId);
    console.log("Checking if user already owns banner with ID:", bannerId); // Log bannerId before checking

    // Check if the user already owns the banner
    const { data, error: checkError } = await supabase
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
      // User already owns this banner
      Alert.alert("Notice", "You already own this banner.");
      return;
    }

    // Proceed to insert into user_banners table
    console.log("Inserting banner with ID:", bannerId); // Log bannerId before insertion

    const { error } = await supabase
      .from("user_banners")
      .insert([{ user_id: userId, banner_id: bannerId }]);

    if (error) {
      console.error("Error inserting into user_banners:", error.message);
      Alert.alert("Error", "Failed to acquire banner. Please try again.");
    } else {
      console.log("Banner acquired successfully!");
      Alert.alert("Success", "You have acquired the banner!");
    }
  };

  // Function to handle "Get" button press for stickers
  const handleGetSticker = async (stickerId) => {
    if (!userId) {
      console.log(
        "User is not authenticated. Cannot insert into user_stickers."
      );
      return;
    }

    // Log the userId and stickerId before checking
    console.log("User ID:", userId);
    console.log("Checking if user already owns sticker with ID:", stickerId); // Log stickerId before checking

    // Check if the user already owns the sticker
    const { data, error: checkError } = await supabase
      .from("user_stickers")
      .select("id")
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
      // User already owns this sticker
      Alert.alert("Notice", "You already own this sticker.");
      return;
    }

    // Proceed to insert into user_stickers table
    console.log("Inserting sticker with ID:", stickerId); // Log stickerId before insertion

    const { error } = await supabase
      .from("user_stickers")
      .insert([{ user_id: userId, sticker_id: stickerId }]);

    if (error) {
      console.error("Error inserting into user_stickers:", error.message);
      Alert.alert("Error", "Failed to acquire sticker. Please try again.");
    } else {
      console.log("Sticker acquired successfully!");
      Alert.alert("Success", "You have acquired the sticker!");
    }
  };

  return (
    <View>
      <Header event="shop" navigation={navigation} title="Shop" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Banners</Text>
        </View>

        {/* Horizontal ScrollView for Banner Items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Render fetched banners dynamically */}
          {banners.map((banner) => (
            <View key={banner.id} style={styles.mergedFrame}>
              {/* Frame for Banner Items */}
              <View style={styles.itemFrame}>
                <Image
                  source={{ uri: banner.image_url }}
                  style={styles.bannerImage}
                />
              </View>

              {/* Line in the center near the bottom */}
              <View style={styles.separator} />

              {/* Frame for Item Name and Get Button */}
              <View style={styles.buttonFrame}>
                <Text style={styles.itemName}>{banner.name}</Text>
                <TouchableOpacity
                  style={styles.getButton}
                  onPress={() => handleGetBanner(banner.id)}
                >
                  <Text style={styles.buttonText}>Get</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Stickers</Text>
        </View>

        {/* Horizontal ScrollView for Sticker Items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Render fetched stickers dynamically */}
          {stickers.map((sticker) => (
            <View key={sticker.id} style={styles.mergedFrame}>
              {/* Frame for Sticker Items */}
              <View style={styles.itemFrame}>
                <Image
                  source={{ uri: sticker.image_url }}
                  style={styles.bannerImage}
                />
              </View>

              {/* Line in the center near the bottom */}
              <View style={styles.separator} />

              {/* Frame for Item Name and Get Button */}
              <View style={styles.buttonFrame}>
                <Text style={styles.itemName}>{sticker.name}</Text>
                <TouchableOpacity
                  style={styles.getButton}
                  onPress={() => handleGetSticker(sticker.id)}
                >
                  <Text style={styles.buttonText}>Get</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

export default GiftsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 0,
  },
  categoryBox: {
    width: 360,
    height: 58,
    borderColor: "black",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 15,
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 13,
  },
  categoryText: {
    fontSize: 30,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  mergedFrame: {
    width: 180,
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 13,
    alignItems: "center",
    marginRight: 15,
    marginBottom: 30,
  },
  itemFrame: {
    width: "100%",
    height: 185,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
  },
  itemFrameText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    width: "100%",
    height: 2,
    backgroundColor: "black",
    marginVertical: 10,
  },
  buttonFrame: {
    width: "100%",
    height: 104,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: "bold",
  },
  getButton: {
    backgroundColor: "#007BFF",
    padding: 7,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  userIdText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: "bold",
  },
});
