import  { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';
import { uploadFile } from '../../chat';

const PrivateChat = () => {
  const { id } = useParams(); // Chat ID from URL
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'chats', id, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push(doc.data());
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() !== '') {
      await addDoc(collection(db, 'chats', id, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        message: newMessage,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (file) {
      await uploadFile(file, currentUser, id);
      setFile(null);
    }
  };

  return (
    <div className='pt-64'>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderName}: </strong> {msg.message}
            {msg.type === 'image' && <img src={msg.url} alt={msg.name} />}
            {msg.type === 'file' && <a href={msg.url} download>{msg.name}</a>}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
      <form onSubmit={handleFileUpload}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit">Upload File</button>
      </form>
    </div>
  );
};

export default PrivateChat;
