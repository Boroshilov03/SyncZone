import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image } from 'react-native';
import React from 'react';
import Dog from "../../assets/icons/Dogo.gif"; // Import the image

const GiftsScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Shop</Text>
      
      <View style={styles.categoryBox}>
        <Text style={styles.categoryText}>Banners</Text>
      </View>

      {/* Horizontal ScrollView for Banner Items */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Merged Frame for Banner Item and Item Name */}
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.mergedFrame}>
            {/* Frame for Banner Items */}
            <View style={styles.itemFrame}>
              {index === 0 ? (
                // Replace the frame with the image for the first item
                <Image source={Dog} style={styles.bannerImage} />
              ) : (
                // Show placeholder text for other items
                <Text style={styles.itemFrameText}>Banner Item {index + 1}</Text>
              )}
            </View>

            {/* Line in the center near the bottom */}
            <View style={styles.separator} />

            {/* Frame for Item Name and Get Button */}
            <View style={styles.buttonFrame}>
              <Text style={styles.itemName}>{index === 0 ? "Dog Brown & White" : `Banner Name ${index + 1}`}</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Merged Frame for Sticker Item and Item Name */}
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.mergedFrame}>
            {/* Frame for Sticker Items */}
            <View style={styles.itemFrame}>
              <Text style={styles.itemFrameText}>Sticker Item {index + 1}</Text>
            </View>

            {/* Line in the center near the bottom */}
            <View style={styles.separator} />

            {/* Frame for Item Name and Get Button */}
            <View style={styles.buttonFrame}>
              <Text style={styles.itemName}>Sticker Name {index + 1}</Text>
              <TouchableOpacity style={styles.getButton}>
                <Text style={styles.buttonText}>Get</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

export default GiftsScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 0,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  categoryBox: {
    width: 360,
    height: 58,
    borderColor: 'black',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 15,
    marginBottom: 30,
    borderRadius: 13,
  },
  categoryText: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  scrollContainer: {
    paddingHorizontal: 10,
  },
  mergedFrame: {
    width: 180,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 13,
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 30,
  },
  itemFrame: {
    width: '100%',
    height: 185,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: 150,  // Adjust this width according to your design
    height: 150, // Adjust this height according to your design
    resizeMode: 'contain',
  },
  itemFrameText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    width: '100%',
    height: 2,
    backgroundColor: 'black',
    marginVertical: 10,
  },
  buttonFrame: {
    width: '100%',
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  itemName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  getButton: {
    backgroundColor: '#007BFF',
    padding: 7,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

