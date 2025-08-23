import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export const getUserByEmail = async (email) => {
  try {
    const coll = collection(db, "users");
    const q = query(coll, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    console.log(userDocRef);
    await updateDoc(userDocRef, updatedData);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
