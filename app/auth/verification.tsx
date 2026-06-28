import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { verifyUser, resendCode } from "@/hooks/authstore";

const RESEND_COOLDOWN = 60;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = () => {
    setCanResend(false);
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      const result = await resendCode(email);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
      startCountdown();

      if ("error" in result) {
        Alert.alert("Failed to resend", result.error);
      } else {
        Alert.alert(
          "New code sent",
          `Your verification code is:\n\n${result.code}`,
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      Alert.alert("Failed to resend", "Please try again.");
    } finally {
      setResending(false);
    }
  };

  const updateDigit = (val: string, idx: number) => {
    const cleaned = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[idx] = cleaned;
    setDigits(next);
    if (cleaned && idx < 5) {
      inputs.current[idx + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length < 6) {
      Alert.alert("Incomplete code", "Enter all 6 digits.");
      return;
    }
    setLoading(true);
    const result = await verifyUser(email, code);
    setLoading(false);
    if ("error" in result) {
      Alert.alert("Verification failed", result.error);
      setDigits(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } else {
      router.replace("/(tabs)/home");
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.screen}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="#0A0909" />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="mail-outline" size={48} color="#F6410B" />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.sub}>
          Enter the 6-digit code sent to{"\n"}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputs.current[i] = r; }}
              style={[styles.digitBox, d ? styles.digitBoxFilled : null]}
              value={d}
              onChangeText={(v) => updateDigit(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendWrap}>
          <Text style={styles.resendLabel}>Didn't receive a code?</Text>

          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
              {resending ? (
                <ActivityIndicator color="#F6410B" size="small" />
              ) : (
                <Text style={styles.resendActive}>Resend code</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownWrap}>
              <Ionicons name="time-outline" size={14} color="#837D7A" />
              <Text style={styles.countdownText}>
                Resend in <Text style={styles.countdownNum}>{countdown}s</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: 28,
    paddingTop: 60,
    alignItems: "center",
  },
  back: {
    position: "absolute",
    top: 55,
    left: 20,
    padding: 8,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFF0EB",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins-Bold",
    fontWeight: "700",
    color: "#0A0909",
    marginBottom: 10,
  },
  sub: {
    fontSize: 15,
    color: "#837D7A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 36,
    fontFamily: "Poppins-Regular",
  },
  emailText: {
    color: "#0A0909",
    fontFamily: "Poppins-Bold",
    fontWeight: "600",
  },
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 36,
  },
  digitBox: {
    width: 46,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#D0CBC8",
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: "#0A0909",
    backgroundColor: "#FAFAFA",
  },
  digitBoxFilled: {
    borderColor: "#F6410B",
    backgroundColor: "#FFF5F2",
  },
  button: {
    backgroundColor: "#F6410B",
    paddingVertical: 16,
    borderRadius: 100,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontFamily: "Poppins_600SemiBold",
    fontWeight: "600",
    fontSize: 18,
  },

  resendWrap: {
    marginTop: 28,
    alignItems: "center",
    gap: 10,
  },
  resendLabel: {
    fontSize: 13,
    color: "#837D7A",
    fontFamily: "Poppins-Regular",
  },
  resendBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: "#F6410B",
    minWidth: 120,
    alignItems: "center",
  },
  resendActive: {
    color: "#F6410B",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Poppins-Bold",
  },
  countdownWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 100,
  },
  countdownText: {
    fontSize: 13,
    color: "#837D7A",
    fontFamily: "Poppins-Regular",
  },
  countdownNum: {
    color: "#0A0909",
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
  },
});