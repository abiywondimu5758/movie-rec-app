import { storage,db } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export const uploadFile = async (file, currentUser, chatId) => {
  const storageRef = ref(storage, `chat_files/${chatId}/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
    },
    (error) => {
      console.error('File upload error: ', error);
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: downloadURL,
        name: file.name,
        timestamp: serverTimestamp(),
      });
    }
  );
};
