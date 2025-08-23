import  { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';

const GlobalChat = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'chats', 'global', 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push(doc.data());
      });
      setMessages(messages);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'chats', 'global', 'messages'), {
      senderId: currentUser.uid,
      senderName: currentUser.displayName || currentUser.email,
      message: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage('');
  };

  return (
    <div className='pt-64'>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.senderName}: </strong> {msg.message}
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
    </div>
  );
};

export default GlobalChat;
