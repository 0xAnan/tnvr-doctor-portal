import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const FIREBASE_APP_NAME = 'tnvr-cloud-db';

export const firebaseConfig = {
  apiKey: 'AIzaSyDuxHLYMx5u-xMRMNjCi3kBvcKsnaW4P7E',
  authDomain: 'tnvr-a60d6.firebaseapp.com',
  databaseURL: 'https://tnvr-a60d6-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'tnvr-a60d6',
  storageBucket: 'tnvr-a60d6.firebasestorage.app',
  messagingSenderId: '978346807644',
  appId: '1:978346807644:web:6a4ed86f2ab5c842e6b199'
};

export const firebaseApp = getApps().some(app => app.name === FIREBASE_APP_NAME)
  ? getApp(FIREBASE_APP_NAME)
  : initializeApp(firebaseConfig, FIREBASE_APP_NAME);

export const auth = getAuth(firebaseApp);
export const db = getDatabase(firebaseApp, firebaseConfig.databaseURL);
