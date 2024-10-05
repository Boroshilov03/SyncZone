import React, { useState } from "react";
import { Alert, StyleSheet, View, Text } from "react-native";
import { supabase } from "../lib/supabase";
import { Button, Input } from "@rneui/themed";
import GradientText from "react-native-gradient-texts";
import useStore from "../store/store"; // Assuming this handles user and tokens
import { loginSchema } from "../utils/validation"; // Import the login schema
import { useMutation } from "@tanstack/react-query"; // Import useMutation

export default function SignInScreen({ navigation }) {
  const { setUser, setAccessToken, setRefreshToken } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    },
    onError: (error) => {
      // If validation error, show validation message
      if (error.errors) {
        Alert.alert("Validation Error", error.errors[0].message); // Display the first validation error
      } else {
        Alert.alert("Login Error", error.message); // Handle any other error
      }
    },
  });

  return (

    <View style={styles.parent}>
      <View style={styles.container}>
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <Input
            label="Email"
            leftIcon={{ type: "font-awesome", name: "envelope" }}
            onChangeText={setEmail}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.verticallySpaced}>
          <Input
            label="Password"
            leftIcon={{ type: "font-awesome", name: "lock" }}
            onChangeText={setPassword}
            value={password}
            secureTextEntry
            placeholder="Password"
            autoCapitalize="none"
          />
        </View>
        <View>
          <Button
            title="Sign in"
            disabled={loading}
            onPress={signInWithEmail}
          />
        </View>
        <Text style={styles.signInText}>
          Don't have an account?{" "}
          <Text
            style={styles.signInLink}
            onPress={() => navigation.navigate("SignUp")}
          >
            Sign Up
          </Text>
        </Text>
      </View>
      <View style={styles.box}>
        <GradientText
          text={"SyncZone"}
          textAlign={""}
          fontSize={40}
          isGradientFill
          isGradientStroke
          width={420}
          locations={{ x: 210, y: 65 }}
          gradientColors={["#D49AC0", "#6FD2E2"]}
          fontFamily={"Gill Sans"}
      <View>
        <Button
          title="Sign in"
          disabled={isLoading} // Disable the button when loading
          onPress={signInWithEmail}
        />
      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 40,
    padding: 12,
    // backgroundColor: '#8ca599',
  },
  parent: {
    flex: 1,
    marginTop: 40,
    padding: 12,
    // backgroundColor: '#8ca599',
  },
  box: {
    // backgroundColor: '#fff',
    marginTop: 40,
    padding: 12,
    alignItems: "center",
  },
  mt20: {
    marginTop: 20,
  },
  signInText: {
    textAlign: "center",
    marginTop: 16,
  },
  signInLink: {
    color: "#007BFF",
    fontWeight: "bold",
  },
  sync: {
    textAlign: "center",
    fontWeight: 'bold',
    fontSize: 30,
  },
});
