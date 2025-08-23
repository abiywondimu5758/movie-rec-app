// src/auth.js

import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";

export const doCreateUserWithEmailAndPassword = async (
  email,
  password,
  username,
  firstName,
  lastName,
  profilePicture,
  bio,
  contactInfo,
  socialMediaLinks
) => {
  try {
    // Check if the username already exists in Firestore
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      throw new Error(
        "Username is already taken. Please choose a different one."
      );
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userData = {
      username,
      role: "User",
      created_date: serverTimestamp(),
      account_status: "active",
      subscription_status: "free",
    };

    if (firstName !== undefined) userData.first_name = firstName;
    if (lastName !== undefined) userData.last_name = lastName;
    if (email !== undefined) userData.email = email;
    if (profilePicture !== undefined) userData.profile_picture = profilePicture;
    if (bio !== undefined) userData.bio = bio;
    if (contactInfo !== undefined) userData.contact_info = contactInfo;
    if (socialMediaLinks !== undefined)
      userData.social_media_links = socialMediaLinks;

    await setDoc(doc(db, "users", user.uid), userData);

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const doSignInWithEmailAndPassword = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
 
};

const checkUsernameExists = async (username) => {
  const usersCollection = collection(db, "users");
  const querySnapshot = await getDocs(
    query(usersCollection, where("username", "==", username))
  );
  return !querySnapshot.empty;
};




export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result;

  // add user to firestore
};

export const doSignOut = () => {
  return auth.signOut();
};

export const doPasswordReset = (email) => {
  return sendPasswordResetEmail(auth, email);
};

export const doPasswordChange = (password) => {
  return updatePassword(auth.currentUser, password);
};

export const doSendEmailVerification = () => {
  return sendEmailVerification(auth.currentUser, {
    url: `${window.location.origin}/home`,
  });
};
