import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

const SpinningLogo = () => {
  const rotate1 = useRef(new Animated.Value(0)).current;
  const rotate2 = useRef(new Animated.Value(0)).current;
  const rotate3 = useRef(new Animated.Value(0)).current;
  const rotate4 = useRef(new Animated.Value(0)).current;

  const startRotation = (animation, duration) => {
    Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    ).start();
  };

  useEffect(() => {
    startRotation(rotate1, 2000);
    startRotation(rotate2, 2000); // Slightly different duration for unique rotation effect
    startRotation(rotate3, 2000);
    startRotation(rotate4, 2000);
  }, []);

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.ring,
            {
              borderBottomColor: "rgb(255, 141, 249)",
              borderBottomWidth: 10, // Increased width for more prominence

              transform: [
                { rotateX: "50deg" },
                { rotateX: "110deg" }, // Mimicking 3D rotation with static angle
                {
                  rotateZ: rotate1.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["50deg", "470deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              borderBottomColor: "rgb(255, 65, 106)",
              borderBottomWidth: 12, // Increased width for more prominence

              transform: [
                { rotateX: "20deg" }, // Static rotation mimicking rotateX
                { rotateY: "50deg" }, // Adjust for side placement
                {
                  rotateZ: rotate2.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["20deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              borderBottomColor: "rgb(0, 255, 255)",
              borderBottomWidth: 12, // Increased width for more prominence

              transform: [
                { rotateX: "40deg" },
                { rotateY: "130deg" }, // Adjust for side placement
                {
                  rotateZ: rotate3.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["450deg", "90deg"],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            {
              borderBottomColor: "rgb(252, 183, 55)",
              borderBottomWidth: 12, // Increased width for more prominence

              transform: [
                { rotateX: "70deg" },
                {
                  rotateZ: rotate4.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["270deg", "630deg"],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    width: 200,
    height: 200,
  },
  ring: {
    width: 190,
    height: 190,
    borderRadius: 95,
    position: "absolute",
  },
});

export default SpinningLogo;
