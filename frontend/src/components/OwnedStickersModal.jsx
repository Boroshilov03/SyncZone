import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from "react-native";
import { supabase } from "../lib/supabase"; // Import Supabase client
import useStore from "../store/store"; // Importing the store

const OwnedStickersModal = ({ visible, onClose, chatID, setMessages }) => {
  const { user } = useStore(); // Get the current user
  const [ownedStickers, setOwnedStickers] = useState([]); // State to store the user's owned stickers
  const [loading, setLoading] = useState(true); // State to manage loading status
  const slideAnim = useState(new Animated.Value(500))[0]; // Modal's vertical position, starts off-screen (500)
  const [panResponder, setPanResponder] = useState(null); // PanResponder for drag gestures

  useEffect(() => {
    const fetchOwnedStickers = async () => {
      if (!user) return;

      const { data: userStickers, error } = await supabase
        .from("user_stickers")
        .select("sticker_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching user_stickers:", error.message);
        Alert.alert("Error", "Failed to fetch owned stickers.");
        setLoading(false);
        return;
      }

      if (userStickers.length > 0) {
        const stickerIds = userStickers.map((sticker) => sticker.sticker_id);
        const { data: stickers, error: stickersError } = await supabase
          .from("stickers")
          .select("*")
          .in("id", stickerIds);

        if (stickersError) {
          console.error("Error fetching stickers:", stickersError.message);
          Alert.alert("Error", "Failed to fetch stickers.");
        } else {
          setOwnedStickers(stickers);
        }
      }

      setLoading(false);
    };

    fetchOwnedStickers();
  }, [user]);

  useEffect(() => {
    if (visible) {
      setPanResponder(
        PanResponder.create({
          onStartShouldSetPanResponder: (e, gestureState) => {
            const touchLocation = e.nativeEvent.locationY;
            return touchLocation < 100; // Only trigger drag if touch is in the top 100px area
          },
          onMoveShouldSetPanResponder: (e, gestureState) => true,
          onPanResponderMove: (e, gestureState) => {
            if (gestureState.dy > 0) {
              Animated.event([null, { dy: slideAnim }], {
                useNativeDriver: false,
              })(e, gestureState);
            }
          },
          onPanResponderRelease: (e, gestureState) => {
            if (gestureState.dy > 150) {
              handleClose(); // Close the modal if dragged down far enough
            } else {
              Animated.spring(slideAnim, {
                toValue: 0, // Reset to the bottom of the screen
                useNativeDriver: true,
              }).start();
            }
          },
        })
      );
    }

    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0, // Slide in from the bottom
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 500, // Slide off-screen (down)
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleStickerPress = async (stickerId, chatID, setMessages) => {
    console.log("Sticker ID:", stickerId, chatID, user.id);

    try {
      // Step 1: Create a new message
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            chat_id: chatID,
            sender_id: user.id,
            content: "", // Empty content for sticker-only message
          },
        ])
        .select();

      if (messageError) {
        console.error("Error creating message:", messageError);
        return;
      }

      const messageId = messageData[0].id; // Get the newly created message ID

      // Step 2: Add the sticker as an attachment linked to the new message
      const { data: attachmentData, error: attachmentError } = await supabase
        .from("attachments")
        .insert([
          {
            message_id: messageId,
            sticker_id: stickerId,
            image_url: "",
          },
        ]);

      if (attachmentError) {
        console.error("Error attaching sticker:", attachmentError);
      } else {
        console.log("Sticker attached successfully:", attachmentData);
      }
      // Step 2: Fetch the sticker details to include in the message
      const { data: stickerData, error: stickerError } = await supabase
        .from("stickers")
        .select("*")
        .eq("id", stickerId)
        .single(); // Fetch one sticker

      if (stickerError) {
        console.error("Error fetching sticker details:", stickerError);
        return;
      }
      // Step 3: Attach the sticker to the message state
      const newMessage = {
        id: messageId,
        chat_id: chatID,
        sender_id: user.id,
        content: "",
        attachments: [
          {
            sticker_id: stickerId,
            image_url: stickerData.image_url, // Use actual sticker data here
          },
        ],
      };

      setMessages((prevMessages) => [newMessage, ...prevMessages]);

      console.log("Sticker sent and appended to chat:", newMessage);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  const handleClose = () => {
    Animated.spring(slideAnim, {
      toValue: 500, // Slide off-screen
      useNativeDriver: true,
    }).start();

    setTimeout(onClose, 300); // Close after animation completes
  };

  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
          {...(panResponder ? panResponder.panHandlers : {})} // Attach pan responder
        >
          {/* Handle for sliding */}
          <View style={styles.slideHandle}></View>

          <Text style={styles.modalTitle}>Your Owned Stickers</Text>

          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.stickerGrid}>
              {ownedStickers.length > 0 ? (
                ownedStickers.map((sticker) => (
                  <TouchableOpacity
                    key={sticker.id}
                    onPress={() =>
                      handleStickerPress(sticker.id, chatID, setMessages)
                    }
                    style={styles.stickerContainer}
                  >
                    <Image
                      source={{ uri: sticker.image_url }}
                      style={styles.stickerImage}
                    />
                    <Text style={styles.stickerName}>{sticker.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noStickersText}>
                  You have no owned stickers.
                </Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darkened background
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    backgroundColor: "#2f3136", // Dark background, Discord-like
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 20,
    maxHeight: "70%",
  },
  slideHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#40444b", // Subtle color for handle
    borderRadius: 5,
    alignSelf: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  stickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  stickerContainer: {
    width: 100,
    alignItems: "center",
    marginBottom: 15,
  },
  stickerImage: {
    width: 90,
    height: 90,
    marginBottom: 5,
    borderRadius: 10,
  },
  stickerName: {
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
  },
  noStickersText: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
  },
});

export default OwnedStickersModal;
