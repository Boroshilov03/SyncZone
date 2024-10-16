import React, { useState, useCallback } from "react";
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
  Pressable,
  StyleSheet,
} from "react-native";
import Input from "../components/Input";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import uuid from "react-native-uuid";
import useStore from "../store/store";
import { decode } from "base64-arraybuffer";
import { signupSchema } from "../utils/validation";
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "react-native-gradient-texts";
import Icon from 'react-native-vector-icons/FontAwesome';

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
  const [loading, setLoading] = useState(false);

  const handleInputChange = useCallback((name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Sorry, we need camera roll permissions to make this work!");
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
  }, []);

  const onSignUp = useCallback(async () => {
    setErrors({});
    setLoading(true);

    // Validate the form using the Zod schema
    const validationResult = signupSchema.safeParse(formData);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.errors.reduce((acc, error) => {
        acc[error.path[0]] = error.message;
        return acc;
      }, {});
      setErrors(formattedErrors);
      setLoading(false);
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

      const user = data.user;
      let avatarUrl = null;

      // Upload avatar photo if available
      if (base64Photo) {
        const photoPath = `${user.id}/${uuid.v4()}.png`;
        const { data: uploadData, error: uploadError } =
          await supabase.storage.from("avatars").upload(photoPath, decode(base64Photo), {
            contentType: "image/png",
          });

        if (uploadError) {
          Alert.alert("Error", "Failed to upload profile photo: " + uploadError.message);
          return;
        }

        avatarUrl = supabase.storage.from("avatars").getPublicUrl(photoPath).data.publicUrl;
      }

      // Update the profiles table with the avatar URL
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

      Alert.alert("Success", "User registered successfully!");
      const { session } = data;
      const { setAuthenticated, setUser, setAccessToken, setRefreshToken } = useStore();
      setAuthenticated(true);
      setUser(user);
      setAccessToken(session.access_token);
      setRefreshToken(session.refresh_token);
      navigation.navigate("MainTabs");
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [formData, base64Photo, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollView}>
            <View style={styles.titlebox} flexDirection={'row'}>
              <View style={styles.open}>
                <Text style={styles.title} fontFamily={"Karla-Medium"}>Create an <Text style={styles.color}>account</Text></Text>
              </View>
            </View>

            <TouchableWithoutFeedback >
              <View style={styles.imageContainer} >
                <View style={styles.cam}>
                  <Icon name="camera" size={35} color='#616061' onPress={pickImage}></Icon>
                </View>
                {profilePhoto ? (
                  <Image source={{ uri: profilePhoto }} style={styles.image} />
                ) : (
                  <Pressable style={styles.imagePlaceholder} >
                    <Text style={styles.imagePlaceholderText}>Upload Photo</Text>
                  </Pressable>
                )}
                <View style={styles.cancel}>
                  <Icon name="remove" size={35} color='#616061'></Icon>
                </View>
              </View>

            </TouchableWithoutFeedback>
            <View style={styles.inputbox}>
              {["username", "firstname", "lastname", "email", "password", "confirm Password", "location"].map((field) => (
                <Input
                  key={field}
                  title={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")}
                  value={formData[field]}
                  error={errors[field]}
                  setValue={(value) => handleInputChange(field, value)}
                  secureTextEntry={field.includes("password")}
                />
              ))}
            </View>
            <View style={styles.buttonbox}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                // style={styles.parent}
                colors={['#FFDDF7', '#C5ECFF', '#FFDDF7']}
                style={styles.gradient}
              >
                <Pressable
                  style={styles.button}
                  onPress={onSignUp} disabled={loading}
                  borderRadius={20}
                >
                  {/* <Text style={styles.buttontext} fontFamily={"Karla-Medium"}>Login</Text> */}
                  <Text
                    style={styles.buttontext}
                    fontFamily={"Karla-Medium"}
                  >
                    {loading ? "Signing Up..." : "Sign Up"}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
            <Text style={styles.signInText} >
              Already have an account? {" "}
              <Text style={styles.signInLink} onPress={() => navigation.navigate("SignIn")}>
                Login
              </Text>
            </Text>
            <View style={styles.box}>
              <GradientText
                text={"SyncZone"}
                fontSize={40}
                isGradientFill
                isGradientStroke
                gradientColors={['#FFDDF7', "#C5ECFF", '#FFDDF7']}
                fontFamily={"Karla-Medium"}
              //gradientColors={["#D49AC0", "#6FD2E2"]}
              // fontFamily={"Gill Sans"}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView >
    </SafeAreaView >
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
    flexDirection: 'row',
    justifyContent: "center",
    marginBottom: 16,
    padding: 5,
    //borderWidth: 3,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "green",
  },
  title: {
    fontSize: 34,
    color: '#616061',
    //borderWidth: 3,
  },

  titlebox: {
    flex: 1,
    //flexDirection: 'row',
    padding: 20,
    width: 'auto',

    //borderWidth: 3,
  },

  open: {
    flex: 1,
    //borderWidth: 3,
    //justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  cam: {
    flex: 0,
    padding: 40
  },
  cancel: {
    flex: 0,
    padding: 40
  },
  color: {
    color: '#d87af0'
  },
  inputbox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonbox: {
    flex: 0,
    padding: 15,
    paddingTop: 40,
    justifyContent: 'center',
    alignItems: 'center',

    //margin: 5,
    //borderWidth: 3,
  },
  gradient: {
    overflow: 'hidden',
    //backgroundColor: 'transparent',
    borderRadius: 30,
    elevation: 5,

  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 50,
    width: 190,


  },
  buttontext: {
    fontWeight: 'bold',
    fontSize: 21,
    color: '#fffbf5',
    //padding: 100,
  },
  signInText: {
    marginTop: 16,
    textAlign: "center",
    color: '#8e9091'
  },
  signInLink: {
    color: '#3F8CC5',
    fontWeight: "bold",
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: "#757575",
  },
  box: {
    //minWidth: 10,
    marginTop: 10,
    padding: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

