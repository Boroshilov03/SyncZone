import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedBannersModal = ({ visible, onClose }) => {
  const { user } = useStore();
  const [ownedBanners, setOwnedBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBannerId, setActiveBannerId] = useState(null); // State to track the active banner

  useEffect(() => {
    const fetchOwnedBanners = async () => {
      if (!user) return;

      const { data: userBanners, error } = await supabase
        .from("user_banners")
        .select("banner_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user_banners:", error.message);
        Alert.alert("Error", "Failed to fetch owned banners.");
        setLoading(false);
        return;
      }

      if (userBanners.length > 0) {
        const bannerIds = userBanners.map(banner => banner.banner_id);
        const { data: banners, error: bannersError } = await supabase
          .from("banners")
          .select("*")
          .in("id", bannerIds);

        if (bannersError) {
          console.error("Error fetching banners:", bannersError.message);
          Alert.alert("Error", "Failed to fetch banners.");
        } else {
          setOwnedBanners(banners);
        }
      }

      // Fetch current active banner
      const { data: currentActive, error: currentActiveError } = await supabase
        .from("active_banner")
        .select("banner_id")
        .eq("user_id", user.id)
        .single();

      if (!currentActiveError && currentActive) {
        setActiveBannerId(currentActive.banner_id); // Set active banner ID
      }

      setLoading(false);
    };

    fetchOwnedBanners();
  }, [user]);

  const handleBannerSelect = async (bannerId) => {
    if (!user) return;

    // Check if the bannerId is already set as active
    const { data: currentActive, error: currentActiveError } = await supabase
      .from("active_banner")
      .select("banner_id")
      .eq("user_id", user.id)
      .single();

    if (currentActiveError && currentActiveError.code !== 'PGRST116') {
      Alert.alert("Error", "Failed to fetch current active banner.");
      return;
    }

    if (currentActive && currentActive.banner_id === bannerId) {
      Alert.alert("Info", "This banner is already active.");
      return; // Do nothing if the selected banner is already active
    }

    // Update or insert the active banner
    const { data, error } = currentActive
      ? await supabase
          .from("active_banner")
          .update({ banner_id: bannerId })
          .eq("user_id", user.id)
      : await supabase
          .from("active_banner")
          .insert({ user_id: user.id, banner_id: bannerId });

    if (error) {
      console.error("Error setting active banner:", error.message);
      Alert.alert("Error", "Failed to set active banner.");
    } else {
      setActiveBannerId(bannerId); // Update the active banner ID in state
      Alert.alert("Success", "Active banner updated successfully.");
      // Do not close the modal here
    }
  };

  const handleRemoveActiveBanner = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("active_banner")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error removing active banner:", error.message);
      Alert.alert("Error", "Failed to remove active banner.");
    } else {
      setActiveBannerId(null); // Clear the active banner ID in state
      Alert.alert("Success", "Active banner removed successfully.");
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select a Banner</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>

          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {ownedBanners.length > 0 ? (
                ownedBanners.map(banner => (
                  <TouchableOpacity 
                    key={banner.id} 
                    onPress={() => handleBannerSelect(banner.id)} 
                    style={[
                      styles.bannerContainer,
                      activeBannerId === banner.id && styles.activeBanner // Apply active style if this banner is active
                    ]}
                  >
                    <Image source={{ uri: banner.image_url }} style={styles.bannerImage} />
                    <Text style={styles.bannerName}>{banner.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noBannersText}>You have no owned banners.</Text>
              )}
            </ScrollView>
          )}
          {/* Button to remove the active banner */}
          {activeBannerId && (
            <TouchableOpacity onPress={handleRemoveActiveBanner} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove Active Banner</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  closeButtonText: {
    color: '#007bff',
  },
  scrollContainer: {
    alignItems: 'center',
  },
  bannerContainer: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    alignItems: 'center',
  },
  activeBanner: {
    backgroundColor: '#e0f7fa', // Change to the desired color for the active banner
    borderColor: '#007bff', // Optional: change border color for the active banner
  },
  bannerImage: {
    width: 100,
    height: 100,
  },
  bannerName: {
    marginTop: 5,
    textAlign: 'center',
    color: 'black',
  },
  noBannersText: {
    textAlign: 'center',
    marginTop: 10,
  },
  removeButton: {
    marginTop: 0,
    backgroundColor: '#ff5252', // Change to the desired color for the remove button
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default OwnedBannersModal;
