import React, { useState, useEffect, useCallback } from "react";

import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Pressable,
  Modal,
  Image,
  Switch,
  ScrollView,
  PanResponder,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@rneui/themed";
import * as Font from "expo-font";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "react-native-gradient-texts";
import OwnedBannersModal from "../components/OwnedBannersModal";
import useStore from "../store/store";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import * as ImagePicker from "expo-image-picker";
import uuid from "react-native-uuid";
import { decode } from "base64-arraybuffer";

const ProfileSettings = ({ navigation, route }) => {

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null);
  const { contactInfo } = route.params; // Access contactInfo correctly
  const [visible, setVisible] = useState(false);
  const [settingVisible, setSettingVisible] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [ownedBannersVisible, setOwnedBannersVisible] = useState(false);
  const { user } = useStore();
  const [activeBannerData, setActiveBannerData] = useState(null);


  // State for form fields
  const [username, setUsername] = useState(contactInfo.contactUsername || "");
  const [email, setEmail] = useState(contactInfo.contactEmail || ""); // Make sure contactInfo has email property
  const [password, setPassword] = useState(""); // Leave this blank for user to enter
  const [firstName, setFirstName] = useState(contactInfo.contactFirst || "");
  const [lastName, setLastName] = useState(contactInfo.contactLast || "");

  const handleInputChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "Inter_18pt-Regular": require("./fonts/Inter_18pt-Regular.ttf"),
        "Inter_18pt-Medium": require("./fonts/Inter_18pt-Medium.ttf"),
        "Inter_18pt-MediumItalic": require("./fonts/Inter_18pt-MediumItalic.ttf"),
        "Poppins-Regular": require("./fonts/Poppins-Regular.ttf"),
        "Poppins-Medium": require("./fonts/Poppins-Medium.ttf"),
        "Karla-Regular": require("./fonts/Karla-Regular.ttf"),
        "Karla-Medium": require("./fonts/Karla-Medium.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();
  }, []);


  const updateInfo = async () => {
    console.log('>>>>>>>>>>', email);
    try {
      let avatarUrl = null; // Declare avatarUrl here

      const updateUser = {
        email,
        password,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          username,
        },
      };

      if (base64Photo) {
        const photoPath = `${user.id}/${uuid.v4()}.png`;
        console.log("Uploading image to path:", photoPath);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(photoPath, decode(base64Photo), {
            contentType: "image/png",
          });

        console.log("Image Upload Data:", uploadData);
        console.log("Image Upload Error:", uploadError);

        if (uploadError) {
          Alert.alert("Error", "Failed to upload profile photo: " + uploadError.message);
          return;
        }

        avatarUrl = supabase.storage.from("avatars").getPublicUrl(photoPath).data.publicUrl;
        console.log("Avatar URL:", avatarUrl);
      }

      // Update the profiles table with the avatar URL if it's set
      const { error: updateProfileError } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (updateProfileError) {
        Alert.alert("Error", "Failed to update avatar URL in profiles table: " + updateProfileError.message);
        return;
      }

      if (avatarUrl) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });

        if (updateError) {
          Alert.alert("Error", "Failed to update user session: " + updateError.message);
          return;
        }
      }

      const { account, error } = await supabase.auth.updateUser({
        data: {
          username: username,
          first_name: firstName,
          last_name: lastName
        }
      });

      contactInfo.contactUsername = username;
      contactInfo.contactLast = lastName;
      contactInfo.contactFirst = firstName;

      if (error) {
        throw error;
      }

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const removeImage = async () => {
    try {
      // Remove image from local state
      setProfilePhoto(null);
      setBase64Photo(null);

      // Remove image from Supabase storage
      if (contactInfo.contactPFP) {
        const photoPath = contactInfo.contactPFP.split('/').pop(); // Get the file path from URL
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove([photoPath]);

        if (deleteError) {
          throw deleteError;
        }

        // Update profile to remove avatar_url
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_url: null })
          .eq("id", user.id);

        if (updateError) {
          throw updateError;
        }

        // Also update user metadata if necessary
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: { avatar_url: null },
        });

        if (updateUserError) {
          throw updateUserError;
        }

        // Reset the contact info
        contactInfo.contactPFP = null;

        alert("Profile image removed successfully!");
      }
    } catch (error) {
      console.error("Error removing image:", error);
      alert("Failed to remove profile image. Please try again.");
    }
  };

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });
    console.log(result)
    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
      setBase64Photo(result.assets[0].base64);
    }
  }, []);

  // Function to fetch the active banner
  const fetchActiveBanner = async () => {
    if (!user) return;
  
    const { data, error } = await supabase
      .from("active_banner")
      .select("banner_id")
      .eq("user_id", user.id)
      .single();
  
    if (error) {
      if (error.code === "PGRST116") { // No rows returned for single query
        setActiveBannerData(null); // Set active banner data to null if no active banner
      } else {
        console.error("Error fetching active banner:", error.message);
      }
      return;
    }
  
    if (data) {
      const { data: bannerData, error: bannerError } = await supabase
        .from("banners")
        .select("image_url")
        .eq("id", data.banner_id)
        .single();
  
      if (bannerError) {
        console.error("Error fetching banner details:", bannerError.message);
        setActiveBannerData(null); // Fallback to null if there's an error with banner details
      } else {
        setActiveBannerData(bannerData); 
      }
    } else {
      setActiveBannerData(null); // Explicitly set to null if no data returned
    }
  };
  

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveBanner();
    }, [user, fetchActiveBanner]) // Re-run when user changes
  );

  useEffect(() => {
    fetchActiveBanner(); // Fetch the active banner when the component mounts
  }, [user]); // Dependency on user to refetch when user state changes

  // Use useFocusEffect to refetch active banner on screen focus



  const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to vertical movements
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Close modal if swipe down is detected (gesture.dy > 50)
      if (gestureState.dy > 50) {
        setModalVisible(false); // Close modal on swipe down
      }
    },
  });

  if (!fontsLoaded) {
    return null; // You can return a loading spinner or similar
  }


  return (
    <SafeAreaView
      style={[styles.container, { marginTop: Constants.statusBarHeight }]}
    >
      <ScrollView style={styles.scroll}>
        <Pressable style={styles.trash}>
          <Icon
            name="trash"
            size={35}
            color="red"
            onPress={() => setVisible(true)}
          ></Icon>
        </Pressable>
        <View style={styles.profileContainer}>
          <Pressable style={styles.pic} onPress={() => setModalVisible(true)}>
            {activeBannerData && (
              <Image

                source={{ uri: activeBannerData.image_url }}
                style={styles.bannerImage} // New style for the banner image
              />
            )}
            <Image
              source={{ uri: contactInfo.contactPFP }}
              style={styles.placeholderImage}
              onPress={() => setOwnedBannersVisible(true)}
            ></Image>
          </Pressable>
          {/* <Icon
                        name="camera"
                        size={25}
                        color='grey'
                        onPress={() => setVisible(true)}
                        style={styles.camera}
                    ></Icon> */}
          <Text style={styles.name}>
            {contactInfo.contactFirst} {contactInfo.contactLast}
          </Text>
          <Text style={styles.user}>@{contactInfo.contactUsername}</Text>
          <View style={styles.actbox}>
            <Text style={styles.act}>Show Activity Status</Text>
            <Switch
              trackColor={{ false: "#ccc", true: "#4caf50" }}
              thumbColor={isEnabled ? "#fff" : "#fff"}
              onValueChange={toggleSwitch}
              value={isEnabled}
              marginHorizontal={10}
            />
          </View>
        </View>
        <Modal
          visible={settingVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <Pressable style={styles.modalContent}>
              <View style={styles.right}>
                <Text
                  style={styles.rText}
                  onPress={() => {
                    setOwnedBannersVisible(true);
                    setVisible(false);
                  }}
                >
                  Cancel
                </Text>
              </View>
            </Pressable>
          </View>
        </Modal>

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.pfpModalContainer} {...panResponder.panHandlers}>
            <View style={styles.pfpContent}>
              <View style={styles.modText}>
                <Text style={styles.pfText}>Profile Picture</Text>
              </View>
              <Pressable style={styles.pfpButtons}>
                <View style={styles.upload}>
                  <Text style={styles.uploadText} onPress={pickImage}>Upload Image</Text>
                </View>
                <View style={styles.banButton}>
                  <TouchableOpacity
                    style={styles.banButton}
                    onPress={() => {
                      setModalVisible(false); // Close the current modal
                      setOwnedBannersVisible(true); // Open the OwnedBannersModal
                    }}
                  >
                    <Text style={styles.banText}>Change Banner</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.right}>
                  <Text style={styles.removeText} onPress={removeImage}>Remove Image</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Modal visible={visible} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalText}>
                <Text style={styles.mText}>Delete Account?</Text>
              </View>
              <Pressable style={styles.modalButtons}>
                <Pressable style={styles.left}>
                  <Text
                    style={styles.lText}

                  >
                    Delete
                  </Text>
                </Pressable>
                <View style={styles.right}>
                  <Text style={styles.rText} onPress={() => setVisible(false)}>
                    Cancel
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Modal>

        <View style={styles.fields}>
          {[
            { label: "Username", value: username, setValue: setUsername },
            { label: "Email", value: email, setValue: setEmail, editable: false, disabled: true },
            {
              label: "Password",
              value: password,
              setValue: setPassword,
              secureTextEntry: true,
            },
            { label: "First Name", value: firstName, setValue: setFirstName },
            { label: "Last Name", value: lastName, setValue: setLastName },
            // Add more fields as needed
          ].map((field, index) => (
            <View key={index} style={styles.verticallySpaced}>
              <Input
                label={field.label}
                value={field.value}
                onChangeText={field.setValue}
                labelStyle={{
                  position: "absolute",
                  top: -25,
                  left: 25,
                  color: "#616061",
                }}
                leftIcon={{
                  type: "font-awesome",
                  name:
                    field.label === "Password"
                      ? "lock"
                      : field.label === "Email"
                        ? "envelope"
                        : "user",
                  color: "#616061",
                  size: 20,
                }}
                autoCapitalize="none"
                secureTextEntry={field.secureTextEntry} // Use for password field
                editable={field.editable}
                disabled={field.disabled}
                inputContainerStyle={{
                  borderRadius: 30,
                  borderTopWidth: 2.5,
                  borderBottomWidth: 2.5,
                  borderLeftWidth: 2.5,
                  borderRightWidth: 2.5,
                  borderColor: "#A7A7A7",
                  width: 270,
                  paddingLeft: 15,
                  height: 40,
                }}
              />
            </View>
          ))}
        </View>
        <View style={styles.buttonbox}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
            style={styles.gradient}
          >
            <TouchableOpacity style={styles.button2} borderRadius={20} onPress={updateInfo}>
              <Text style={[styles.buttontext]}>Update</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* <Modal
                        visible={settingVisible}
                        animationType="slide"
                        transparent={true}
                    >
                        <View style={styles.modalContainer}>
                            <Pressable style={styles.modalContent}>
                                <View style={styles.right}>
                                    <Text
                                        style={styles.rText}
                                        onPress={() => setSettingVisible(false)}
                                    >
                                        Cancel
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </Modal> */}
        </View>

        <View style={styles.box}>
          <GradientText
            text={"SyncZone"}
            fontSize={40}
            isGradientFill
            isGradientStroke
            gradientColors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
            fontFamily={"Karla-Bold"}
          />
        </View>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            navigation.navigate("MainTabs");
          }}
        >
          <Ionicons
            name="arrow-back"
            size={35}
            color="grey"
            style={styles.backButtonText}
          />
        </TouchableOpacity>

        {/* Owned Banners Modal */}
        <OwnedBannersModal
          visible={ownedBannersVisible}
          onClose={() => setOwnedBannersVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileSettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    marginVertical: 10,
    zIndex: 20,
  },
  backButton: {
    position: "absolute",
    top: 5,
    left: 20,
    padding: 10,
    color: "grey",
    //backgroundColor: '#007bff', // Blue color for the button
    //borderRadius: 5,
  },
  backButtonText: {
    fontSize: 30,
  },
  trash: {
    position: "absolute",
    top: 5,
    right: 25,
    //borderWidth: 1,
    zIndex: 1,
  },
  camera: {
    position: "absolute",
    left: 1,
    size: 5,
    //borderWidth: 1,
    zIndex: 1,
  },
  actbox: {
    flex: 1,
    flexDirection: "row",
    //borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: {
    //borderWidth: 1
  },
  pic: {
    flex: 1,
    // borderWidth: 1,
    borderRadius: 300,
  },
  user: {
    fontFamily: "Inter_18pt-MediumItalic",
    color: "grey",
    textAlignVertical: "top",
  },
  name: {
    fontFamily: "Inter_18pt-Medium",
    fontSize: 20,
    padding: 5,
  },
  act: {
    fontFamily: "Inter_18pt-Medium",
  },
  profileContainer: {
    flex: 1,
    //flexWrap: 'wrap',
    justifyContent: "center",
    alignItems: "center",
    //marginTop: '10%',
    //borderWidth: 4,
    width: "100%",
    margin: 0, // Remove any margin that may prevent stretching
    padding: 5, // Remove padding if it exists
    //aspectRatio: 1
  },
  bannerImage: {
    position: 'absolute',
    width: 180, // Slightly wider than the profile picture
    height: 180, // Fixed height to fit the banner
    top: 0, // Adjust this value to position the banner above the profile picture
    left: -5, // Center the banner horizontally (adjust as necessary)
    zIndex: 1, // Ensure the banner is infront the profile picture
    borderRadius: 20, // Adjust to create a smoother edge
    justifyContent: "center",
    alignItems: "center",

  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 155,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    margin: 10,
    backgroundColor: 'grey'
  },
  fields: {
    flexGrow: 1,
    //borderWidth: 1,
    marginTop: 5,
    //padding: 20,
    //height: 1000,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
  },
  verticallySpaced: {
    flex: 1,
    flexWrap: "wrap",
    // padding: 1,
    // margin: 1,
    position: "relative",
    //borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "40%",
    marginVertical: 8,
  },

  button: {
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    //borderRadius: 5,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  modalContent: {
    flex: 0.12,
    justifyContent: "center",
    alignItems: "center",
    width: 190,
    //padding: 20,
    //paddingBottom: 20,
    backgroundColor: "white",
    borderRadius: 25,
    alignItems: "center",
    //borderWidth: 1,
    borderColor: "grey",
  },
  modalText: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "grey",
    borderBottomWidth: 1,
    borderColor: "grey",
    width: "100%",
  },
  mText: {
    fontFamily: "Poppins-Medium",
  },
  modalButtons: {
    flex: 1,
    flexDirection: "row",
  },
  left: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "grey",
    borderRightWidth: 1,
    padding: 10,
  },
  right: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lText: {
    color: "red",
    //fontWeight: 'bold',
    fontFamily: "Poppins-Medium",
  },
  rText: {
    color: "blue",
    //fontWeight: 'bold',
    fontFamily: "Poppins-Medium",
  },

  buttonbox: {
    flex: 0,
    padding: 0,
    //justifyContent: "center",
    alignItems: "center",

    //margin: 5,
    //borderWidth: 3,
  },
  gradient: {
    overflow: "hidden",
    //backgroundColor: 'transparent',
    borderRadius: 30,
    elevation: 5,
  },
  button2: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 50,
    width: 250,
  },
  buttontext: {
    fontWeight: "bold",
    fontSize: 21,
    color: "#fffbf5",
    //padding: 100,
  },
  box: {
    //minWidth: 10,
    marginTop: 0,
    padding: 0,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  pfpButtons: {
    flex: 2.5,
    //borderWidth: 1,
    borderColor: "red",
    width: "90%",
    borderRadius: 25,
    margin: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    //flexDirection: "row",
  },
  pfpModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  pfpContent: {
    flex: 0.4,
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    //margin: 10,
    //padding: 20,
    //paddingBottom: 20,
    backgroundColor: "rgba(242, 244, 255, 0.90)",
    //borderRadius: 25,
    borderTopRightRadius: 25,
    borderTopLeftRadius: 25,
    alignItems: "center",
    //borderWidth: 1,
    borderColor: "blue",
  },
  modText: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    borderBottomColor: "grey",
    //borderBottomWidth: 1,
    borderColor: "grey",
    width: "100%",
  },
  banButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#F2F4FF",
    borderBottomWidth: 3,
    padding: 10,
  },
  upload: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 3,
    borderColor: "#F2F4FF",
  },
  uploadText: {
    //fontWeight: 'bold',
    fontFamily: "Karla-Medium",
    fontSize: 17,
    color: "#555A70",
  },
  banText: {
    fontFamily: "Karla-Medium",
    fontSize: 17,
    color: "#555A70",
  },
  removeText: {
    fontFamily: "Karla-Medium",
    fontSize: 17,
    color: "#B96C6C",
  },
  pfText: {
    fontFamily: "Karla-Medium",
    fontSize: 22,
    color: "#555A70",
  },
  pfpClose: {
    position: "absolute",
    left: 30,
  },
});