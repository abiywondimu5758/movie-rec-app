import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  Send, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  ArrowLeft,
  MoreVertical,
  UserX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

const PrivateChat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat info and other user details
  useEffect(() => {
    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', id));
        if (!chatDoc.exists()) {
          toast({
            title: "Chat Not Found",
            description: "This chat no longer exists.",
            variant: "destructive",
          });
          navigate('/chat');
          return;
        }

        const chatData = chatDoc.data();
        setChatInfo(chatData);

        // Get other user's details
        const otherUserId = chatData.members.find(member => member !== currentUser.uid);
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setOtherUser({
              id: otherUserId,
              name: userData.first_name && userData.last_name 
                ? `${userData.first_name} ${userData.last_name}`.trim()
                : userData.first_name || userData.username || userData.email,
              email: userData.email,
              photoURL: userData.profile_picture
            });
          }
        }
      } catch (error) {
        console.error('Error fetching chat info:', error);
      }
    };

    if (currentUser?.uid && id) {
      fetchChatInfo();
    }
  }, [id, currentUser?.uid, navigate, toast]);

  // Listen to messages
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, 'chats', id, 'messages'), 
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const messages = [];
      
      // Get hidden messages for current user
      const chatDoc = await getDoc(doc(db, 'chats', id));
      const chatData = chatDoc.data();
      const hiddenMessages = chatData?.hiddenMessages?.[currentUser.uid] || [];
      
      querySnapshot.forEach((doc) => {
        const messageData = { id: doc.id, ...doc.data() };
        
        // Skip messages that are hidden for current user
        if (!hiddenMessages.includes(doc.id)) {
          messages.push(messageData);
        }
      });
      
      setMessages(messages);
      
      // Mark messages as read when user is in the chat
      if (messages.length > 0) {
        markMessagesAsRead();
      }
    });

    return () => unsubscribe();
  }, [id, currentUser.uid]);

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      const chatRef = doc(db, 'chats', id);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      
      const unreadMessages = chatData?.unreadMessages || {};
      if (unreadMessages[currentUser.uid]) {
        delete unreadMessages[currentUser.uid];
        await updateDoc(chatRef, { unreadMessages });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    try {
      // Send the message
      await addDoc(collection(db, 'chats', id, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        message: newMessage,
        timestamp: serverTimestamp(),
        edited: false,
        deleted: false,
        deletedBy: null,
        deletedAt: null
      });

      // Update unread count for the other user
      const chatRef = doc(db, 'chats', id);
      const chatDoc = await getDoc(chatRef);
      const chatData = chatDoc.data();
      
      const unreadMessages = chatData?.unreadMessages || {};
      const otherUserId = chatData.members.find(member => member !== currentUser.uid);
      
      if (otherUserId) {
        unreadMessages[otherUserId] = (unreadMessages[otherUserId] || 0) + 1;
        await updateDoc(chatRef, { unreadMessages });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const editMessage = async (messageId, newText) => {
    if (newText.trim() === '') return;

    try {
      const messageRef = doc(db, 'chats', id, 'messages', messageId);
      await updateDoc(messageRef, {
        message: newText,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessage(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
      toast({
        title: "Error",
        description: "Failed to edit message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId, deleteForEveryone = false) => {
    try {
      const messageRef = doc(db, 'chats', id, 'messages', messageId);
      
      if (deleteForEveryone) {
        // Delete for everyone - mark as deleted for both users
        await updateDoc(messageRef, {
          message: 'This message was deleted',
          deleted: true,
          deletedBy: currentUser.uid,
          deletedAt: serverTimestamp(),
          deletedForEveryone: true
        });
        
        toast({
          title: "Message Deleted",
          description: "Message has been deleted for everyone.",
          variant: "default",
        });
      } else {
        // Remove only for current user - add to hiddenMessages array
        const chatRef = doc(db, 'chats', id);
        const chatDoc = await getDoc(chatRef);
        const chatData = chatDoc.data();
        
        const hiddenMessages = chatData.hiddenMessages || {};
        hiddenMessages[currentUser.uid] = hiddenMessages[currentUser.uid] || [];
        hiddenMessages[currentUser.uid].push(messageId);
        
        await updateDoc(chatRef, { hiddenMessages });
        
        // Update local messages state to hide the message immediately
        setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
        
        toast({
          title: "Message Deleted",
          description: "Message has been deleted for you.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteChat = async (deleteForEveryone = false) => {
    setIsDeletingChat(true);
    try {
      if (deleteForEveryone) {
        // Delete for everyone - mark chat as deleted for both users
        await updateDoc(doc(db, 'chats', id), {
          deleted: true,
          deletedBy: currentUser.uid,
          deletedAt: serverTimestamp(),
          deletedForEveryone: true
        });
        
        // Send notification to other user
        if (otherUser) {
          try {
            const notificationData = {
              userId: otherUser.id,
              type: 'chat_deleted',
              title: 'Chat Deleted',
              message: `${currentUser.displayName || currentUser.email} deleted your private chat`,
              timestamp: serverTimestamp(),
              read: false
            };
            
            console.log('Sending chat deletion notification:', notificationData);
            await addDoc(collection(db, 'notifications'), notificationData);
            console.log('Chat deletion notification sent successfully');
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            // Don't fail the entire operation if notification fails
          }
        }
        
        toast({
          title: "Chat Deleted",
          description: "Chat has been deleted for everyone.",
          variant: "default",
        });
      } else {
        // Remove only for current user - add to hiddenChats collection
        await addDoc(collection(db, 'hiddenChats'), {
          userId: currentUser.uid,
          chatId: id,
          hiddenAt: serverTimestamp()
        });
        
                          toast({
           title: "Chat Deleted",
           description: "Chat has been deleted for you.",
           variant: "default",
         });
       }
       
       // Navigate for both cases
       navigate('/chat');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingChat(false);
    }
  };

  const canEditMessage = (message) => {
    if (message.senderId !== currentUser.uid) return false;
    
    const messageTime = message.timestamp?.toDate?.() || new Date(message.timestamp);
    const now = new Date();
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    return diffInHours <= 1;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatInfo || !otherUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Chat Header */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chat')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherUser.photoURL} />
                <AvatarFallback>
                  {otherUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{otherUser.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{otherUser.email}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => deleteChat(false)}>
                    <UserX className="h-4 w-4 mr-2" />
                    Delete Chat for Me
                  </DropdownMenuItem>
                 <DropdownMenuItem 
                   onClick={() => deleteChat(true)}
                   className="text-destructive"
                 >
                   <Trash2 className="h-4 w-4 mr-2" />
                   Delete for Everyone
                 </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.senderId === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3 relative group`}>
                  {message.deleted ? (
                    <div className="text-sm italic opacity-70">
                      This message was deleted
                    </div>
                  ) : editingMessage === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-black"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => editMessage(message.id, editText)}
                          className="h-6 px-2"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingMessage(null);
                            setEditText('');
                          }}
                          className="h-6 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm">{message.message}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                        <span>{formatTime(message.timestamp)}</span>
                        {message.edited && <Badge variant="secondary" className="text-xs">Edited</Badge>}
                      </div>
                      
                      {/* Message Actions */}
                      {message.senderId === currentUser.uid && !message.deleted && (
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                                                         <DropdownMenuContent align="end">
                               {canEditMessage(message) && (
                                 <DropdownMenuItem onClick={() => {
                                   setEditingMessage(message.id);
                                   setEditText(message.message);
                                 }}>
                                   <Edit3 className="h-4 w-4 mr-2" />
                                   Edit
                                 </DropdownMenuItem>
                               )}
                                                               <DropdownMenuItem onClick={() => deleteMessage(message.id, false)}>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Message for Me
                                </DropdownMenuItem>
                               <DropdownMenuItem 
                                 onClick={() => deleteMessage(message.id, true)}
                                 className="text-destructive"
                               >
                                 <Trash2 className="h-4 w-4 mr-2" />
                                 Delete for Everyone
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivateChat;
