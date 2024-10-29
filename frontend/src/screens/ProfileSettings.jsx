import { React, useState, useEffect } from "react";
import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TouchableOpacity,
    Pressable,
    Modal,
    Image,
    Switch,
    ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "@rneui/themed";
import * as Font from "expo-font";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import GradientText from "react-native-gradient-texts";
import OwnedBannersModal from "../components/OwnedBannersModal";

const ProfileSettings = ({ navigation, route }) => {
    const { contactInfo } = route.params; // Access contactInfo correctly
    const [visible, setVisible] = useState(false);
    const [settingVisible, setSettingVisible] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const [ownedBannersVisible, setOwnedBannersVisible] = useState(false);

    // State for form fields
    const [username, setUsername] = useState(contactInfo.contactUsername || "");
    const [email, setEmail] = useState(contactInfo.email || ""); // Make sure contactInfo has email property
    const [password, setPassword] = useState(""); // Leave this blank for user to enter
    const [firstName, setFirstName] = useState(contactInfo.contactFirst || "");
    const [lastName, setLastName] = useState(contactInfo.contactLast || "");

    useEffect(() => {
        const loadFonts = async () => {
            await Font.loadAsync({
                "Inter_18pt-Regular": require("./fonts/Inter_18pt-Regular.ttf"),
                "Inter_18pt-Medium": require("./fonts/Inter_18pt-Medium.ttf"),
                "Inter_18pt-MediumItalic": require("./fonts/Inter_18pt-MediumItalic.ttf"),
                "Poppins-Regular": require("./fonts/Poppins-Regular.ttf"),
                "Poppins-Medium": require("./fonts/Poppins-Regular.ttf"),
                "Karla-Regular": require("./fonts/Karla-Regular.ttf"),
            });
            setFontsLoaded(true);
        };

        loadFonts();
    }, []);

    const toggleSwitch = () => setIsEnabled((previousState) => !previousState);

    if (!fontsLoaded) {
        return null; // You can return a loading spinner or similar
    }

    return (
        <SafeAreaView
            style={[styles.container, { marginTop: Constants.statusBarHeight }]}
        >
            <ScrollView style={styles.scroll}>
                <Pressable style={styles.trash}  >
                    <Icon
                        name="trash"
                        size={35}
                        color="red"
                        onPress={() => setVisible(true)}
                    ></Icon>
                </Pressable>
                <View style={styles.profileContainer} >
                    <Pressable style={styles.pic} onPress={() => setModalVisible(true)}>
                        <Image
                            source={{ uri: contactInfo.contactPFP }}
                            style={styles.placeholderImage}
                            onPress={() => setOwnedBannersVisible(true)}
                        ></Image>
                    </Pressable>
                    {/* <Icon
                        name="camera"
                        size={25}
                        color='grey'
                        onPress={() => setVisible(true)}
                        style={styles.camera}
                    ></Icon> */}
                    <Text style={styles.name}>
                        {contactInfo.contactFirst} {contactInfo.contactLast}
                    </Text>
                    <Text style={styles.user}>@{contactInfo.contactUsername}</Text>
                    <View style={styles.actbox}>
                        <Text style={styles.act}>Show Activity Status</Text>
                        <Switch
                            trackColor={{ false: "#ccc", true: "#4caf50" }}
                            thumbColor={isEnabled ? "#fff" : "#fff"}
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                            marginHorizontal={10}
                        />
                    </View>
                </View>
                <Modal
                    visible={settingVisible}
                    animationType="slide"
                    transparent={true}
                >
                    <View style={styles.modalContainer}>
                        <Pressable style={styles.modalContent}>
                            <View style={styles.right}>
                                <Text
                                    style={styles.rText}
                                    onPress={() => {
                                        setOwnedBannersVisible(true);
                                        setVisible(false);
                                    }}
                                >
                                    Cancel
                                </Text>
                            </View>
                        </Pressable>
                    </View>
                </Modal>
                <Modal visible={isModalVisible} animationType="fade" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalText}>
                                <Text style={styles.mText}>Banners?</Text>
                            </View>
                            <Pressable style={styles.modalButtons}>
                                <View style={styles.left}>
                                    <Text style={styles.lText} onPress={() => setModalVisible(false)}>
                                        Delete
                                    </Text>
                                </View>
                                <View style={styles.right}>
                                    <Text style={styles.rText} onPress={() => setModalVisible(false)}>
                                        Cancel
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
                <Modal visible={visible} animationType="fade" transparent={true}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalText}>
                                <Text style={styles.mText}>Delete Account?</Text>
                            </View>
                            <Pressable style={styles.modalButtons}>
                                <Pressable style={styles.left}>
                                    <Text style={styles.lText} onPress={() => setOwnedBannersVisible(true)}>
                                        Delete
                                    </Text>
                                </Pressable>
                                <View style={styles.right}>
                                    <Text style={styles.rText} onPress={() => setVisible(false)}>
                                        Cancel
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </View>
                </Modal>

                <View style={styles.fields}>
                    {[
                        { label: "Username", value: username, setValue: setUsername },
                        { label: "Email", value: email, setValue: setEmail },
                        {
                            label: "Password",
                            value: password,
                            setValue: setPassword,
                            secureTextEntry: true,
                        },
                        { label: "First Name", value: firstName, setValue: setFirstName },
                        { label: "Last Name", value: lastName, setValue: setLastName },
                        // Add more fields as needed
                    ].map((field, index) => (
                        <View key={index} style={styles.verticallySpaced}>
                            <Input
                                label={field.label}
                                value={field.value}
                                onChangeText={field.setValue}
                                labelStyle={{
                                    position: "absolute",
                                    top: -25,
                                    left: 25,
                                    color: "#616061",
                                }}
                                leftIcon={{
                                    type: "font-awesome",
                                    name: field.label === "Password" ? "lock" : (field.label === "Email" ? "envelope" : "user"),
                                    color: "#616061",
                                    size: 20,
                                }}
                                autoCapitalize="none"
                                secureTextEntry={field.secureTextEntry} // Use for password field
                                inputContainerStyle={{
                                    borderRadius: 30,
                                    borderTopWidth: 2.5,
                                    borderBottomWidth: 2.5,
                                    borderLeftWidth: 2.5,
                                    borderRightWidth: 2.5,
                                    borderColor: "#A7A7A7",
                                    width: 270,
                                    paddingLeft: 15,
                                    height: 40,
                                }}
                            />

                        </View>
                    ))}
                </View>
                <View style={styles.buttonbox}>
                    <LinearGradient
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        colors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
                        style={styles.gradient}
                    >
                        <TouchableOpacity
                            style={styles.button2}
                            borderRadius={20}
                        >
                            <Text style={[styles.buttontext]}>
                                Update
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* <Modal
                        visible={settingVisible}
                        animationType="slide"
                        transparent={true}
                    >
                        <View style={styles.modalContainer}>
                            <Pressable style={styles.modalContent}>
                                <View style={styles.right}>
                                    <Text
                                        style={styles.rText}
                                        onPress={() => setSettingVisible(false)}
                                    >
                                        Cancel
                                    </Text>
                                </View>
                            </Pressable>
                        </View>
                    </Modal> */}
                </View>

                <View style={styles.box}>
                    <GradientText
                        text={"SyncZone"}
                        fontSize={40}
                        isGradientFill
                        isGradientStroke
                        gradientColors={["#FFDDF7", "#C5ECFF", "#FFDDF7"]}
                        fontFamily={"Karla-Medium"}
                    />
                </View>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        navigation.navigate("MainTabs");
                    }}
                >
                    <Ionicons
                        name="arrow-back"
                        size={35}
                        color="grey"
                        style={styles.backButtonText}
                    />
                </TouchableOpacity>

                {/* Owned Banners Modal */}
                <OwnedBannersModal
                    visible={ownedBannersVisible}
                    onClose={() => setOwnedBannersVisible(false)}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileSettings;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        marginVertical: 10,
    },
    backButton: {
        position: "absolute",
        top: 5,
        left: 20,
        padding: 10,
        color: "grey",
        //backgroundColor: '#007bff', // Blue color for the button
        //borderRadius: 5,
    },
    backButtonText: {
        fontSize: 30,
    },
    trash: {
        position: "absolute",
        top: 5,
        right: 25,
        //borderWidth: 1,
        zIndex: 1,
    },
    camera: {
        position: "absolute",
        left: 1,
        size: 5,
        //borderWidth: 1,
        zIndex: 1,
    },
    actbox: {
        flex: 1,
        flexDirection: "row",
        //borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scroll: {
        //borderWidth: 1
    },
    pic: {
        flex: 1,
        // borderWidth: 1,
        borderRadius: 300,
    },
    user: {
        fontFamily: "Inter_18pt-MediumItalic",
        color: "grey",
        textAlignVertical: "top",
    },
    name: {
        fontFamily: "Inter_18pt-Medium",
        fontSize: 20,
    },
    act: {
        fontFamily: "Inter_18pt-Medium",
    },
    profileContainer: {
        flex: 1,
        //flexWrap: 'wrap',
        justifyContent: "center",
        alignItems: "center",
        //marginTop: '10%',
        //borderWidth: 4,
        width: "100%",
        margin: 0, // Remove any margin that may prevent stretching
        padding: 0, // Remove padding if it exists
        //aspectRatio: 1
    },
    placeholderImage: {
        width: 110,
        height: 110,
        borderRadius: 155,
        borderWidth: 4,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
        margin: 10,
    },
    fields: {
        flexGrow: 1,
        //borderWidth: 1,
        marginTop: 5,
        //padding: 20,
        //height: 1000,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        paddingVertical: 20,
    },
    verticallySpaced: {
        flex: 1,
        flexWrap: "wrap",
        // padding: 1,
        // margin: 1,
        position: "relative",
        //borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        height: "40%",
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
        fontFamily: "Poppins-Medium",
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
        fontFamily: "Poppins-Medium",
    },
    rText: {
        color: "blue",
        //fontWeight: 'bold',
        fontFamily: "Poppins-Medium",
    },

    buttonbox: {
        flex: 0,
        padding: 0,
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
        padding: 10,
        borderRadius: 50,
        width: 250,
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