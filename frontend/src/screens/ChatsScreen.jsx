import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  ScrollView,
  Modal,
  Pressable,
  PanResponder,
  Button,
} from "react-native";
import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";
import useStore from "../store/store";
import FeatherIcon from "react-native-vector-icons/Feather";
import Header from "../components/Header";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Profile from "./ProfileScreen";
import FavoriteUsers from "../components/favoriteUsers";
import { Dimensions } from "react-native";

const { height: screenHeight } = Dimensions.get("window"); // Get screen height


const ChatsScreen = ({ navigation }) => {
  const [input, setInput] = useState("");
  const [profileVisible, setProfileVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  // const [selectedContact, setSelectedContact] = useState(null);
  const [lastMessage, setLastMessage] = useState("")
  const { user } = useStore();
  const queryClient = useQueryClient();
  const [pressedCardId, setPressedCardId] = useState(null); // Track which card is pressed
  const [selectedContact, setSelectedContact] = useState({});

  // Reset the pressed card state when navigating to a new screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setPressedCardId(null); // Reset when coming back to the screen
    });
    return unsubscribe; // Cleanup listener when component unmounts or screen changes
  }, [navigation]);


  const {
    data: chats = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["recentChats", user.id],
    queryFn: fetchChats,
    enabled: !!user.id,
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Optional: Automatically refetch every 10 seconds for more real-time updates
  });

  async function fetchChats() {
    const { data: chatParticipants, error: chatError } = await supabase
      .from("chat_participants")
      .select("chat_id")
      .eq("user_id", user.id);

    if (chatError) {
      throw new Error("Error fetching chat participants: " + chatError.message);
    }

    const chatIds = chatParticipants.map((chat) => chat.chat_id);

    const { data, error } = await supabase
      .from("chats")
      .select(
        `id, group_title, created_at, group_photo, is_group,
        chat_participants!inner (
          user_id,
          profiles (
            id,
            username,
            first_name,
            last_name,
            avatar_url
          )
        ),
        messages (
          content, created_at, is_read, sender_id, id
        )`
      )
      .in("id", chatIds)
      .limit(20);

    if (error) {
      throw new Error("Error fetching chats: " + error.message);
    }

    // Fetch active banners for other participants
    for (const chat of data) {
      const participants = chat.chat_participants;
      const otherParticipants = participants.filter(
        (participant) => participant.user_id !== user.id
      );

      for (const participant of otherParticipants) {
        const { data: activeBanner, error: bannerError } = await supabase
          .from("active_banner")
          .select("banner_id")
          .eq("user_id", participant.user_id)
          .single();

        if (bannerError) {
          participant.activeBanner = null;
        } else if (activeBanner) {
          const { data: bannerDetails, error: bannerDetailsError } =
            await supabase
              .from("banners")
              .select("image_url")
              .eq("id", activeBanner.banner_id)
              .single();

          if (bannerDetailsError) {
            participant.activeBanner = null;
          } else {
            participant.activeBanner = bannerDetails.image_url;
          }
        } else {
          participant.activeBanner = null;
        }
      }
    }

    return data
      .map((chat) => {
        const messages = chat.messages || [];

        // Sort messages by creation date and pick the most recent one
        const lastMessage =
          messages.length > 0
            ? messages.sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0]
            : null;

        const unreadMessagesCount = messages.filter(
          (message) => !message.is_read && message.sender_id !== user.id
        ).length;

        const lastMessageContent =
          lastMessage?.content?.trim() === "" ? "Attachment sent" : lastMessage?.content || "No messages yet";

        return {
          ...chat,
          lastMessageContent,
          lastMessageSender: lastMessage?.sender_id,
          lastMessageTime: lastMessage?.created_at,
          unreadMessagesCount,
        };
      })
      .reverse(); // Reverse the chats list
  }


  // Function to mark all messages as read in a chat
  async function markMessagesAsRead(chatId) {
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .match({ chat_id: chatId })
      .neq("sender_id", user.id);

    if (error) {
      console.error("Error marking messages as read:", error.message);
    }

    // Refetch recent chats to update unread count
    queryClient.invalidateQueries(["recentChats", user.id]);
  }

  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          console.log("New change in chats table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_participants" },
        (payload) => {
          console.log("New change in chat_participants table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          console.log("New message:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]); // Refetch when a new message is sent
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user.id, queryClient]);

  useEffect(() => {
    if (!user.id) return;

    const channel = supabase
      .channel("chats-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          console.log("New change in chats table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_participants" },
        (payload) => {
          console.log("New change in chat_participants table:", payload);
          queryClient.invalidateQueries(["recentChats", user.id]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user.id, queryClient]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const participants = chat.chat_participants;
      return (
        chat.is_group ||
        (participants.length > 1 &&
          participants.some((participant) => {
            return (
              participant.profiles &&
              participant.profiles.username &&
              participant.user_id !== user.id &&
              participant.profiles.username
                .toLowerCase()
                .includes(input.toLowerCase())
            );
          }))
      );
    });
  }, [input, chats, user.id]);

  const renderChatItem = ({ item, index }) => {
    const participants = item.chat_participants;
    const otherParticipants = participants.filter(
      (participant) => participant.user_id !== user.id
    );

    const isGroupChat = item.is_group;
    const isLastItem = index === filteredChats.length - 1;

    let displayName = isGroupChat
      ? item.group_title
      : `${otherParticipants[0]?.profiles?.first_name} ${otherParticipants[0]?.profiles?.last_name}`;
    let displayPhoto = isGroupChat
      ? item.group_photo
      : otherParticipants[0]?.profiles?.avatar_url;

    if (!displayName) return null;

    return (
      <TouchableOpacity
        onPress={() => {
          navigation.navigate("ChatDetail", {
            chatId: item.id,
            username: displayName,
            otherPFP: displayPhoto,
            groupTitle: item.group_title,
          });
          markMessagesAsRead(item.id); // Mark messages as read upon opening
          setPressedCardId(item.id); // Set the pressed card ID
        }}
        onPressIn={() => setPressedCardId(item.id)} // Set the pressed card ID when pressing
        onPressOut={() => setPressedCardId(null)} // Reset when press is released
        activeOpacity={1} // Prevent opacity changes
      >
        <View
          style={[
            styles.card,
            isLastItem && { marginBottom: 70 },
            {
              backgroundColor: pressedCardId === item.id ? "#e2f5f8" : "#D1EBEF", // Change color only for the pressed card
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              setProfileVisible(true);
              setSelectedContact({
                contactID: otherParticipants[0]?.profiles?.id,
                contactPFP: displayPhoto,
                contactUsername: displayName,
              });
            }}
          >
            <Modal
              animationType="fade"
              transparent={true}
              visible={profileVisible}
              onRequestClose={() => setProfileVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Pressable onPress={() => setProfileVisible(false)}>
                    <Ionicons
                      name="close"
                      size={35}
                      color="#616061"
                      style={styles.close}
                    />
                  </Pressable>
                  <Profile
                    {...selectedContact}
                    setProfileVisible={setProfileVisible}
                    navigation={navigation}
                  />
                </View>
              </View>
            </Modal>

            {/* Avatar with Active Banner */}
            <View style={styles.avatarContainer}>
              {displayPhoto ? (
                <Image
                  alt="Avatar"
                  resizeMode="cover"
                  source={{ uri: displayPhoto }}
                  style={styles.cardImg}
                />
              ) : (
                <View style={[styles.cardImg]}>
                  <Text style={styles.cardAvatarText}>
                    {displayName[0].toUpperCase()}
                  </Text>
                </View>
              )}
              {otherParticipants[0]?.activeBanner && (
                <Image
                  alt="Active Banner"
                  resizeMode="contain"
                  source={{ uri: otherParticipants[0]?.activeBanner }}
                  style={styles.activeBanner}
                />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{displayName}</Text>
              <Text style={styles.cardTimestamp}>
                {item.lastMessageTime
                  ? new Date(item.lastMessageTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : ""}
              </Text>
            </View>
            <View style={styles.cardHeader}>
              <View style={styles.messageContainer}>
                <Text style={styles.cardMessage}>
                  {item.lastMessageContent?.length > 15
                    ? `${item.lastMessageContent.slice(0, 15)}...`
                    : item.lastMessageContent || "No messages yet"}
                </Text>
                {item.unreadMessagesCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {item.unreadMessagesCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Header event="message" navigation={navigation} title="Chats" />
      <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={styles.search}>
            <View style={styles.searchIcon}>
              <FeatherIcon color="#848484" name="search" size={17} />
            </View>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              onChangeText={(val) => setInput(val)}
              placeholder="Search.."
              placeholderTextColor="#848484"
              returnKeyType="done"
              style={styles.searchControl}
              value={input}
            />
          </View>
        </View>

        <View style={styles.favoritesContainer}>
          <Text style={styles.favoritesTitle}>Favorites</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity onPress={() => navigation.navigate("Contact")}>
              <Image
                source={require("../../assets/icons/add_favorite.png")}
                style={styles.favoriteImg}
              />
            </TouchableOpacity>
            <FavoriteUsers navigation={navigation} />
          </ScrollView>
        </View>

        {filteredChats.length ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.searchContent}
          />
        ) : (
          <Text style={styles.searchEmpty}>No conversations</Text>
        )}
      </View>
    </View>
  );
};

export default ChatsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  avatarContainer: {
    position: "relative", // Ensures the avatar and banner are in the same space
    width: 40,
    height: 40,
  },

  activeBanner: {
    position: "absolute",
    bottom: -4, // Aligns the banner to the bottom edge of the avatar
    right: -4, // Aligns the banner to the right edge
    width: 50, // Banner width
    height: 50, // Banner height
    borderRadius: 8, // Makes the banner circular
  },

  favoritesContainer: {
    width: "100%", // Make the container take full width
    marginBottom: 10, // Add some space between favorites and chats
  },
  search: {
    position: "relative",
    backgroundColor: "rgb(240, 240, 240)",
    justifyContent: "center",
    marginHorizontal: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    height: screenHeight * 0.05, // Dynamically set height as 6% of screen height
  },
  favorites: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center", // Added for better alignment
    marginVertical: 12, // Added margin for spacing
  },
  favoritesTitle: {
    fontWeight: "500",
    fontSize: 24,
    marginBottom: 8,
    color: "#333333",
  },
  unreadBadge: {
    backgroundColor: "pink",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchIcon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  searchControl: {
    paddingLeft: 34, // Ensure space for the icon
    width: "100%",
    fontSize: 16, // Adjust this font size to make the text and placeholder visible
    fontWeight: "500",
    color: "#000", // Ensure text color is visible
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    height: "70%",
    padding: 40,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  favoriteImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 5,
  },
  favoritesContainer: {
    width: "100%", // Ensure this takes the full width
    marginBottom: 10,
    paddingLeft: 12,
  },
  wrapperRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wrapperCol: {
    flex: 1,
  },
  // You can also adjust the searchWrapper style if needed
  searchWrapper: {
    paddingTop: 8,
    paddingBottom: 16,
    borderColor: "#efefef",
    width: "100%", // Make searchWrapper take full width
  },
  searchContent: {
    width: "100%", // Ensure it matches the other components
  },
  searchEmpty: {
    textAlign: "center",
    color: "#9ca3af",
  },
  card: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 4,
    backgroundColor: "#D1EBEF",
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "95%",
    alignSelf: "center",
  },
  cardBody: {
    flex: 1,
    marginLeft: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between", // Add space between the title and timestamp
    alignItems: "center", // Align items vertically
  },
  messageContainer: {
    flex: 1, // Allow the message to take up the remaining space
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "semibold",
    flex: 1, // Allow the title to take up remaining space
  },
  cardMessage: {
    flex: 1, // Occupy the available space in the row
    fontWeight: "400",
    color: "gray",
  },
  cardTimestamp: {
    fontSize: 12,
    fontWeight: "300",
    marginLeft: 8, // Add some spacing between title and timestamp
  },
  cardImg: {
    width: 40,
    height: 40,
    marginRight: 8,
    backgroundColor: "#FFADAD", // soft coral to complement pastel blue
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF", // keeping the text white for readability
  },
  image: {
    width: 24,
    height: 24,
  },
});
