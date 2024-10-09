import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import React from "react";

const GiftsScreen = () => {
  return (
    <SafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Shop</Text>

        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Banners</Text>
        </View>

        {/* Horizontal ScrollView for Banner Items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Merged Frame for Banner Item and Item Name */}
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.mergedFrame}>
              {/* Frame for Banner Items */}
              <View style={styles.itemFrame}>
                <Text style={styles.itemFrameText}>
                  Banner Item {index + 1}
                </Text>
              </View>

              {/* Line in the center near the bottom */}
              <View style={styles.separator} />

              {/* Frame for Item Name and Get Button */}
              <View style={styles.buttonFrame}>
                <Text style={styles.itemName}>Item Name {index + 1}</Text>
                <TouchableOpacity style={styles.getButton}>
                  <Text style={styles.buttonText}>Get</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.categoryBox}>
          <Text style={styles.categoryText}>Stickers</Text>
        </View>

        {/* Horizontal ScrollView for Sticker Items */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Merged Frame for Sticker Item and Item Name */}
          {Array.from({ length: 3 }).map((_, index) => (
            <View key={index} style={styles.mergedFrame}>
              {/* Frame for Sticker Items */}
              <View style={styles.itemFrame}>
                <Text style={styles.itemFrameText}>
                  Sticker Item {index + 1}
                </Text>
              </View>

              {/* Line in the center near the bottom */}
              <View style={styles.separator} />

              {/* Frame for Item Name and Get Button */}
              <View style={styles.buttonFrame}>
                <Text style={styles.itemName}>Item Name {index + 1}</Text>
                <TouchableOpacity style={styles.getButton}>
                  <Text style={styles.buttonText}>Get</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GiftsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 0, // Adjust this value as needed to space from the top
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    marginBottom: 30, // Space between title and category boxes
  },
  categoryBox: {
    width: 360, // Width of the box
    height: 58,
    borderColor: "black", // Box border color
    borderWidth: 2, // Box border thickness
    justifyContent: "center", // Vertically center the text
    alignItems: "flex-start", // Align text to the left
    paddingLeft: 15, // Space between the text and the left side of the box
    marginBottom: 30, // Space between category boxes
    borderRadius: 13, // Corner radius of the frame
  },
  categoryText: {
    fontSize: 30, // Adjust the text size inside the box
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingHorizontal: 10, // Padding around the scroll view
  },
  mergedFrame: {
    width: 180, // Width of the merged frame
    borderColor: "black", // Border color for the merged frame
    borderWidth: 2, // Border thickness for the merged frame
    borderRadius: 13, // Corner radius for the merged frame
    alignItems: "center", // Center items within the frame
    marginRight: 15, // Space between items in horizontal scroll
    marginBottom: 30, // Space below the merged frame
  },
  itemFrame: {
    width: "100%", // Full width of the merged frame
    height: 185, // Height of the item frame
    justifyContent: "center", // Center content
    alignItems: "center", // Center content
  },
  itemFrameText: {
    fontSize: 20, // Text size for the item frame
    fontWeight: "bold",
  },
  separator: {
    width: "100%", // Full width of the merged frame
    height: 2, // Height of the line
    backgroundColor: "black", // Line color
    marginVertical: 10, // Space above and below the line
  },
  buttonFrame: {
    width: "100%", // Full width of the merged frame
    height: 104, // Height of the bottom frame
    justifyContent: "center", // Center content
    alignItems: "center", // Center content
    padding: 10, // Padding around the content
  },
  itemName: {
    fontSize: 20, // Text size for the item name
    fontWeight: "bold",
  },
  getButton: {
    backgroundColor: "#007BFF", // Button background color
    padding: 7,
    borderRadius: 5, // Rounded corners for the button
    marginTop: 20, // Space above the button
  },
  buttonText: {
    color: "white", // Button text color
    fontWeight: "bold",
  },
});
