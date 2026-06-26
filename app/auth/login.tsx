import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {Ionicons} from "@expo/vector-icons";
import { createUser, loginUser } from "@/hooks/authstore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type TabType = "Login" | "Sign Up";

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("Login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);
    if ("error" in result) {
      Alert.alert("Login failed", result.error);
    } else {
      await AsyncStorage.setItem(`fullName_${result.user.email}`, result.user.fullName)
      await AsyncStorage.setItem("currentUserEmail", result.user.email)
      router.replace("/(tabs)/home");
    }
  }
  
  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPass) {
      Alert.alert("Missing fields", "Fill in all fields.");
      return;
    }
    if (password !== confirmPass) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await createUser(fullName, email, password);
    setLoading(false);
    if ("error" in result) {
      Alert.alert("Sign up failed", result.error);
    } else {
      const normalizedEmail = email.toLowerCase().trim()
      await AsyncStorage.setItem(`fullName_${normalizedEmail}`, fullName)
      await AsyncStorage.setItem("currentUserEmail", normalizedEmail)
      Alert.alert(
        "Verify your email",
        `Your verification code is: ${result.code}\n\n(In production this would be emailed to you.)`,
        [
          {
            text: "Enter code",
            onPress: () =>
              router.push({
                pathname: "/auth/verification",
                params: { email: email.toLowerCase().trim() },
              }),
          },
        ]
      );
    }
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={{ backgroundColor: "white", flex: 1 }}>
        <View>
          <Image
            source={require("@/assets/images/Pizza.png")}
            style={{ height: 250 }}
          />

          <LinearGradient
            colors={["rgba(246,65,11,0.2)", "rgba(246,65,11,0.85)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradient}
          />

          <Text style={styles.topText}>Dunnies Bakes</Text>
        </View>

        <View style={styles.container}>
          <View style={{ flexDirection: "row", backgroundColor: "#EFEFEF", borderRadius: 30 }}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "Login" && styles.activeTab]}
              onPress={() => setActiveTab("Login")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Login" && styles.activeText,
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "Sign Up" && styles.activeTab]}
              onPress={() => setActiveTab("Sign Up")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "Sign Up" && styles.activeText,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "Login" ? (
            <>
              <TextInput
                placeholder="Email or Username"
                placeholderTextColor="#837D7A"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#837D7A"
                  secureTextEntry ={!showPassword}
                  style={styles.input2}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={{ marginTop: 15 }}>
                <Text
                  style={{
                    textAlign: "right",
                    color: "#837D7A",
                    fontFamily: "Poppins_400Regular",
                  }}
                >
                  Forget Password ?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#837D7A"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInput
                placeholder="Email"
                placeholderTextColor="#837D7A"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#837D7A"
                  secureTextEntry
                  style={styles.input2}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  placeholderTextColor="#837D7A"
                  secureTextEntry={!showConfirm}
                  style={[styles.input2, { paddingTop: 30 }]}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                />

                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons
                    name={showConfirm ? "eye-outline" : "eye-off-outline"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topText: {
    position: "absolute",
    bottom: 90,
    left: 80,
    fontFamily: "Sansita-Regular",
    fontSize: 40,
    fontWeight: "400",
    color: "#F5F5F5",
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  container: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 35,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    width: "90%",
    elevation: 2,
    marginTop: 50,
    marginHorizontal: 20,
  },
  activeTab: { backgroundColor: "#F6410B", borderRadius: 30 },
  tab: { flex: 1, padding: 12, alignItems: "center", zIndex: 1 },
  tabText: { fontWeight: "400", color: "#0A0909", fontFamily: "Poppins-Regular", fontSize: 18 },
  activeText: { color: "white" },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#AAA6A3",
    marginVertical: 15,
    marginTop: 30,
    paddingVertical: 8,
  },
  input2: { borderRadius: 10, paddingVertical: 15, fontSize: 16, flex: 1 },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 10,
    borderBottomColor: "#AAA6A3",
    borderBottomWidth: 1,
  },
  button: {
    backgroundColor: "#F6410B",
    marginTop: 30,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 100,
    width: 128,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
    fontWeight: "600",
    fontSize: 18,
  },
});

// import {
//   StatusBar,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   ActivityIndicator,
// } from "react-native";
// import { Image } from "expo-image";
// import { useState } from "react";
// import { router } from "expo-router";
// import { LinearGradient } from "expo-linear-gradient";
// import { Ionicons } from "@expo/vector-icons";
// import { createUser, loginUser } from "@/hooks/authstore";

// type TabType = "Login" | "Sign Up";

// export default function LoginScreen() {
//   const [activeTab, setActiveTab] = useState<TabType>("Login");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [fullName, setFullName] = useState("");
//   const [confirmPass, setConfirmPass] = useState("");
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!email.trim() || !password) {
//       Alert.alert("Missing fields", "Enter your email and password.");
//       return;
//     }
//     setLoading(true);
//     const result = await loginUser(email, password);
//     setLoading(false);
//     if ("error" in result) {
//       Alert.alert("Login failed", result.error);
//     } else {
//       router.replace("/(tabs)/home");
//     }
//   };

//   const handleSignUp = async () => {
//     if (!fullName.trim() || !email.trim() || !password || !confirmPass) {
//       Alert.alert("Missing fields", "Fill in all fields.");
//       return;
//     }
//     if (password !== confirmPass) {
//       Alert.alert("Password mismatch", "Passwords do not match.");
//       return;
//     }
//     if (password.length < 6) {
//       Alert.alert("Weak password", "Password must be at least 6 characters.");
//       return;
//     }
//     setLoading(true);
//     const result = await createUser(fullName, email, password);
//     setLoading(false);
//     if ("error" in result) {
//       Alert.alert("Sign up failed", result.error);
//     } else {
//       Alert.alert(
//         "Verify your email",
//         `Your verification code is: ${result.code}\n\n(In production this would be emailed to you.)`,
//         [
//           {
//             text: "Enter code",
//             onPress: () =>
//               router.push({
//                 pathname: "/auth/verification",
//                 params: { email: email.toLowerCase().trim() },
//               }),
//           },
//         ]
//       );
//     }
//   };

//   return (
//     <>
//       <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
//       <View style={{ backgroundColor: "white", flex: 1 }}>
//         <View>
//           <Image
//             source={require("@/assets/images/Pizza.png")}
//             style={{ height: 250 }}
//           />
//           <LinearGradient
//             colors={["rgba(246,65,11,0.2)", "rgba(246,65,11,0.85)"]}
//             start={{ x: 0.5, y: 0 }}
//             end={{ x: 0.5, y: 1 }}
//             style={styles.gradient}
//           />
//           <Text style={styles.topText}>Dunnies Bakes</Text>
//         </View>

//         <View style={styles.container}>
//           <View style={{ flexDirection: "row", backgroundColor: "#EFEFEF", borderRadius: 30 }}>
//             <TouchableOpacity
//               style={[styles.tab, activeTab === "Login" && styles.activeTab]}
//               onPress={() => setActiveTab("Login")}
//             >
//               <Text style={[styles.tabText, activeTab === "Login" && styles.activeText]}>
//                 Login
//               </Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.tab, activeTab === "Sign Up" && styles.activeTab]}
//               onPress={() => setActiveTab("Sign Up")}
//             >
//               <Text style={[styles.tabText, activeTab === "Sign Up" && styles.activeText]}>
//                 Sign Up
//               </Text>
//             </TouchableOpacity>
//           </View>

//           {activeTab === "Login" ? (
//             <>
//               <TextInput
//                 placeholder="Email"
//                 placeholderTextColor="#837D7A"
//                 style={styles.input}
//                 value={email}
//                 onChangeText={setEmail}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//               />
//               <View style={styles.passwordContainer}>
//                 <TextInput
//                   placeholder="Password"
//                   placeholderTextColor="#837D7A"
//                   secureTextEntry={!showPassword}
//                   style={styles.input2}
//                   value={password}
//                   onChangeText={setPassword}
//                 />
//                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//                   <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} />
//                 </TouchableOpacity>
//               </View>

//               <TouchableOpacity style={{ marginTop: 15 }}>
//                 <Text style={{ textAlign: "right", color: "#837D7A", fontFamily: "Poppins_400Regular" }}>
//                   Forgot password?
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//                 {loading ? (
//                   <ActivityIndicator color="white" />
//                 ) : (
//                   <Text style={styles.buttonText}>Login</Text>
//                 )}
//               </TouchableOpacity>
//             </>
//           ) : (
//             <>
//               <TextInput
//                 placeholder="Full name"
//                 placeholderTextColor="#837D7A"
//                 style={styles.input}
//                 value={fullName}
//                 onChangeText={setFullName}
//               />
//               <TextInput
//                 placeholder="Email"
//                 placeholderTextColor="#837D7A"
//                 style={styles.input}
//                 value={email}
//                 onChangeText={setEmail}
//                 autoCapitalize="none"
//                 keyboardType="email-address"
//               />
//               <View style={styles.passwordContainer}>
//                 <TextInput
//                   placeholder="Password"
//                   placeholderTextColor="#837D7A"
//                   secureTextEntry={!showPassword}
//                   style={styles.input2}
//                   value={password}
//                   onChangeText={setPassword}
//                 />
//                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
//                   <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} />
//                 </TouchableOpacity>
//               </View>
//               <View style={styles.passwordContainer}>
//                 <TextInput
//                   placeholder="Confirm password"
//                   placeholderTextColor="#837D7A"
//                   secureTextEntry={!showConfirm}
//                   style={[styles.input2, { paddingTop: 30 }]}
//                   value={confirmPass}
//                   onChangeText={setConfirmPass}
//                 />
//                 <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
//                   <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} />
//                 </TouchableOpacity>
//               </View>

//               <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
//                 {loading ? (
//                   <ActivityIndicator color="white" />
//                 ) : (
//                   <Text style={styles.buttonText}>Sign Up</Text>
//                 )}
//               </TouchableOpacity>
//             </>
//           )}
//         </View>
//       </View>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   topText: {
//     position: "absolute",
//     bottom: 90,
//     left: 80,
//     fontFamily: "Sansita-Regular",
//     fontSize: 40,
//     fontWeight: "400",
//     color: "#F5F5F5",
//   },
//   gradient: { ...StyleSheet.absoluteFillObject },
//   container: {
//     backgroundColor: "#fff",
//     padding: 25,
//     borderRadius: 35,
//     shadowColor: "#000",
//     shadowOpacity: 0.35,
//     shadowRadius: 10,
//     width: "90%",
//     elevation: 2,
//     marginTop: 50,
//     marginHorizontal: 20,
//   },
//   activeTab: { backgroundColor: "#F6410B", borderRadius: 30 },
//   tab: { flex: 1, padding: 12, alignItems: "center", zIndex: 1 },
//   tabText: { fontWeight: "400", color: "#0A0909", fontFamily: "Poppins-Regular", fontSize: 18 },
//   activeText: { color: "white" },
//   input: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#AAA6A3",
//     marginVertical: 15,
//     marginTop: 30,
//     paddingVertical: 8,
//   },
//   input2: { borderRadius: 10, paddingVertical: 15, fontSize: 16, flex: 1 },
//   passwordContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     gap: 8,
//     marginTop: 10,
//     borderBottomColor: "#AAA6A3",
//     borderBottomWidth: 1,
//   },
//   button: {
//     backgroundColor: "#F6410B",
//     marginTop: 30,
//     paddingHorizontal: 8,
//     paddingVertical: 16,
//     borderRadius: 100,
//     width: 128,
//     alignSelf: "center",
//   },
//   buttonText: {
//     color: "white",
//     textAlign: "center",
//     fontFamily: "Poppins_600SemiBold",
//     fontWeight: "600",
//     fontSize: 18,
//   },
// });