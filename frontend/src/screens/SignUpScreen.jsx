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
import { decode } from "base64-arraybuffer";
import { signupSchema } from "../utils/validation"; // Move validation schema to a separate utils file

export default function SignupScreen({ navigation }) {
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password1: "",
    password2: "",
    location: "",
  });

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [base64Photo, setBase64Photo] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

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
      base64: true,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
      setBase64Photo(result.assets[0].base64);
    }
  }

  async function onSignUp() {
    setErrors({});

    // Validate the form using the Zod schema
    const validationResult = signupSchema.safeParse(formData);

    if (!validationResult.success) {
      const formattedErrors = {};
      validationResult.error.errors.forEach((error) => {
        formattedErrors[error.path[0]] = error.message;
      });
      setErrors(formattedErrors);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password1,
        options: {
          data: {
            username: formData.username,
            first_name: formData.firstname,
            last_name: formData.lastname,
            location: formData.location,
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

      if (base64Photo) {
        try {
          const photoPath = `${user.id}/${uuid.v4()}.png`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("avatars")
              .upload(photoPath, decode(base64Photo), {
                contentType: "image/png",
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

          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              avatar_url: avatarUrl,
            },
          });

          if (updateError) {
            Alert.alert(
              "Error",
              "Failed to update user profile with avatar URL"
            );
            return;
          }
        } catch (photoUploadError) {
          Alert.alert("Error", "An error occurred while uploading the photo.");
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
              value={formData.username}
              error={errors.username}
              setValue={(value) => handleInputChange("username", value)}
            />
            <Input
              title="First Name"
              value={formData.firstname}
              error={errors.firstname}
              setValue={(value) => handleInputChange("firstname", value)}
            />
            <Input
              title="Last Name"
              value={formData.lastname}
              error={errors.lastname}
              setValue={(value) => handleInputChange("lastname", value)}
            />
            <Input
              title="Email"
              value={formData.email}
              error={errors.email}
              setValue={(value) => handleInputChange("email", value)}
            />
            <Input
              title="Password"
              value={formData.password1}
              error={errors.password1}
              setValue={(value) => handleInputChange("password1", value)}
              secureTextEntry
            />
            <Input
              title="Confirm Password"
              value={formData.password2}
              error={errors.password2}
              setValue={(value) => handleInputChange("password2", value)}
              secureTextEntry
            />
            <Input
              title="Location"
              value={formData.location}
              error={errors.location}
              setValue={(value) => handleInputChange("location", value)}
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
