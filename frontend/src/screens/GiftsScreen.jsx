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

  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

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
          .in("id", ownedBanners.map(b => b.banner_id));

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
          .in("id", ownedStickers.map(s => s.sticker_id));

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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {banners.map((banner) => (
              <View key={banner.id} style={styles.mergedFrame}>
                <View style={styles.itemFrame}>
                  <Image
                    source={{ uri: banner.image_url }}
                    style={styles.bannerImage}
                  />
                </View>
                <View style={styles.separator} />
                <View style={styles.buttonFrame}>
                  <Text style={styles.itemName}>{banner.name}</Text>
                  {showOwned && userId ? (
                    // Check if the user owns the banner to decide button text
                    <TouchableOpacity style={styles.getButton}
                      onPress={() => handleGetBanner(banner.id)}>
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.getButton}
                      onPress={() => handleGetBanner(banner.id)}>
                      <Text style={styles.buttonText}>Get</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Stickers Category Box */}
        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Stickers</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
          >
            {stickers.map((sticker) => (
              <View key={sticker.id} style={styles.mergedFrame}>
                <View style={styles.itemFrame}>
                  <Image
                    source={{ uri: sticker.image_url }}
                    style={styles.bannerImage}
                  />
                </View>
                <View style={styles.separator} />
                <View style={styles.buttonFrame}>
                  <Text style={styles.itemName}>{sticker.name}</Text>
                  {showOwned && userId ? (
                    // Check if the user owns the sticker to decide button text
                    <TouchableOpacity style={styles.getButton}
                      onPress={() => handleGetSticker(sticker.id)}>
                      <Text style={styles.buttonText}>Owned</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.getButton}
                      onPress={() => handleGetSticker(sticker.id)}>
                      <Text style={styles.buttonText}>Get</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  categoryBox: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  scrollContainer: {
    paddingVertical: 5,
  },
  mergedFrame: {
    marginRight: 10,
    alignItems: "center",
  },
  itemFrame: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  separator: {
    height: 5,
  },
  buttonFrame: {
    alignItems: "center",
  },
  itemName: {
    fontSize: 14,
    marginBottom: 5,
  },
  getButton: {
    backgroundColor: "#008CBA",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default GiftsScreen;
