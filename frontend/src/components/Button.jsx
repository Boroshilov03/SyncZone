import { Text, TouchableOpacity } from "react-native";

function Button({ title, onPress }) {
  return (
    <TouchableOpacity
      style={{
        marginTop: 30,
        backgroundColor: "pink",
        borderRadius: 26,
        height: 52,
        fontSize: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={onPress}
    >
      <Text
        style={{
          color: "white",
          fontSize: 16,
          fontWeight: "bold",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

export default Button;
