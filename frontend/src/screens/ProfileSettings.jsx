import { React, useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Pressable, Modal, Image, Switch, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { Input } from "@rneui/themed";
import * as Font from 'expo-font';
import Constants from 'expo-constants';
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "react-native-gradient-texts";


const ProfileSettings = ({ navigation, route }) => {
    const { setProfileVisible } = route.params;
    const [visible, setVisible] = useState(false);
    const [settingVisible, setSettingVisible] = useState(false);

    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    const [fontsLoaded, setFontsLoaded] = useState(false);
    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                'Inter_18pt-Regular': require('./fonts/Inter_18pt-Regular.ttf'),
                'Inter_18pt-Medium': require('./fonts/Inter_18pt-Medium.ttf'),
                'Inter_18pt-MediumItalic': require('./fonts/Inter_18pt-MediumItalic.ttf'),
                'Poppins-Regular': require('./fonts/Poppins-Regular.ttf'),

            });
            setFontsLoaded(true);
        };

        loadFonts();
    }, []);

    if (!fontsLoaded) {
        return null; // You can return a loading spinner or similar
    }

    return (
        <SafeAreaView style={[styles.container, { marginTop: Constants.statusBarHeight }]}>
            <ScrollView style={styles.scroll}>
                <Pressable style={styles.trash}>
                    <Icon name="trash" size={35} color='red' onPress={() => setVisible(true)}></Icon>
                </Pressable>
                <View style={styles.profileContainer}>
                    <Image source={require('../images/girl.png')} style={styles.placeholderImage} />
                    <Text style={styles.name}>Overwatch Winston</Text>
                    <Text style={styles.user}>@Lebron James</Text>
                    <View style={styles.actbox}>
                        <Text style={styles.act}>Show Activity Status</Text>
                        <Switch trackColor={{ false: '#ccc', true: '#4caf50' }} thumbColor={isEnabled ? '#fff' : '#fff'} onValueChange={toggleSwitch} value={isEnabled} />
                    </View>
                </View>

                <Modal
                    visible={visible}
                    animationType="fade"
                    transparent={true}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalText}>
                                <Text style={styles.mText}>Delete Account?</Text>
                            </View>
                            <Pressable style={styles.modalButtons}>
                                <View style={styles.left}>
                                    <Text style={styles.lText} onPress={() => setVisible(false)}>Delete</Text>
                                </View>
                                <View style={styles.right}>
                                    <Text style={styles.rText} onPress={() => setVisible(false)}>Cancel</Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <View style={styles.fields}>
                    <View style={styles.verticallySpaced}>
                        <Input
                            label="Username"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View>
                    <View style={styles.verticallySpaced}>
                        <Input
                            label="Email"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View><View style={styles.verticallySpaced}>
                        <Input
                            label="Password"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View><View style={styles.verticallySpaced}>
                        <Input
                            label="First Name"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View><View style={styles.verticallySpaced}>
                        <Input
                            label="Last Name"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View><View style={styles.verticallySpaced}>
                        <Input
                            label="Location"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View><View style={styles.verticallySpaced}>
                        <Input
                            label="Timezone"
                            labelStyle={{
                                position: "absolute",
                                top: -25,
                                left: 25,
                                color: "#616061",
                            }}
                            leftIcon={{
                                type: "font-awesome",
                                name: "lock",
                                color: "#616061",
                                size: 20,
                            }}

                            autoCapitalize="none"
                            inputContainerStyle={{
                                borderRadius: 30,
                                borderWidth: 3,
                                borderColor: "#8e9091",
                                width: 270,
                                paddingLeft: 15,
                                height: 40,
                            }}
                        />
                    </View>
                </View>
                <View style={styles.buttonbox}>
                    <LinearGradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        // style={styles.parent}
                        colors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
                        style={styles.gradient}
                    >
                        <TouchableOpacity
                            style={styles.button2}
                            borderRadius={20}
                            onPress={() => setSettingVisible(true)}
                        >
                            <Text style={styles.buttontext} fontFamily={"Karla-Medium"}>
                                bryan click this
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                    <Modal
                        visible={settingVisible}
                        animationType="slide"
                        transparent={true}
                    >
                        <View style={styles.modalContainer}>
                            <Pressable style={styles.modalContent} >
                                <View style={styles.modalText}>
                                    <Text style={styles.mText} onPress={() => setSettingVisible(false)}>Make your banner modal here for now</Text>
                                </View>
                                <View style={styles.right}>
                                    <Text style={styles.rText} onPress={() => setSettingVisible(false)}>Cancel</Text>
                                </View>

                            </Pressable>

                        </View>
                    </Modal>
                </View>



                <View style={styles.box}>
                    <GradientText
                        text={"SyncZone"}
                        fontSize={40}
                        isGradientFill
                        isGradientStroke
                        gradientColors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
                        fontFamily={"Karla-Medium"}
                    //gradientColors={["#D49AC0", "#6FD2E2"]}
                    // fontFamily={"Gill Sans"}
                    />
                </View>
                <TouchableOpacity style={styles.backButton} onPress={() => {
                    setProfileVisible(true);
                    navigation.navigate("MainTabs");

                }}
                >
                    <Ionicons name="arrow-back" size={35} color='grey' style={styles.backButtonText} />
                    {/* <Text style={styles.backButtonText}>Temp back</Text> */}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileSettings;

const styles = StyleSheet.create({
    container: {
        // flex: 1,
        //justifyContent: 'center',
        //alignItems: 'center',
        width: '100%',
        height: '100%',
        //borderWidth: 1
    },
    backButton: {
        position: 'absolute',
        top: 5,
        left: 20,
        padding: 10,
        color: 'grey'
        //backgroundColor: '#007bff', // Blue color for the button
        //borderRadius: 5,
    },
    backButtonText: {
        fontSize: 30,
    },
    trash: {
        position: 'absolute',
        top: 10,
        right: 25,
        //borderWidth: 1,
        zIndex: 1,
    },
    actbox: {
        flex: 1,
        flexDirection: 'row',
        //borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    scroll: {
        //borderWidth: 1
    },
    user: {
        fontFamily: 'Inter_18pt-MediumItalic',
        color: 'grey',
        textAlignVertical: 'top'
    },
    name: {
        fontFamily: 'Inter_18pt-Medium',
        fontSize: 20,

    },
    act: {
        fontFamily: 'Inter_18pt-Medium',

    },
    profileContainer: {
        flex: 1,
        //flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        //marginTop: '10%',
        //borderWidth: 4,
        width: '100%',
        margin: 0, // Remove any margin that may prevent stretching
        padding: 0, // Remove padding if it exists
        //aspectRatio: 1


    },
    placeholderImage: {
        width: 110,
        height: 110,
        borderRadius: 155,

        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        margin: 10,
    },
    fields: {
        flexGrow: 1,
        //borderWidth: 1,
        marginTop: 5,
        //padding: 20,
        //height: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
    },
    verticallySpaced: {
        flex: 1,
        flexWrap: 'wrap',
        // padding: 1,
        // margin: 1,
        position: "relative",
        //borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '40%',
        marginVertical: 8,
    },


    button: {
        marginTop: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        //borderRadius: 5,
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
        fontFamily: 'Poppins-Medium'
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
        fontFamily: 'Poppins-Medium',
    },
    rText: {
        color: 'blue',
        //fontWeight: 'bold',
        fontFamily: 'Poppins-Medium',
    },

    buttonbox: {
        flex: 0,
        padding: 5,
        //justifyContent: "center",
        alignItems: "center",

        //margin: 5,
        //borderWidth: 3,
    },
    gradient: {
        overflow: "hidden",
        //backgroundColor: 'transparent',
        borderRadius: 30,
        elevation: 5,
    },
    button2: {
        alignItems: "center",
        justifyContent: "center",
        padding: 15,
        borderRadius: 50,
        width: 190,
    },
    buttontext: {
        fontWeight: "bold",
        fontSize: 21,
        color: "#fffbf5",
        //padding: 100,
    },
    box: {
        //minWidth: 10,
        marginTop: 0,
        padding: 0,
        justifyContent: "flex-start",
        alignItems: "center",
    },
});