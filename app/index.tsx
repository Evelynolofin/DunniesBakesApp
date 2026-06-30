import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {StatusBar, Text, View, Image, Animated,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;

        const currentUserEmail = await AsyncStorage.getItem('currentUserEmail');
        if (currentUserEmail) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/auth/login');
        }
      }
    }, 3700);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
    <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F53F05'}}>
      <Image
        source={require("@/assets/images/Avatars.png")}
        style={{width: 100, height: 100}}
      /> 
      <Animated.View style={{marginTop: 20}}>
        <Image
          source={require("@/assets/images/dunnies_kitchen.gif")}
          style={{width: 350, height: 60}}
        />
      </Animated.View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  
})