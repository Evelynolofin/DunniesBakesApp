import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  Pressable,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { orderStore } from "@/constants/OrderStore";
import { cartStore } from "@/constants/Cartstore";
import { wishlistStore } from "@/constants/Wishliststore";
import {
  requestNotificationPermission,
  getNotificationPrefs,
  setNotificationPrefs,
  clearCurrentUserNotificationData,
} from "@/constants/Notificationservice";
import * as Notifications from "expo-notifications";

const ORANGE   = "#F6410B";
const BLACK    = "#1A1A1A";
const WHITE    = "#FFFFFF";
const LIGHT_BG = "#F5F5F5";
const BORDER   = "#EEEEEE";
const MUTED    = "#999999";
const SUCCESS  = "#22C55E";
const RED      = "#EF4444";

type UserProfile = {
  fullName:  string;
  email:     string;
  phone:     string;
  address:   string;
  city:      string;
  state:     string;
};

type Settings = {
  notifications:   boolean;
  orderUpdates:    boolean;
  promoEmails:     boolean;
  darkMode:        boolean;
  saveAddress:     boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function ModalField({
  label, value, onChange, placeholder, keyboardType, secureTextEntry, maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={mf.wrap}>
      <Text style={mf.label}>{label}</Text>
      <TextInput
        style={[mf.input, focused && mf.inputFocused]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ""}
        placeholderTextColor="#BBBBBB"
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function SettingToggle({
  icon, label, sub, value, onChange, iconBg, disabled,
}: {
  icon: string; label: string; sub?: string;
  value: boolean; onChange: (v: boolean) => void; iconBg: string;
  disabled?: boolean;
}) {
  return (
    <View style={[row.wrap, disabled && { opacity: 0.45 }]}>
      <View style={[row.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={WHITE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={row.label}>{label}</Text>
        {sub ? <Text style={row.sub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: BORDER, true: ORANGE }}
        thumbColor={WHITE}
        ios_backgroundColor={BORDER}
      />
    </View>
  );
}

function NavRow({
  icon, label, sub, iconBg, onPress, destructive, rightLabel,
}: {
  icon: string; label: string; sub?: string; iconBg: string;
  onPress: () => void; destructive?: boolean; rightLabel?: string;
}) {
  return (
    <TouchableOpacity style={row.wrap} onPress={onPress} activeOpacity={0.7}>
      <View style={[row.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={18} color={WHITE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[row.label, destructive && { color: RED }]}>{label}</Text>
        {sub ? <Text style={row.sub}>{sub}</Text> : null}
      </View>
      {rightLabel ? (
        <Text style={row.rightLabel}>{rightLabel}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={BORDER} />
      )}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sec.wrap}>
      <Text style={sec.title}>{title}</Text>
      <View style={sec.card}>{children}</View>
    </View>
  );
}

function EditProfileModal({
  visible, profile, onSave, onClose,
}: {
  visible: boolean;
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<UserProfile>(profile);

  useEffect(() => {
    if (visible) setForm(profile);
  }, [visible]);

  function setF(key: keyof UserProfile, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  function save() {
    if (!form.fullName.trim()) {
      Alert.alert("Required", "Full name cannot be empty.");
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 11) {
      Alert.alert("Invalid", "Enter a valid 11-digit phone number.");
      return;
    }
    onSave(form);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={modal.backdrop} onPress={onClose} />
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.headerRow}>
            <Text style={modal.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={MUTED} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <ModalField label="Full Name" value={form.fullName} onChange={(v) => setF("fullName", v)} placeholder="Your full name" />
            <ModalField label="Phone Number" value={form.phone} onChange={(v) => setF("phone", v.replace(/[^\d+\s-]/g, ""))} placeholder="080xxxxxxxx" keyboardType="phone-pad" maxLength={14} />
            <ModalField label="Email Address" value={form.email} onChange={(v) => setF("email", v)} placeholder="you@example.com" keyboardType="email-address" />
            <ModalField label="Delivery Address" value={form.address} onChange={(v) => setF("address", v)} placeholder="Street address" />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <ModalField label="City" value={form.city} onChange={(v) => setF("city", v)} placeholder="Jos" />
              </View>
              <View style={{ flex: 1 }}>
                <ModalField label="State" value={form.state} onChange={(v) => setF("state", v)} placeholder="Plateau" />
              </View>
            </View>
            <TouchableOpacity style={modal.saveBtn} onPress={save}>
              <Text style={modal.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChangePasswordModal({
  visible, email, onClose,
}: {
  visible: boolean; email: string; onClose: () => void;
}) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrent(""); setNext(""); setConfirm("");
      setError(""); setSuccess(false);
    }
  }, [visible]);

  async function changePassword() {
    setError("");
    if (!current.trim())  { setError("Enter your current password.");   return; }
    if (next.length < 6)  { setError("New password must be 6+ chars."); return; }
    if (next !== confirm)  { setError("Passwords don't match.");          return; }

    try {
        const raw = await AsyncStorage.getItem("dunnies_users");
        const users = raw ? JSON.parse(raw) : {};
        const key = email.toLowerCase().trim();
        const user = users[key];

        if (!user) {
        setError("Account not found.");
        return;
        }
        if (user.passwordHash !== current) {
        setError("Current password is incorrect.");
        return;
        }

        users[key].passwordHash = next;
        await AsyncStorage.setItem("dunnies_users", JSON.stringify(users));
        setSuccess(true);
    } catch {
        setError("Something went wrong. Try again.");
    }
    }

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={modal.backdrop} onPress={onClose} />
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.headerRow}>
            <Text style={modal.title}>Change Password</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={MUTED} />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={modal.successWrap}>
              <View style={modal.successIcon}>
                <Ionicons name="checkmark" size={32} color={WHITE} />
              </View>
              <Text style={modal.successTitle}>Password Updated</Text>
              <Text style={modal.successSub}>Your password has been changed successfully.</Text>
              <TouchableOpacity style={modal.saveBtn} onPress={onClose}>
                <Text style={modal.saveBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {error ? (
                <View style={modal.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={RED} />
                  <Text style={modal.errorText}>{error}</Text>
                </View>
              ) : null}
              <ModalField label="Current Password" value={current} onChange={setCurrent} placeholder="••••••••" secureTextEntry />
              <ModalField label="New Password" value={next} onChange={setNext} placeholder="Min. 6 characters" secureTextEntry />
              <ModalField label="Confirm New Password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" secureTextEntry />
              <TouchableOpacity style={modal.saveBtn} onPress={changePassword}>
                <Text style={modal.saveBtnText}>Update Password</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DeleteAccountModal({
  visible, email, onConfirm, onClose,
}: {
  visible: boolean; email: string; onConfirm: () => void; onClose: () => void;
}) {
  const [input, setInput] = useState("");

  useEffect(() => { if (visible) setInput(""); }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={del.backdrop}>
        <View style={del.card}>
          <View style={del.iconWrap}>
            <Ionicons name="warning" size={28} color={RED} />
          </View>
          <Text style={del.title}>Delete Account</Text>
          <Text style={del.body}>
            This will permanently delete your account and all your order history. This cannot be undone.
          </Text>
          <Text style={del.prompt}>Type <Text style={{ fontWeight: "700", color: RED }}>DELETE</Text> to confirm</Text>
          <TextInput
            style={del.input}
            value={input}
            onChangeText={setInput}
            placeholder="DELETE"
            placeholderTextColor="#BBBBBB"
            autoCapitalize="characters"
          />
          <View style={del.btnRow}>
            <TouchableOpacity style={del.cancelBtn} onPress={onClose}>
              <Text style={del.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[del.deleteBtn, input !== "DELETE" && del.deleteBtnDisabled]}
              onPress={() => input === "DELETE" && onConfirm()}
            >
              <Text style={del.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "", email: "", phone: "", address: "", city: "", state: "",
  });
  const [settings, setSettings] = useState<Settings>({
    notifications: true, orderUpdates: true,
    promoEmails: false, darkMode: false, saveAddress: true,
  });
  const [orderCount,    setOrderCount]    = useState(0);
  const [editVisible,   setEditVisible]   = useState(false);
  const [pwVisible,     setPwVisible]     = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const email    = (await AsyncStorage.getItem("currentUserEmail"))   ?? "";
      const fullName = (await AsyncStorage.getItem(`fullName_${email}`))  ?? "";
      const phone    = (await AsyncStorage.getItem(`phone_${email}`))     ?? "";
      const address  = (await AsyncStorage.getItem(`address_${email}`))   ?? "";
      const city     = (await AsyncStorage.getItem(`city_${email}`))      ?? "";
      const state    = (await AsyncStorage.getItem(`state_${email}`))     ?? "";

      setProfile({ fullName, email, phone, address, city, state });
    } catch (e) {
      console.error("loadProfile failed", e);
    }
  }, []);

  const loadNotificationSettings = useCallback(async () => {
    try {
      const prefs = await getNotificationPrefs();
      const { status } = await Notifications.getPermissionsAsync();
      const osGranted = status === "granted";

      const effectiveNotifications = prefs.notifications && osGranted;

      setSettings((prev) => ({
        ...prev,
        notifications: effectiveNotifications,
        orderUpdates:  prefs.orderUpdates,
      }));
    } catch {}
  }, []);

  const loadOrderCount = useCallback(async () => {
    const orders = await orderStore.getAll();
    setOrderCount(orders.length);
  }, []);

  useEffect(() => {
    loadProfile();
    loadOrderCount();
    loadNotificationSettings();
    orderStore.addListener(loadOrderCount);
    return () => orderStore.removeListener(loadOrderCount);
  }, []);

  async function saveProfile(updated: UserProfile) {
    try {
      const { email, fullName, phone, address, city, state } = updated;
      await AsyncStorage.setItem(`fullName_${email}`, fullName);
      await AsyncStorage.setItem(`phone_${email}`,    phone);
      await AsyncStorage.setItem(`address_${email}`,  address);
      await AsyncStorage.setItem(`city_${email}`,     city);
      await AsyncStorage.setItem(`state_${email}`,    state);
      setProfile(updated);
      setEditVisible(false);
    } catch (e) {
      Alert.alert("Error", "Could not save changes. Try again.");
    }
  }

  async function handleToggleNotifications(val: boolean) {
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setSettings((prev) => ({ ...prev, notifications: false }));
        Alert.alert(
          "Notifications Disabled",
          "Enable notifications for Dunnies Kitchen in your phone's Settings app to receive order updates.",
          [
            { text: "Not Now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const updated = await setNotificationPrefs({ notifications: true });
      setSettings((prev) => ({ ...prev, notifications: true, orderUpdates: updated.orderUpdates }));
    } else {
      await setNotificationPrefs({ notifications: false });
      setSettings((prev) => ({ ...prev, notifications: false }));
    }
  }

  async function handleToggleOrderUpdates(val: boolean) {
    await setNotificationPrefs({ orderUpdates: val });
    setSettings((prev) => ({ ...prev, orderUpdates: val }));
  }

  async function toggleSetting(key: "promoEmails" | "darkMode" | "saveAddress", val: boolean) {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(`settings_${profile.email}`, JSON.stringify(updated));
    } catch {}
  }

  function logout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          cartStore.resetInMemory();
          wishlistStore.resetInMemory();
          await AsyncStorage.removeItem("currentUserEmail");
          router.replace("/auth/login" as any);
        },
      },
    ]);
  }

  async function deleteAccount() {
    try {
        const { email } = profile;
        const key = email.toLowerCase().trim();

        const raw = await AsyncStorage.getItem("dunnies_users");
        if (raw) {
        const users = JSON.parse(raw);
        delete users[key];
        await AsyncStorage.setItem("dunnies_users", JSON.stringify(users));
        }

        await clearCurrentUserNotificationData();
        await cartStore.clearForCurrentUser();

        await AsyncStorage.multiRemove([
        "currentUserEmail",
        `fullName_${email}`,
        `phone_${email}`,
        `address_${email}`,
        `city_${email}`,
        `state_${email}`,
        `password_${email}`,
        `settings_${email}`,
        ]);

        await orderStore.clear();
        setDeleteVisible(false);
        router.replace("/auth/login" as any);
    } catch {
        Alert.alert("Error", "Could not delete account. Try again.");
    }
    }

  const avatarLabel = initials(profile.fullName) || "?";

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        <View style={styles.avatarCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarLabel}</Text>
            </View>
          </View>
          <Text style={styles.userName}>
            {profile.fullName || "Set your name"}
          </Text>
          <Text style={styles.userEmail}>{profile.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{orderCount}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {profile.city || "—"}
              </Text>
              <Text style={styles.statLabel}>City</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {profile.phone ? "✓" : "—"}
              </Text>
              <Text style={styles.statLabel}>Phone</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={15} color={ORANGE} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <Section title="Personal Info">
          <InfoRow icon="person-outline"   label="Full Name"    value={profile.fullName || "Not set"} />
          <InfoRow icon="call-outline"     label="Phone"        value={profile.phone    || "Not set"} />
          <InfoRow icon="mail-outline"     label="Email"        value={profile.email    || "Not set"} last />
        </Section>

        <Section title="Saved Address">
          <InfoRow icon="location-outline" label="Street"       value={profile.address || "Not set"} />
          <InfoRow icon="business-outline" label="City / State"
            value={
              profile.city && profile.state
                ? `${profile.city}, ${profile.state}`
                : profile.city || profile.state || "Not set"
            }
            last
          />
        </Section>

        <Section title="Account & Security">
          <NavRow
            icon="lock-closed-outline" label="Change Password"
            sub="Update your login password"
            iconBg="#3B82F6"
            onPress={() => setPwVisible(true)}
          />
          <NavRow
            icon="receipt-outline" label="Order History"
            sub={`${orderCount} order${orderCount !== 1 ? "s" : ""} placed`}
            iconBg={ORANGE}
            onPress={() => router.push("/(tabs)/order" as any)}
          />
          <NavRow
            icon="shield-checkmark-outline" label="Privacy Policy"
            sub="How we handle your data"
            iconBg="#8B5CF6"
            onPress={() => Alert.alert("Privacy Policy", "Coming soon.")}
          />
        </Section>

        <Section title="Notifications">
          <SettingToggle
            icon="notifications-outline" label="Push Notifications"
            sub="Order confirmations and alerts"
            iconBg={ORANGE} value={settings.notifications}
            onChange={handleToggleNotifications}
          />
          <SettingToggle
            icon="bicycle-outline" label="Order Updates"
            sub={
              settings.notifications
                ? "Live status as your order moves"
                : "Enable push notifications first"
            }
            iconBg="#22C55E" value={settings.orderUpdates}
            onChange={handleToggleOrderUpdates}
            disabled={!settings.notifications}
          />
          <SettingToggle
            icon="pricetag-outline" label="Promotions & Offers"
            sub="Deals, discounts, new items"
            iconBg="#F59E0B" value={settings.promoEmails}
            onChange={(v) => toggleSetting("promoEmails", v)}
          />
        </Section>

        <Section title="Preferences">
          <SettingToggle
            icon="location-outline" label="Remember Delivery Address"
            sub="Auto-fill at checkout"
            iconBg="#3B82F6" value={settings.saveAddress}
            onChange={(v) => toggleSetting("saveAddress", v)}
          />
        </Section>

        <Section title="Support">
          <NavRow
            icon="chatbubble-ellipses-outline" label="Contact Us"
            sub="Chat, call or email support"
            iconBg="#0EA5E9"
            onPress={() => Alert.alert("Contact Us", "support@chopchop.ng\n+234 800 000 0000")}
          />
          <NavRow
            icon="star-outline" label="Rate the App"
            sub="Enjoying Dunnies Kitchen? Let us know"
            iconBg="#F59E0B"
            onPress={() => Alert.alert("Rate App", "Thank you! This would open the app store.")}
          />
          <NavRow
            icon="information-circle-outline" label="App Version"
            sub="Dunnies Kitchen v1.0.0"
            iconBg={MUTED}
            onPress={() => {}}
            rightLabel="1.0.0"
          />
        </Section>

        <Section title="Account Actions">
          <NavRow
            icon="log-out-outline" label="Log Out"
            iconBg="#6B7280"
            onPress={logout}
          />
          <NavRow
            icon="trash-outline" label="Delete Account"
            sub="Permanently remove your account"
            iconBg={RED}
            onPress={() => setDeleteVisible(true)}
            destructive
          />
        </Section>

      </ScrollView>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onSave={saveProfile}
        onClose={() => setEditVisible(false)}
      />
      <ChangePasswordModal
        visible={pwVisible}
        email={profile.email}
        onClose={() => setPwVisible(false)}
      />
      <DeleteAccountModal
        visible={deleteVisible}
        email={profile.email}
        onConfirm={deleteAccount}
        onClose={() => setDeleteVisible(false)}
      />
    </View>
  );
}

function InfoRow({
  icon, label, value, last,
}: {
  icon: string; label: string; value: string; last?: boolean;
}) {
  return (
    <View style={[row.wrap, last && { borderBottomWidth: 0 }]}>
      <View style={[row.iconBox, { backgroundColor: LIGHT_BG }]}>
        <Ionicons name={icon as any} size={18} color={ORANGE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={row.sub}>{label}</Text>
        <Text style={row.label} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) + 8 : 54,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: BLACK },

  avatarCard: {
    backgroundColor: WHITE,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: ORANGE,
    padding: 3, marginBottom: 14,
  },
  avatar: {
    flex: 1, borderRadius: 40,
    backgroundColor: "#FFF0ED",
    alignItems: "center", justifyContent: "center",
  },
  avatarText:  { fontSize: 28, fontWeight: "800", color: ORANGE },
  userName:    { fontSize: 20, fontWeight: "800", color: BLACK, marginBottom: 4 },
  userEmail:   { fontSize: 13, color: MUTED, marginBottom: 18 },

  statsRow:     { flexDirection: "row", alignItems: "center", marginBottom: 18, gap: 0 },
  statItem:     { flex: 1, alignItems: "center" },
  statNum:      { fontSize: 16, fontWeight: "800", color: BLACK },
  statLabel:    { fontSize: 11, color: MUTED, marginTop: 2 },
  statDivider:  { width: 1, height: 32, backgroundColor: BORDER },

  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: ORANGE,
  },
  editProfileText: { fontSize: 14, fontWeight: "700", color: ORANGE },
});

const sec = StyleSheet.create({
  wrap:  { marginHorizontal: 16, marginTop: 20 },
  title: { fontSize: 11, fontWeight: "700", color: MUTED, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  card:  {
    backgroundColor: WHITE, borderRadius: 20,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
});

const row = StyleSheet.create({
  wrap: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  iconBox:   { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label:     { fontSize: 14, fontWeight: "600", color: BLACK },
  sub:       { fontSize: 12, color: MUTED, marginTop: 1 },
  rightLabel:{ fontSize: 13, color: MUTED, fontWeight: "600" },
});

const mf = StyleSheet.create({
  wrap:         { marginBottom: 14 },
  label:        { fontSize: 12, fontWeight: "600", color: BLACK, marginBottom: 6 },
  input:        { backgroundColor: LIGHT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: BLACK, borderWidth: 1.5, borderColor: BORDER },
  inputFocused: { borderColor: ORANGE },
});

const modal = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: "88%",
  },
  handle:      { width: 40, height: 4, backgroundColor: BORDER, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  headerRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title:       { fontSize: 18, fontWeight: "800", color: BLACK },
  saveBtn:     { backgroundColor: ORANGE, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: WHITE, fontSize: 16, fontWeight: "700" },
  errorBox:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 14 },
  errorText:   { fontSize: 13, color: RED, flex: 1 },
  successWrap: { alignItems: "center", paddingVertical: 24, gap: 12 },
  successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: SUCCESS, alignItems: "center", justifyContent: "center" },
  successTitle:{ fontSize: 20, fontWeight: "800", color: BLACK },
  successSub:  { fontSize: 14, color: MUTED, textAlign: "center" },
});

const del = StyleSheet.create({
  backdrop:         { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 24 },
  card:             { backgroundColor: WHITE, borderRadius: 24, padding: 28, width: "100%", alignItems: "center" },
  iconWrap:         { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title:            { fontSize: 20, fontWeight: "800", color: BLACK, marginBottom: 8 },
  body:             { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20, marginBottom: 16 },
  prompt:           { fontSize: 13, color: BLACK, marginBottom: 10 },
  input:            { width: "100%", backgroundColor: LIGHT_BG, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: "700", borderWidth: 1.5, borderColor: BORDER, textAlign: "center", marginBottom: 20 },
  btnRow:           { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn:        { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, alignItems: "center" },
  cancelText:       { fontSize: 15, fontWeight: "600", color: BLACK },
  deleteBtn:        { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: RED, alignItems: "center" },
  deleteBtnDisabled:{ opacity: 0.4 },
  deleteText:       { fontSize: 15, fontWeight: "700", color: WHITE },
});