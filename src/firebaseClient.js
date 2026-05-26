import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBVPRD-9jHR0NRzg61Cs2KXfwoqvlHz388",
  authDomain: "auth.m4spider.com",
  projectId: "m4-spider-84ed4",
  storageBucket: "m4-spider-84ed4.firebasestorage.app",
  messagingSenderId: "97506528297",
  appId: "1:97506528297:web:c589b305d28e211e09e038",
  measurementId: "G-9RH53ZEE2D"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');
githubProvider.addScope('repo');
githubProvider.addScope('read:org');
githubProvider.addScope('workflow');
githubProvider.setCustomParameters({ allow_signup: 'true' });
