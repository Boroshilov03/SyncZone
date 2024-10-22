import { StyleSheet, Text, View, Image, SafeAreaView, TouchableOpacity, Button, Pressable, Modal, } from 'react-native';
import { React, useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import * as Font from 'expo-font';



const ProfileScreen = ({ navigation, route, contactID, contactPFP, contactFirst, contactLast, contactUsername, setProfileVisible }) => {
  //const [modalVisible, setModalVisible] = useState(false);
  const [visible, setVisible] = useState(false);


  const [fontsLoaded, setFontsLoaded] = useState(false);
  useEffect(() => {
    const loadFonts = async () => {
      await Font.loadAsync({
        'Poppins-Regular': require('./fonts/Poppins-Regular.ttf'),
        'Poppins-Medium': require('./fonts/Poppins-Medium.ttf'),
        'Poppins-Bold': require('./fonts/Poppins-Bold.ttf'),
        'Rubik-Regular': require('./fonts/Rubik-Regular.ttf'),
        // Load other weights as needed
      });
      setFontsLoaded(true);
    };

    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return null; // You can return a loading spinner or similar
  }



  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.trash}>
        <Icon name="trash" size={35} color='#616061' onPress={() => setVisible(true)}></Icon>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalText}>
              <Text style={styles.mText}>Remove Friend?</Text>
            </View>
            <Pressable style={styles.modalButtons}>
              <View style={styles.left}>
                <Text style={styles.lText} onPress={() => setVisible(false)}>Remove</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.rText} onPress={() => setVisible(false)}>Cancel</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate("MainTabs")}>
        {/* <Text style={styles.backButtonText}>Back button for chat page</Text> */}
      </TouchableOpacity>

      <View style={styles.profileContainer}>
        <View style={styles.weather}>
          <Text style={styles.weatherText}>Barcelona, Spain</Text>
        </View>
        <View style={styles.midbox}>
          <View style={styles.temp}>
            <Text style={styles.weatherText}>62°F   </Text>
          </View>
          {contactPFP ? (
            <Image source={{ uri: contactPFP }} style={styles.profileImage} />


          ) : (
            //<View style={styles.placeholderImage} />
            <Image source={require('../images/girl.png')} style={styles.placeholderImage} />
          )}
          <View style={styles.temp}>
            <Text style={styles.weatherText}>4:36 AM</Text>
          </View>
        </View>
        <Text style={styles.nameText}>
          {contactFirst} {contactLast}
        </Text>
        <Text style={styles.usernameText}>@{contactUsername}</Text>
        {/* <Text style={styles.idText}>User ID: {contactID}</Text> */}
      </View>
      <Pressable
        style={styles.buttons}
        onPress={() => {
          setProfileVisible(false)
          navigation.navigate("ProfileSettings", { setProfileVisible });
        }}
      >
        <Ionicons name="create" size={35} color='#616061' />
      </Pressable>
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    //borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
    //alignItems: 'center',
    //justifyContent: 'center',
    //padding: 20,
    //backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topbox: {
    flex: .2,
    borderWidth: 3,
    alignItems: 'flex-end',

    margin: 20,
  },
  // backButton: {
  //   position: 'absolute',
  //   top: 40,
  //   left: 20,
  //   padding: 10,
  //   backgroundColor: '#007bff', // Blue color for the button
  //   borderRadius: 5,
  // },
  // backButtonText: {
  //   color: '#fff',
  //   fontSize: 16,
  // },
  trash: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  weather: {
    flex: .3,
    //flexWrap: 'wrap',

    //borderWidth: 3
  },
  weatherText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 18,
  },
  midbox: {
    //flexWrap: 'wrap',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    //borderWidth: 1,
  },
  profileContainer: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    //borderWidth: 4,
    width: 340,

  },
  profileImage: {
    width: 170,
    height: 170,
    borderRadius: 200, // Makes the image circular
    marginBottom: 10,
    padding: 10,
    resizeMode: 'cover',


  },
  placeholderImage: {
    width: 170,
    height: 170,
    borderRadius: 155,
    backgroundColor: '#ccc', // Gray color for placeholder
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  idText: {
    fontSize: 14,
    color: '#888',
  },
  buttons: {
    flex: 1,
    //flexDirection: 'row',
    //justifyContent: 'center',
    alignItems: 'center',
    width: 150,
    //borderWidth: 1,
  },
  temp: {
    flex: 1,
    //borderWidth: 1,
    alignItems: 'center',

    //padding: 10,

  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    flex: .12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 190,
    //padding: 20,
    //paddingBottom: 20,
    backgroundColor: 'white',
    borderRadius: 25,
    alignItems: 'center',
    //borderWidth: 1,
    borderColor: 'grey'
  },
  modalText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderBottomColor: 'grey',
    borderBottomWidth: 1,
    borderColor: 'grey',
    width: '100%'
  },
  mText: {
    fontFamily: 'Poppins-Regular'
  },
  modalButtons: {
    flex: 1,
    flexDirection: 'row',

  },
  left: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'grey',
    borderRightWidth: 1,
    padding: 10,
  },
  right: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  lText: {
    color: 'red',
    //fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },
  rText: {
    color: 'blue',
    //fontWeight: 'bold',
    fontFamily: 'Poppins-Regular',
  },
});

export default ProfileScreen;
