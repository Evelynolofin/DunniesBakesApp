import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRecord = {
  fullName: string;
  email: string;
  passwordHash: string;
  verified: boolean;
  verifyCode: string;
};

const KEY = 'dunnies_users';

async function getAll(): Promise<Record<string, UserRecord>> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
}

async function saveAll(users: Record<string, UserRecord>) {
  await AsyncStorage.setItem(KEY, JSON.stringify(users));
}

export async function createUser(
  fullName: string,
  email: string,
  password: string
): Promise<{ code: string } | { error: string }> {
  const users = await getAll();
  const key = email.toLowerCase().trim();
  if (users[key]) return { error: 'An account with this email already exists.' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  users[key] = {
    fullName,
    email: key,
    passwordHash: password,
    verified: false,
    verifyCode: code,
  };
  await saveAll(users);
  return { code };
}

export async function verifyUser(
  email: string,
  code: string
): Promise<{ success: true } | { error: string }> {
  const users = await getAll();
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { error: 'Account not found.' };
  if (user.verified) return { success: true };
  if (user.verifyCode !== code.trim()) return { error: 'Incorrect code. Try again.' };
  users[key].verified = true;
  await saveAll(users);
  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: true; user: UserRecord } | { error: string }> {
  const users = await getAll();
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { error: 'No account found with that email.' };
  if (user.passwordHash !== password) return { error: 'Incorrect password.' };
  if (!user.verified) return { error: 'Account not verified. Check your email for the code.' };
  return { success: true, user };
}

export async function requestPasswordReset(
  email: string
): Promise<{ code: string } | { error: string }> {
  const users = await getAll();
  const key = email.toLowerCase().trim();
  if (!users[key]) return { error: 'No account found with that email.' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  users[key].verifyCode = code;
  await saveAll(users);
  return { code };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  const users = await getAll();
  const key = email.toLowerCase().trim();
  const user = users[key];
  if (!user) return { error: 'No account found with that email.' };
  if (user.verifyCode !== code.trim()) return { error: 'Incorrect code. Try again.' };
  if (newPassword.length < 6) return { error: 'Password must be at least 6 characters.' };
  users[key].passwordHash = newPassword;
  users[key].verifyCode = '';
  await saveAll(users);
  return { success: true };
}