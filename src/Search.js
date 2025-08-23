// src/search.js
import { db } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const searchUsersByUsername = async (username) => {
  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('username', '>=', username), where('username', '<=', username + '\uf8ff'));
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error searching users by username:', error);
    throw error;
  }
};
