import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedBannersModal = ({ visible, onClose }) => { // Functional component for displaying owned banners in a modal
  const { user } = useStore(); // Retrieve the user from the store
  const [ownedBanners, setOwnedBanners] = useState([]); // State for storing owned banners
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchOwnedBanners = async () => {
      if (!user) return; // Exit if user is not defined

      const { data: userBanners, error } = await supabase
        .from("user_banners")      // Select from the 'user_banners' table
        .select("banner_id")      // Select only the 'banner_id' field
        .eq("user_id", user.id);  //Filter by the current user's ID

      if (error) { // Handle any errors during the fetch
        console.error("Error fetching user_banners:", error.message); // Log the error message
        Alert.alert("Error", "Failed to fetch owned banners.");
        setLoading(false); 
        return;
      }

      // Fetch the details of the banners owned by the user
      if (userBanners.length > 0) {
        const bannerIds = userBanners.map(banner => banner.banner_id);
        const { data: banners, error: bannersError } = await supabase
          .from("banners") // Select from the 'banners' table
          .select("*")    // Select all fields
          .in("id", bannerIds);  // Filter by the list of banner IDs

        if (bannersError) {  // Handle any errors during the banner fetch
          console.error("Error fetching banners:", bannersError.message); // Log the error message
          Alert.alert("Error", "Failed to fetch banners."); // Show an alert for the error
        } else {
          setOwnedBanners(banners); // Set the owned banners to the state
        }
      }

      setLoading(false); // Stop loading
    };

    fetchOwnedBanners(); // Call the fetch function
  }, [user]); // Run this effect when the 'user' changes

  return (
    <Modal  //POP
      transparent={true} // Make the modal background transparent
      animationType="slide"  // Animate the modal with a slide effect
      visible={visible}    // Control visibility based on the 'visible' prop
      onRequestClose={onClose}   // Handle request to close the modal
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
