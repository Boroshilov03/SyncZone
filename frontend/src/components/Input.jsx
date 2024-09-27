import { View, Text, TextInput } from "react-native";

function Input({ title, value, error, setValue, setError, secureTextEntry }) {
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
          borderRadius: 5,
          padding: 10,
          color: "black",
        }}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setError(""); // Reset error when user starts typing
        }}
      />
    </View>
  );
}

export default Input;
