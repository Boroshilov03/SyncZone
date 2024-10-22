import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Image,
  SafeAreaView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { Input } from "@rneui/themed";
import GradientText from "react-native-gradient-texts";
import { LinearGradient } from "expo-linear-gradient";
import useStore from "../store/store"; // Assuming this handles user and tokens
import { loginSchema } from "../utils/validation"; // Import the login schema
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import SpinningLogo from "../components/SpinningLogo";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function SignInScreen({ navigation }) {
  const { setUser, setAccessToken, setRefreshToken } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // New error state

  // Define the mutation for signing in
  const { mutate: signInWithEmail, isLoading } = useMutation({
    mutationFn: async () => {
      // Validate email and password
      loginSchema.parse({ email, password }); // Throws an error if validation fails

      const { error, data } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw new Error(error.message);

      return data; // Return data for further processing
    },
    onSuccess: (data) => {
      const { session, user } = data;
      setUser(user); // Store user data
      setAccessToken(session.access_token); // Store access token
      setRefreshToken(session.refresh_token); // Store refresh token
      setErrorMessage(""); // Clear any previous error message on success
    },
    onError: (error) => {
      // If validation error, show validation message
      if (error.errors) {
        setErrorMessage(error.errors[0].message); // Display the first validation error
      } else {
        setErrorMessage(error.message); // Handle any other error
      }
    },
  });

  return (
    // <SafeAreaView
    //   style={styles.safeview}
    // >
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.parent}
      colors={["#FFDDF7", "#C5ECFF"]}
    >
      <View style={styles.space}>
        <SpinningLogo />
      </View>
      <View style={styles.container}>
        <View style={styles.loginbox}>
          <Text style={styles.title} fontFamily={"Karla-Medium"}>
            Login
          </Text>
        </View>
        <View style={styles.fields}>
          <View style={[styles.verticallySpaced, styles.mt20]}>
            <Input
              label="Email"
              labelStyle={{
                position: "absolute",
                top: -25,
                left: 25,
                color: "#616061",
              }}
              leftIcon={{
                type: "font-awesome",
                name: "envelope",
                color: "#616061",
                size: 18,
              }}
              onChangeText={setEmail}
              value={email}
              //placeholder="email@address.com"
              autoCapitalize="none"
              inputContainerStyle={{
                borderRadius: 30,
                borderWidth: 3,
                borderColor: "#8e9091",
                width: 270,
                paddingLeft: 15,
                height: 40,
              }}
            />
          </View>
          <View style={styles.verticallySpaced}>
            <Input
              label="Password"
              labelStyle={{
                position: "absolute",
                top: -25,
                left: 25,
                color: "#616061",
              }}
              leftIcon={{
                type: "font-awesome",
                name: "lock",
                color: "#616061",
                size: 20,
              }}
              onChangeText={setPassword}
              value={password}
              secureTextEntry
              //placeholder="Password"
              autoCapitalize="none"
              inputContainerStyle={{
                borderRadius: 30,
                borderWidth: 3,
                borderColor: "#8e9091",
                width: 270,
                paddingLeft: 15,
                height: 40,
              }}
            />
          </View>
        </View>
        <View style={styles.buttonbox}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            // style={styles.parent}
            colors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => signInWithEmail()}
              disabled={isLoading} // Disable the button when loading
              borderRadius={20}
            >
              <Text style={styles.buttontext} fontFamily={"Karla-Medium"}>
                Login
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
        <Text style={styles.signInText}>
          Don't have an account?{"  "}
          <Text
            style={styles.signInLink}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign Up
          </Text>
        </Text>
      </View>
      <View style={styles.syncbox}>
        <View style={styles.box}>
          <GradientText
            text={"SyncZone"}
            fontSize={40}
            isGradientFill
            isGradientStroke
            gradientColors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
            fontFamily={"Karla-Medium"}
            //gradientColors={["#D49AC0", "#6FD2E2"]}
            // fontFamily={"Gill Sans"}
          />
        </View>
      </View>
    </LinearGradient>
    //</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeview: {
    flex: 1,
    flex: 1,
  },
  parent: {
    flex: 1,
    //borderWidth: 4,

    //height: 1000,
    backgroundColor: "rgba(52, 52, 52, alpha)",
    // padding: 12,
    //backgroundColor: '#966dab',
  },
  space: {
    flex: 1,
    padding: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 4,
    flexDirection: "column",
    justifyContent: "space-between",
    flexDirection: "column",
    padding: 42,
    backgroundColor: "#fffbf5",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 90,
    //borderWidth: 3,
  },
  loginbox: {
    flex: 5,
    padding: 10,
    // margin: 8,
    //borderWidth: 3,
  },
  fields: {
    flex: 10,
    justifyContent: "space-between",
    padding: 5,
    //margin: 5,
    //justifyContent: 'center',
    backgroundColor: "#fffbf5",
    //borderWidth: 3,
    //height: '50%',
    rowGap: 5,
  },
  buttonbox: {
    flex: 0,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    //margin: 5,
    //borderWidth: 3,
  },
  syncbox: {
    flex: 2,
    justifyContent: "center",
    backgroundColor: "#fffbf5",
  },
  verticallySpaced: {
    flex: 1,
    padding: 5,
    margin: 5,
    position: "relative",
  },
  logo: {
    width: 250,
    height: 250,
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    color: "#616061",
    fontWeight: "bold",
    lineHeight: 34,
  },
  box: {
    minWidth: 10,
    marginTop: 40,
    padding: 12,
    alignItems: "center",
  },
  gradient: {
    overflow: "hidden",
    //backgroundColor: 'transparent',
    borderRadius: 30,
    elevation: 5,
  },

  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 50,
    width: 190,
  },
  buttontext: {
    fontWeight: "bold",
    fontSize: 21,
    color: "#fffbf5",
    //padding: 100,
  },
  mt20: {
    marginTop: 0,
  },
  signInText: {
    textAlign: "center",
    color: "#616061",
  },
  signInLink: {
    color: "#3F8CC5",
    fontWeight: "bold",
  },
  errorText: {
    // New style for error messages
    color: "red", // Change color as needed
    marginTop: 10,
    textAlign: "center",
  },
});
