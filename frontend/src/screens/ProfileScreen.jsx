import {
  StyleSheet,
  Text,
  View,
  Image,
  SafeAreaView,
  TouchableOpacity,
  Button,
  Pressable,
  Modal,
} from "react-native";
import { React, useState, useEffect, useCallback } from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import * as Font from "expo-font";
import axios from "axios";
import { supabase } from "../lib/supabase";
import { WEATHER_API_KEY } from "@env";

const ProfileScreen = ({
  navigation,
  contactID,
  contactPFP,
  contactFirst,
  contactLast,
  contactUsername,
  setProfileVisible,
}) => {
  const [visible, setVisible] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [timezone, setTimezone] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [weather, setWeather] = useState({
    temp: "",
    description: "",
    time: null,
  });
  const [location, setLocation] = useState(false);
  const [country, setCountry] = useState(null);

  useEffect(() => {
    async function fetchLatLon() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("latitude, longitude, location")
          .eq("id", contactID)
          .single();

        if (error) {
          console.error("Error fetching location data:", error.message);
        } else if (data) {
          setLatitude(data.latitude);
          setLongitude(data.longitude);
          setLocation(data.location);
        }
      } catch (error) {
        console.error("Error fetching latitude and longitude:", error);
      }
    }

    fetchLatLon();
  }, [contactID]);

  useEffect(() => {
    const fetchCountry = async () => {
      const response = await axios.get(
        `http://api.geonames.org/findNearbyPlaceNameJSON`,
        {
          params: {
            lat: latitude,
            lng: longitude,
            username: "synczone",
          },
        }
      );

      setCountry(response.data.geonames[0].countryName);
    };
    fetchCountry();
  }, [latitude, longitude]);

  const fetchWeatherAndTime = useCallback(async (latitude, longitude) => {
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=imperial&appid=${WEATHER_API_KEY}`
    );

    let weatherData = {};
    if (weatherResponse.data) {
      const { main, weather: weatherDetails } = weatherResponse.data;
      const description = weatherDetails[0]?.description;

      weatherData = {
        temp: main.temp,
        description: description
          ? description.charAt(0).toUpperCase() + description.slice(1)
          : "",
      };
    }

    const timeResponse = await axios.get(
      `http://api.geonames.org/timezoneJSON?lat=${latitude}&lng=${longitude}&username=synczone`
    );
    let localTime = null;
    if (timeResponse.data) {
      const rawTime = timeResponse.data.time;
      const dateObj = new Date(rawTime);
      localTime = dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    setWeather({ ...weatherData, time: localTime });
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherAndTime(latitude, longitude);
    }
  }, [latitude, longitude, fetchWeatherAndTime]);

  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        "Poppins-Regular": require("./fonts/Poppins-Regular.ttf"),
        "Poppins-Medium": require("./fonts/Poppins-Medium.ttf"),
        "Poppins-Bold": require("./fonts/Poppins-Bold.ttf"),
        "Rubik-Regular": require("./fonts/Rubik-Regular.ttf"),
        "Rubik-Bold": require("./fonts/Rubik-Bold.ttf"),
      });
      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.trash}>
        <Icon
          name="trash"
          size={35}
          color="#616061"
          onPress={() => setVisible(true)}
        ></Icon>
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalText}>
              <Text style={styles.mText}>Remove Friend?</Text>
            </View>
            <Pressable style={styles.modalButtons}>
              <View style={styles.left}>
                <Text style={styles.lText} onPress={() => setVisible(false)}>
                  Remove
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.rText} onPress={() => setVisible(false)}>
                  Cancel
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate("MainTabs")}
      >
        {/* <Text style={styles.backButtonText}>Back button for chat page</Text> */}
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        <View style={styles.weather}>
          {location ? ( <Text style={styles.loc}> {location}</Text>) : null}
          {country ? ( <Text style={styles.country}> {country}</Text>) : null}
        </View>
        <View style={styles.midbox}>
          <View style={styles.temp}>
            {weather.temp && weather.description ? (
              <Text style={styles.weatherText}>
                {weather.temp}°F, {weather.description}
              </Text>
            ) : null}
          </View>

          {contactPFP ? (
            <Image source={{ uri: contactPFP }} style={styles.profileImage} />
          ) : (
            //<View style={styles.placeholderImage} />
            <Image
              source={require("../images/girl.png")}
              style={styles.placeholderImage}
            />
          )}

          <View style={styles.temp}>
            {weather.time ? (
              <Text style={styles.weatherText}>{weather.time}</Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.nameText}>{contactUsername}</Text>
        {/* <Text style={styles.usernameText}>@{contactUsername}</Text> */}
        {/* <Text style={styles.idText}>User ID: {contactID}</Text> */}
      </View>
      <Pressable
        style={styles.buttons}
        onPress={() => {
          setProfileVisible(false);
          navigation.navigate("ProfileSettings", { setProfileVisible });
        }}
      >
        <Ionicons name="chatbox-ellipses" size={35} color="#616061" />
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //borderWidth: 1,
    //justifyContent: 'center',
    alignItems: "center",
    //alignItems: 'center',
    //justifyContent: 'center',
    //padding: 20,
    //backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topbox: {
    flex: 0.2,
    //borderWidth: 3,
    alignItems: "flex-end",

    margin: 20,
  },
  trash: {
    position: "absolute",
    top: -30,
    right: 10,
  },
  weather: {
    flex: 1,
    padding: 10,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    //flexWrap: 'wrap',
    //borderWidth: 3
  },
  weatherText: {
    fontFamily: "Rubik-Regular",
    fontSize: 18,
  },
  loc: {
    fontFamily: "Rubik-Regular",
    fontSize: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  country: {
    fontFamily: "Rubik-Regular",
    fontSize: 18,
    justifyContent: "center",
    alignItems: "center",
    color: "#555",
  },
  midbox: {
    //flexWrap: 'wrap',
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    //borderWidth: 1,
    zIndex: 0,
  },
  profileContainer: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
    //borderWidth: 4,
    width: 340,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 200, // Makes the image circular
    marginBottom: 10,
    padding: 10,
    resizeMode: "cover",
  },
  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 155,
    backgroundColor: "#ccc", // Gray color for placeholder
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,

    // margin: 20,
    //borderWidth: 3,
  },
  nameText: {
    fontSize: 24,
    //fontWeight: 'bold',
    marginBottom: 5,
    //fontFamily: 'Poppins-Bold',
  },
  usernameText: {
    fontSize: 18,
    color: "#555",
    fontFamily: "Poppins-Regular",
  },
  idText: {
    fontSize: 14,
    color: "#888",
  },
  buttons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    width: "100%",
    //borderWidth: 1,
  },
  temp: {
    flex: 1,
    //borderWidth: 1,
    alignItems: "center",

    //padding: 10,
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
    fontFamily: "Poppins-Regular",
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
    fontFamily: "Poppins-Regular",
  },
  rText: {
    color: "blue",
    //fontWeight: 'bold',
    fontFamily: "Poppins-Regular",
  },
});

export default ProfileScreen;
