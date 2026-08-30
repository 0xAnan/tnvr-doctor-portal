import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from './firebaseClient.js';

const LOGIN_EMAIL_DOMAIN = 'tnvr.local';

export function resolveLoginIdentifier(identifier) {
  const normalized = String(identifier || '').trim().toLocaleLowerCase('en-US');
  return normalized.includes('@') ? normalized : `${normalized}@${LOGIN_EMAIL_DOMAIN}`;
}

export function subscribeToAuthState(onUser, onError) {
  return onAuthStateChanged(auth, onUser, onError);
}

export async function loginWithIdentifier(identifier, password) {
  try {
    const email = resolveLoginIdentifier(identifier);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    const messages = {
      'auth/invalid-credential': 'اسم المستخدم أو كلمة المرور غير صحيحة.',
      'auth/invalid-email': 'يرجى إدخال اسم مستخدم صحيح.',
      'auth/too-many-requests': 'تم إيقاف المحاولات مؤقتاً. يرجى المحاولة لاحقاً.',
      'auth/network-request-failed': 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.',
      'auth/operation-not-allowed': 'تسجيل الدخول غير مفعّل في Firebase بعد.'
    };

    throw new Error(messages[error.code] || 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.');
  }
}

export function logoutFromFirebase() {
  return signOut(auth);
}
