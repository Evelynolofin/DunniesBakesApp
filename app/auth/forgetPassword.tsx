import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState, useRef } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { requestPasswordReset, resetPassword } from "@/hooks/authstore";

const ORANGE = "#F6410B";

type Step = "email" | "otp" | "newPassword";

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState("");

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleRequestOtp = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    setLoading(true);
    const result = await requestPasswordReset(email);
    setLoading(false);
    if ("error" in result) {
      Alert.alert("Error", result.error);
    } else {
      setDevCode(result.code); 
      Alert.alert(
        "Code sent",
        `Your reset code is: ${result.code}\n\n(In production this would be emailed to you.)`,
        [{ text: "OK", onPress: () => setStep("otp") }]
      );
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Incomplete code", "Please enter all 6 digits.");
      return;
    }
    setStep("newPassword");
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otp.join(""), newPassword);
    setLoading(false);

    if ("error" in result) {
      Alert.alert("Error", result.error);
      if (result.error.includes("Incorrect")) setStep("otp");
    } else {
      Alert.alert("Success!", "Your password has been reset. Please log in.", [
        { text: "Log in", onPress: () => router.replace("/auth/login") },
      ]);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
      setOtp(newOtp);
      otpRefs.current[Math.min(digits.length, 5)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, "");
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.back} onPress={() => {
          if (step === "email") router.back();
          else if (step === "otp") setStep("email");
          else setStep("otp");
        }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.stepRow}>
          {(["email", "otp", "newPassword"] as Step[]).map((s, i) => (
            <View key={s} style={styles.stepWrap}>
              <View style={[styles.stepDot, step === s || getStepIndex(step) > i ? styles.stepDotActive : {}]}>
                {getStepIndex(step) > i
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={[styles.stepNum, step === s && { color: "#fff" }]}>{i + 1}</Text>
                }
              </View>
              {i < 2 && <View style={[styles.stepLine, getStepIndex(step) > i && styles.stepLineActive]} />}
            </View>
          ))}
        </View>

        {step === "email" && (
          <>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter the email address linked to your account and we'll send you a reset code.
            </Text>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#BBB"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />

            <TouchableOpacity style={styles.btn} onPress={handleRequestOtp} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Send Reset Code</Text>
              }
            </TouchableOpacity>
          </>
        )}

        {step === "otp" && (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{" "}
              <Text style={{ color: ORANGE, fontWeight: "600" }}>{email}</Text>.
              Enter it below.
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : {}]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={6} 
                  selectTextOnFocus
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.resend}
              onPress={async () => {
                setLoading(true);
                const result = await requestPasswordReset(email);
                setLoading(false);
                if ("code" in result) {
                  setOtp(["", "", "", "", "", ""]);
                  Alert.alert("Code resent", `New code: ${result.code}`);
                }
              }}
            >
              <Text style={styles.resendText}>Didn't receive it? <Text style={{ color: ORANGE }}>Resend</Text></Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp}>
              <Text style={styles.btnText}>Verify Code</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "newPassword" && (
          <>
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password you haven't used before.
            </Text>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="At least 6 characters"
                placeholderTextColor="#BBB"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 20 }]}>Confirm Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repeat your password"
                placeholderTextColor="#BBB"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.strengthRow}>
              {[1, 2, 3].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.strengthBar,
                    newPassword.length >= level * 3 && {
                      backgroundColor: level === 1 ? "#F6410B" : level === 2 ? "#F5A623" : "#4CAF50",
                    },
                  ]}
                />
              ))}
              <Text style={styles.strengthLabel}>
                {newPassword.length === 0 ? "" : newPassword.length < 4 ? "Weak" : newPassword.length < 7 ? "Fair" : "Strong"}
              </Text>
            </View>

            <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Reset Password</Text>
              }
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function getStepIndex(step: Step) {
  return ["email", "otp", "newPassword"].indexOf(step);
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60, backgroundColor: "#fff" },

  back: { marginBottom: 24 },

  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  stepWrap: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#EFEFEF",
    alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: ORANGE },
  stepNum: { fontSize: 13, fontWeight: "700", color: "#AAA" },
  stepLine: { width: 40, height: 2, backgroundColor: "#EFEFEF", marginHorizontal: 4 },
  stepLineActive: { backgroundColor: ORANGE },

  title: { fontSize: 26, fontWeight: "700", color: "#1A1A1A", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#837D7A", lineHeight: 22, marginBottom: 32 },

  label: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", marginBottom: 8 },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: "#DDD",
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 32,
  },

  btn: {
    backgroundColor: ORANGE,
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
    marginTop: 12,
  },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  otpBox: {
    width: 48, height: 56, borderRadius: 14,
    borderWidth: 1.5, borderColor: "#DDD",
    fontSize: 22, fontWeight: "700", color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  otpBoxFilled: { borderColor: ORANGE, backgroundColor: "#FFF4F1" },

  resend: { alignItems: "center", marginBottom: 24 },
  resendText: { fontSize: 14, color: "#837D7A" },

  passwordRow: {
    flexDirection: "row", alignItems: "center",
    borderBottomWidth: 1.5, borderBottomColor: "#DDD",
    paddingVertical: 10, gap: 8,
  },
  passwordInput: { flex: 1, fontSize: 16, color: "#1A1A1A" },

  strengthRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 32 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#EEE" },
  strengthLabel: { fontSize: 12, color: "#999", width: 45 },
});