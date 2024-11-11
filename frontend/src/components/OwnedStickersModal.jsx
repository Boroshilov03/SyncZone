import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedStickersModal = ({ visible, onClose }) => {
  const { user } = useStore(); // Get the current user
  const [ownedStickers, setOwnedStickers] = useState([]); // State to store the user's owned stickers
  const [loading, setLoading] = useState(true); // State to manage loading status

  useEffect(() => { // Effect to fetch owned stickers when the component mounts or user changes
    const fetchOwnedStickers = async () => {
      if (!user) return; // If there's no user, exit the function

      const { data: userStickers, error } = await supabase // Fetch user's owned stickers from the user_stickers table
        .from("user_stickers")
        .select("sticker_id")
        .eq("user_id", user.id); // Query user_stickers table to get sticker IDs for the logged-in user

      if (error) { // If there's an error fetching user stickers
        console.error("Error fetching user_stickers:", error.message); // Log the error
        Alert.alert("Error", "Failed to fetch owned stickers."); // Show an alert
        setLoading(false); // Set loading to false
        return; // Exit the function
      }

      if (userStickers.length > 0) { // If the user has owned stickers
        const stickerIds = userStickers.map(sticker => sticker.sticker_id); // Extract the sticker IDs
        const { data: stickers, error: stickersError } = await supabase // Fetch sticker details from the stickers table using the extracted IDs
          .from("stickers")
          .select("*")
          .in("id", stickerIds); // Query stickers table for details of owned stickers

        if (stickersError) { // If there's an error fetching stickers
          console.error("Error fetching stickers:", stickersError.message); // Log the error
          Alert.alert("Error", "Failed to fetch stickers."); // Show an alert
        } else {
          setOwnedStickers(stickers); // Set the owned stickers state with the fetched stickers
        }
      }

      setLoading(false); // Set loading to false after fetching data
    };

    fetchOwnedStickers(); // Call the function to fetch owned stickers
  }, [user]); // Dependency array: re-run effect when user changes

  return ( // Rendering the modal component
    <Modal
      transparent={true} // Make the modal transparent
      animationType="slide" // Animation type for opening the modal
      visible={visible}  // Control the visibility of the modal
      onRequestClose={onClose}  // Callback to execute when the modal requests to close
    >
      <View style={styles.modalOverlay}>  
        <View style={styles.modalContainer}>  
          <Text style={styles.modalTitle}>Your Owned Stickers</Text>
          
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>

          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              {ownedStickers.length > 0 ? (
                ownedStickers.map(sticker => (
                  <View key={sticker.id} style={styles.stickerContainer}>
                    <Image source={{ uri: sticker.image_url }} style={styles.stickerImage} />
                    <Text style={styles.stickerName}>{sticker.name}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noStickersText}>You have no owned stickers.</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
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
    fontSize: 16,
  },
  scrollContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  stickerContainer: {
    width: 100,
    alignItems: 'center',
    margin: 10,
  },
  stickerImage: {
    width: 80,
    height: 80,
    marginBottom: 5,
  },
  stickerName: {
    fontSize: 12,
    textAlign: 'center',
  },
  noStickersText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
  },
});

export default OwnedStickersModal;
