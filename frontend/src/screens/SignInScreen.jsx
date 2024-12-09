import React, { useState, useEffect } from "react";
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
import * as Font from "expo-font";
import { LinearGradient } from "expo-linear-gradient";
import useStore from "../store/store"; // Assuming this handles user and tokens
import { loginSchema } from "../utils/validation"; // Import the login schema
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import SpinningLogo from "../components/SpinningLogo";
import { TouchableOpacity } from "react-native-gesture-handler";

import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function SignInScreen({ navigation }) {
  const { setUser, setAccessToken, setRefreshToken } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "Inter_18pt-Regular": require("./fonts/Inter_18pt-Regular.ttf"),
        "Inter_18pt-Medium": require("./fonts/Inter_18pt-Medium.ttf"),
        "Inter_18pt-MediumItalic": require("./fonts/Inter_18pt-MediumItalic.ttf"),
        "Poppins-Regular": require("./fonts/Poppins-Regular.ttf"),
        "Poppins-Medium": require("./fonts/Poppins-Medium.ttf"),
        "Karla-Regular": require("./fonts/Karla-Regular.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  const { mutate: signInWithEmail, isLoading } = useMutation({
    mutationFn: async () => {
      loginSchema.parse({ email, password });

      const { error, data } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (data) => {
      const { session, user } = data;
      setUser(user);
      setAccessToken(session.access_token);
      setRefreshToken(session.refresh_token);
      setErrorMessage(""); // Clear any previous error message on success
    },
    onError: (error) => {
      if (error.errors) {
        setErrorMessage(error.errors[0].message);
      } else {
        setErrorMessage(error.message);
      }
    },
  });

  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.parent}
      colors={["#FFDDF7", "#C5ECFF"]}
    >
      <View style={styles.space}></View>
      <View style={styles.container}>

        <View style={styles.loginbox}>
          <Text style={[styles.title, { fontFamily: "Karla-Medium" }]}>
            Login
          </Text>
          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>
        <View style={styles.fields}>
          <View style={[styles.verticallySpaced]}>
            <Input
              label="Email"
              labelStyle={{
                //position: "relative",
                top: -5,
                //left: 45,
                color: "#616061",
                textAlign: '',
              }}
              leftIcon={{
                type: "font-awesome",
                name: "envelope",
                color: "#616061",
                size: 18,
              }}
              onChangeText={setEmail}
              value={email}
              autoCapitalize="none"
              inputContainerStyle={{
                borderRadius: 30,
                display: 'flex',
                textAlign: 'center',
                alignSelf: 'center',
                borderTopWidth: 2.5,
                borderBottomWidth: 2.5,
                borderLeftWidth: 2.5,
                borderRightWidth: 2.5,
                borderColor: "#A7A7A7",
                paddingLeft: 15,
                width: '100%',
                //margin: 10,
                height: 40,
              }}
            />
          </View>

          <View style={styles.verticallySpaced}>
            <Input
              label="Password"
              labelStyle={{
                position: "relative",
                top: -5,
                //left: 45,
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
              autoCapitalize="none"
              inputContainerStyle={{
                borderRadius: 30,
                borderTopWidth: 2.5,
                borderBottomWidth: 2.5,
                borderLeftWidth: 2.5,
                borderRightWidth: 2.5,
                borderColor: "#A7A7A7",
                width: '100%',
                paddingLeft: 15,
                //margin: 20,
                height: 40,
                alignSelf: 'center',
              }}
            />
          </View>
        </View>
        {/* {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>} */}

        <View style={styles.buttonbox}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
            style={styles.gradient}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => signInWithEmail()}
              disabled={isLoading}
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
            fontFamily={"Karla-Bold"}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safeview: {
    flex: 1,
  },
  parent: {
    flex: 1,
    backgroundColor: "rgba(52, 52, 52, 0.1)",
  },
  space: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 4,
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  loginbox: {
    flexWrap: 'wrap',
    //alignItems: "center",
    padding: 20,
    //borderWidth: 1,
  },
  fields: {
    flexWrap: 'wrap',
    justifyContent: "center",
    alignItems: "center",
    //borderWidth: 3,

  },
  verticallySpaced: {
    //flexWrap: 'wrap',
    padding: 2,
    display: 'flex',
    // margin: 2,
    alignItems: 'center',
    justifyContent: 'center',
    //position: "relative",
    //borderWidth: 1,
    borderColor: 'red',
    width: '100%',
    paddingHorizontal: 30
  },
  buttonbox: {

    justifyContent: "center",
    alignItems: "center",
    //borderWidth: 3
  },
  syncbox: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  inputContainerStyle: {
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: "#A7A7A7",
    width: width * 0.8, // 80% of screen width
    height: 40,
  },
  labelStyle: {
    fontSize: 14,
    position: "relative",
    top: -5,
    left: 5,
    color: "#616061",
  },
  title: {
    fontSize: 32,
    color: "#616061",
    fontWeight: "bold",
    marginTop: 10,
    marginLeft: 20
  },
  gradient: {
    overflow: "hidden",
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
  },
  signInText: {
    fontSize: 16,
    textAlign: "center",
    color: "#616061",
    marginTop: 10,
  },
  signInLink: {
    color: "#3F8CC5",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "left",
    marginBottom: 10,
  },
});