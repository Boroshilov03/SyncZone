import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedBannersModal = ({ visible, onClose }) => {
  const { user } = useStore(); // Get the current user
  const [ownedBanners, setOwnedBanners] = useState([]); // State to store the user's owned banners
  const [loading, setLoading] = useState(true); // State to manage loading status
  const [activeBannerId, setActiveBannerId] = useState(null); // State to track the currently active banner

  useEffect(() => { // Effect to fetch owned banners when the component mounts or user changes
    const fetchOwnedBanners = async () => {
      if (!user) return; // If there's no user, exit the function

      const { data: userBanners, error } = await supabase // Fetch user's owned banners from the user_banners table
        .from("user_banners")
        .select("banner_id")
        .eq("user_id", user.id); // Query user_banners table to get banner IDs for the logged-in user

      if (error) { // If there's an error fetching user banners
        console.error("Error fetching user_banners:", error.message); // Log the error
        Alert.alert("Error", "Failed to fetch owned banners."); // Show an alert
        setLoading(false); // Set loading to false
        return; // Exit the function
      }

      if (userBanners.length > 0) { // If the user has owned banners
        const bannerIds = userBanners.map(banner => banner.banner_id); // Extract the banner IDs
        const { data: banners, error: bannersError } = await supabase // Fetch banner details from the banners table using the extracted IDs
          .from("banners")
          .select("*")
          .in("id", bannerIds); // Query banners table for details of owned banners

        if (bannersError) { // If there's an error fetching banners
          console.error("Error fetching banners:", bannersError.message); // Log the error
          Alert.alert("Error", "Failed to fetch banners."); // Show an alert
        } else {
          setOwnedBanners(banners); // Set the owned banners state with the fetched banners
        }
      }

      // Fetch current active banner
      const { data: currentActive, error: currentActiveError } = await supabase // Fetch the currently active banner from the active_banner table
        .from("active_banner")
        .select("banner_id")
        .eq("user_id", user.id) // Query to get the active banner for the logged-in user
        .single(); // Get a single record

      if (!currentActiveError && currentActive) {  // If no error and currentActive exists
        setActiveBannerId(currentActive.banner_id); // Set active banner ID
      }

      setLoading(false); // Set loading to false after fetching data
    };

    fetchOwnedBanners(); // Call the function to fetch owned banners
  }, [user]); // Dependency array: re-run effect when user changes

  const handleBannerSelect = async (bannerId) => { // Function to handle banner selection
    if (!user) return; // If there's no user, exit the function

    // Check if the bannerId is already set as active
    const { data: currentActive, error: currentActiveError } = await supabase
      .from("active_banner")
      .select("banner_id")
      .eq("user_id", user.id)  // Query to get the current active banner
      .single();  // Get a single record

    if (currentActiveError && currentActiveError.code !== 'PGRST116') { // Check for errors, excluding a specific one
      Alert.alert("Error", "Failed to fetch current active banner."); // Show an alert
      return;  // Exit the function
    }

    if (currentActive && currentActive.banner_id === bannerId) {  // If the selected banner is already active
      Alert.alert("Info", "This banner is already active."); // Show an info alert
      return; // Do nothing if the selected banner is already active
    }

    // Update or insert the active banner in the active_banner table
    const { data, error } = currentActive
      ? await supabase
          .from("active_banner")
          .update({ banner_id: bannerId }) // Update the existing active banner
          .eq("user_id", user.id) // Where the user matches
      : await supabase
          .from("active_banner")
          .insert({ user_id: user.id, banner_id: bannerId }); // Insert new active banner

    if (error) { // If there's an error updating or inserting
      console.error("Error setting active banner:", error.message); // Log the error
      //Alert.alert("Error", "Failed to set active banner."); // Show an alert
    } else {
      setActiveBannerId(bannerId); // Update the active banner ID in state
      //Alert.alert("Success", "Active banner updated successfully."); // Show a success alert
      // Do not close the modal here
    }
  };

  const handleRemoveActiveBanner = async () => { // Function to handle removing the active banner
    if (!user) return;

    const { data, error } = await supabase // Delete the active banner from the active_banner table
      .from("active_banner")
      .delete() // Delete operation
      .eq("user_id", user.id); // Where the user matches

    if (error) {  // If there's an error deleting the active banner
      console.error("Error removing active banner:", error.message);  // Log the error
      //Alert.alert("Error", "Failed to remove active banner."); // Show an alert
    } else {
      setActiveBannerId(null); // Clear the active banner ID in state
      //Alert.alert("Success", "Active banner removed successfully."); // Show a success alert
    }
  };

  return ( // Rendering the modal component
    <Modal
      transparent={true} // Make the modal transparent
      animationType="slide" // Animation type for opening the modal
      visible={visible}  // Control the visibility of the modal
      onRequestClose={onClose}  // Callback to execute when the modal requests to close
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
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { // Style for the modal overlay
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  }, 
  modalContainer: { // Style for the modal container
    width: '80%',  // Width of the modal
    backgroundColor: '#fff', // Background color of the modal
    borderRadius: 10, // Rounded corners
    padding: 20, // Padding inside the modal
  },
  modalTitle: { // Style for the modal title
    fontSize: 24, // Font size for the title
    fontWeight: 'bold', // Bold text
    marginBottom: 5, // Space below the title
  },
  closeButton: { // Style for the close button
    alignSelf: 'flex-end', // Align to the right
    marginBottom: 10, // Space below the button
    backgroundColor: 'lightblue',
    borderRadius: 10,
    width: 70,
    height: 25,
    alignItems: 'center',
  },
  closeButtonText: { // Style for close button text
    color: 'white', // Color for the button text
    fontSize: 15,
    alignItems: 'center',
  },
  scrollContainer: { // Style for the scrollable container
    alignItems: 'center', // Vertical padding
  },
  bannerContainer: { // Style for each banner container
    marginBottom: 15, // Row layout
    padding: 10, // Padding around each banner
    borderWidth: 1, // Border width
    borderColor: '#ddd', // Border color
    borderRadius: 5, // Rounded corners
    alignItems: 'center', // Space below each banner
  },
  activeBanner: { // Style for the active banner
    backgroundColor: '#e0f7fa', // Change to the desired color for the active banner
    borderColor: '#007bff', // Optional: change border color for the active banner
  },
  bannerImage: { // Style for the banner image
    width: 100, // Width of the image
    height: 100, // Height of the image
  },
  bannerName: { // Style for the banner name
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
    borderRadius: 10,
    alignItems: 'center',
    width: 80,
    height: 40,
    left: 105,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    bottom: 2,
  },
});

export default OwnedBannersModal;
