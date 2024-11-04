import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import SpinningLogo from "../components/SpinningLogo";

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <SpinningLogo />
    </View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({


  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
})