import { View, Text, TextInput } from "react-native";

function Input({ title, value, error, setValue, secureTextEntry }) {
  return (
    <View style={{ marginVertical: 6 }}>
      <Text
        style={{
          color: error ? "#ff5555" : "#70747a",
          marginVertical: 6,
          paddingHorizontal: 16,
        }}
      >
        {error || title} {/* Display error message or title */}
      </Text>
      <TextInput
        autoCapitalize="none"
        autoComplete="off"
        secureTextEntry={secureTextEntry}
        style={{
          backgroundColor: "#f3f4f6",
          borderWidth: 1,
          borderColor: error ? "#ff5555" : "#d1d5db",
          borderRadius: 40,
          borderWidth: 2,
          padding: 10,
          width: 350,
          color: "black",
        }}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          // Removed setError since it's not needed here
        }}
      />
    </View>
  );
}

export default Input;
