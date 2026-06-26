import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {StatusBar, Text, View, Image, Animated,
  StyleSheet
} from 'react-native';

export default function Index() {
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace("/auth/login");
      }
    }, 3700);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
    <StatusBar barStyle="light-content" backgroundColor="red" />
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F53F05'}}>
      <Image
        source={require("@/assets/images/Avatars.png")}
        style={{width: 100, height: 100}}
      /> 
      <Animated.View style={{marginTop: 20}}>
        <Image
          source={require("@/assets/images/dunnies_bakes.gif")}
          style={{width: 350, height: 60}}
        />
      </Animated.View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  
})