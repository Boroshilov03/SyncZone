import {
  View,
  Text,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Alert,
  ScrollView,
  StyleSheet,
} from "react-native";
import React, { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import uuid from "react-native-uuid";
import useStore from "../store/store";
import { decode } from 'base64-arraybuffer'; // Import base64-arraybuffer decode method

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [location, setLocation] = useState(""); // New state for location
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null); // Add state for base64 string

  const [usernameError, setUsernameError] = useState("");
  const [firstnameError, setFirstnameError] = useState("");
  const [lastnameError, setLastnameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password1Error, setPassword1Error] = useState("");
  const [password2Error, setPassword2Error] = useState("");
  const [locationError, setLocationError] = useState(""); // Error state for location

  async function pickImage() {
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
      base64: true, // Enable base64 output
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri); // Display image
      setBase64Photo(result.assets[0].base64); // Store base64 string
    }
  }

  async function onSignUp() {
    // Reset errors
    setUsernameError("");
    setFirstnameError("");
    setLastnameError("");
    setEmailError("");
    setPassword1Error("");
    setPassword2Error("");
    setLocationError("");

    // Validation logic
    const failUsername = !username || username.length < 5;
    if (failUsername) {
      setUsernameError("Username must be at least 5 characters long");
    }

    const failFirstName = !firstname;
    if (failFirstName) {
      setFirstnameError("First Name not provided");
    }

    const failLastName = !lastname;
    if (failLastName) {
      setLastnameError("Last Name not provided");
    }

    const failEmail = !email;
    if (failEmail) {
      setEmailError("Email not provided");
    }

    const failPassword1 = !password1 || password1.length < 8;
    if (failPassword1) {
      setPassword1Error("Password must be at least 8 characters long");
    }

    const failPassword2 = password1 !== password2;
    if (failPassword2) {
      setPassword2Error("Passwords do not match");
    }

    const failLocation = !location.trim();
    if (failLocation) {
      setLocationError("Location not provided");
    }

    if (
      failUsername ||
      failFirstName ||
      failLastName ||
      failEmail ||
      failPassword1 ||
      failPassword2 ||
      failLocation
    ) {
      return;
    }

    try {
      // Use Supabase's signUp method
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password1,
        options: {
          data: {
            username,
            first_name: firstname,
            last_name: lastname,
            location,
          },
        },
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      if (error) {
        console.error("Error signing up:", error);
        Alert.alert("Error", error.message);
      }
      
      const user = data.user;
      let avatarUrl = null;

      // Upload the profile photo if it exists
      if (base64Photo) {
        try {
          const photoPath = `${user.id}/${uuid.v4()}.png`; // Ensure correct path with file extension
          
          // Decode base64 to ArrayBuffer and upload
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(photoPath, decode(base64Photo), {
              contentType: 'image/png',
            });

          if (uploadError) {
            Alert.alert(
              "Error",
              "Failed to upload profile photo: " + uploadError.message
            );
            return;
          }

          avatarUrl = supabase.storage.from("avatars").getPublicUrl(photoPath)
            .data.publicUrl;

          // Update the user profile with the avatar URL
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              avatar_url: avatarUrl, // Add avatar URL to the user profile
            },
          });

          if (updateError) {
            Alert.alert(
              "Error",
              "Failed to update user profile with avatar URL"
            );
            console.error("Update error:", updateError.message);
            return;
          }
        } catch (photoUploadError) {
          Alert.alert("Error", "An error occurred while uploading the photo.");
          console.error("Photo upload error:", photoUploadError);
        }
      }

      Alert.alert("Success", "User registered successfully!");
      const { session } = data;
      const { setAuthenticated, setUser, setAccessToken, setRefreshToken } =
        useStore();
      setAuthenticated(true);
      setUser(user);
      setAccessToken(session.access_token);
      setRefreshToken(session.refresh_token);
      navigation.navigate("MainTabs");
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
      console.error("Signup error:", error.message);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollView}>
            <TouchableWithoutFeedback onPress={pickImage}>
              <View style={styles.imageContainer}>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.imagePlaceholderText}>
                      Upload Photo
                    </Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
            <Input
              title="Username"
              value={username}
              error={usernameError}
              setValue={setUsername}
              setError={setUsernameError}
            />
            <Input
              title="First Name"
              value={firstname}
              error={firstnameError}
              setValue={setFirstname}
              setError={setFirstnameError}
            />
            <Input
              title="Last Name"
              value={lastname}
              error={lastnameError}
              setValue={setLastname}
              setError={setLastnameError}
            />
            <Input
              title="Email"
              value={email}
              error={emailError}
              setValue={setEmail}
              setError={setEmailError}
            />
            <Input
              title="Password"
              value={password1}
              error={password1Error}
              setValue={setPassword1}
              setError={setPassword1Error}
              secureTextEntry
            />
            <Input
              title="Confirm Password"
              value={password2}
              error={password2Error}
              setValue={setPassword2}
              setError={setPassword2Error}
              secureTextEntry
            />
            <Input
              title="Location"
              value={location}
              error={locationError}
              setValue={setLocation}
              setError={setLocationError}
            />
            <Button title="Sign Up" onPress={onSignUp} />
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text
                style={styles.signInLink}
                onPress={() => navigation.navigate("SignIn")}
              >
                Sign In
              </Text>
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#999",
    fontSize: 12,
  },
  signInText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#666",
  },
  signInLink: {
    color: "#007bff",
  },
});
