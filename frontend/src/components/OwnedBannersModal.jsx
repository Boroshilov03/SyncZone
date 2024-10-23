import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedBannersModal = ({ visible, onClose }) => {
  const { user } = useStore(); // Retrieve the user from the store
  const [ownedBanners, setOwnedBanners] = useState([]); // State for storing owned banners
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchOwnedBanners = async () => {
      if (!user) return; // Exit if user is not defined

      const { data: userBanners, error } = await supabase
        .from("user_banners")
        .select("banner_id")
        .eq("user_id", user.id); // Assuming `user.id` is the correct way to access user ID

      if (error) {
        console.error("Error fetching user_banners:", error.message);
        Alert.alert("Error", "Failed to fetch owned banners.");
        setLoading(false);
        return;
      }

      // Fetch the banner details
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
          setOwnedBanners(banners); // Set the owned banners to the state
        }
      }

      setLoading(false); // Stop loading
    };

    fetchOwnedBanners();
  }, [user]); // Dependency on user

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Select Banners</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>

          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {ownedBanners.length > 0 ? (
                ownedBanners.map(banner => (
                  <View key={banner.id} style={styles.bannerContainer}>
                    <Image source={{ uri: banner.image_url }} style={styles.bannerImage} />
                    <Text style={styles.bannerName}>{banner.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noBannersText}>You have no owned banners.</Text>
              )}
            </ScrollView>
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
    alignItems: 'center', // Center the items in the column
  },
  bannerContainer: {
    marginBottom: 15,
    padding: 10, // Add some padding
    borderWidth: 1, // Add a border
    borderColor: '#ddd', // Set the border color
    borderRadius: 5, // Round the corners
    alignItems: 'center', // Center the items in the container
    //backgroundColor: '#fffbf5', // Use your preferred background color
  },
  bannerImage: {
    width: 100,
    height: 100,
  },
  bannerName: {
    marginTop: 5,
    textAlign: 'center',
    color: 'black', // Set text color to black
  },
  noBannersText: {
    textAlign: 'center',
    marginTop: 10,
  },
});

export default OwnedBannersModal;
