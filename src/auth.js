import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from './firebaseClient';

export function subscribeToAuthState(onUser, onError) {
  return onAuthStateChanged(auth, onUser, onError);
}

export async function loginWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    const messages = {
      'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
      'auth/invalid-email': 'يرجى إدخال بريد إلكتروني صحيح.',
      'auth/too-many-requests': 'تم إيقاف المحاولات مؤقتاً. يرجى المحاولة لاحقاً.',
      'auth/network-request-failed': 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.',
      'auth/operation-not-allowed': 'تسجيل الدخول بالبريد الإلكتروني غير مفعّل في Firebase بعد.'
    };

    throw new Error(messages[error.code] || 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.');
  }
}

export function logoutFromFirebase() {
  return signOut(auth);
}
