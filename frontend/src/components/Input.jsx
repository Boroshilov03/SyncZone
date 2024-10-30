import React from "react";
import { View, Text, TextInput } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome"; // Ensure this import

function Input({ title, value, error, setValue, secureTextEntry, leftIcon }) {
  return (
    <View style={{ marginVertical: 6 }}>
      <Text
        style={{
          color: error ? "#ff5555" : "#70747a",
          marginVertical: 6,
          paddingHorizontal: 16,
          fontWeight: 'bold'

        }}
      >
        {error || title}
      </Text>
      <View style={{ position: "relative" }}>
        {leftIcon && (
          <Icon
            name={leftIcon.name}
            size={leftIcon.size}
            color={leftIcon.color}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              zIndex: 1
            }}
          />
        )}
        <TextInput
          autoCapitalize="none"
          autoComplete="off"
          secureTextEntry={secureTextEntry}
          style={{
            backgroundColor: "#fffbf5",
            borderWidth: 2.5,
            borderColor: error ? "#ff5555" : "#8e9091",
            borderRadius: 40,
            padding: 10,
            paddingLeft: leftIcon ? 40 : 10, // Adjust padding for icon space
            width: 310,
            color: "black",
            height: 40,
          }}
          value={value}
          onChangeText={(text) => setValue(text)}

        />
      </View>
    </View>
  );
}

export default Input;