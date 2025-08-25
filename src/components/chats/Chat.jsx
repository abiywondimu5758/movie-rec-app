import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useToast } from '../../hooks/use-toast';
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Send, 
  UserPlus,
  Search,
  UserCheck,
  UserX
} from 'lucide-react';

const Chat = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [privateChats, setPrivateChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmails, setNewGroupEmails] = useState('');
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Real-time listener for private chats
    const privateChatsQuery = query(
      collection(db, 'chats'),
      where('type', '==', 'private'),
      where('members', 'array-contains', currentUser.uid)
    );

    // Real-time listener for hidden chats
    const hiddenChatsQuery = query(
      collection(db, 'hiddenChats'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeHiddenChats = onSnapshot(hiddenChatsQuery, (hiddenChatsSnapshot) => {
      const hiddenChatIds = hiddenChatsSnapshot.docs.map(doc => doc.data().chatId);
      
      // Update private chats when hidden chats change
      setPrivateChats(prevChats => {
        return prevChats.filter(chat => !hiddenChatIds.includes(chat.id));
      });
    });

    const unsubscribePrivateChats = onSnapshot(privateChatsQuery, async (snapshot) => {
      try {
        // Get hidden chats for current user
        const hiddenChatsSnapshot = await getDocs(hiddenChatsQuery);
        const hiddenChatIds = hiddenChatsSnapshot.docs.map(doc => doc.data().chatId);

        // Process private chats to get other user's info
        const privateChatsData = [];
        for (const chatDoc of snapshot.docs) {
          const chatData = chatDoc.data();
          
          // Skip chats that are deleted for everyone or hidden for current user
          if (chatData.deletedForEveryone || hiddenChatIds.includes(chatDoc.id)) {
            continue;
          }
          
          const otherUserId = chatData.members.find(member => member !== currentUser.uid);
          
          if (otherUserId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Get unread count for current user
                const unreadCount = chatData?.unreadMessages?.[currentUser.uid] || 0;
                
                privateChatsData.push({
                  id: chatDoc.id,
                  ...chatData,
                  unreadCount,
                  otherUser: {
                    id: otherUserId,
                    name: userData.first_name && userData.last_name 
                      ? `${userData.first_name} ${userData.last_name}`.trim()
                      : userData.first_name || userData.username || userData.email,
                    email: userData.email,
                    photoURL: userData.profile_picture
                  }
                });
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
        }

        console.log('Private chats updated:', privateChatsData);
        setPrivateChats(privateChatsData);
      } catch (error) {
        console.error('Error processing private chats:', error);
      }
    });

    // Real-time listener for group chats
    const groupChatsQuery = query(
      collection(db, 'chats'),
      where('type', '==', 'group'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribeGroupChats = onSnapshot(groupChatsQuery, (snapshot) => {
      const groupChatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGroupChats(groupChatsData);
    });

    return () => {
      unsubscribePrivateChats();
      unsubscribeGroupChats();
      unsubscribeHiddenChats();
    };
  }, [currentUser?.uid]);

  // Real-time listeners handle updates automatically

  // Check if two users are friends
  const checkIfFriends = useCallback(async (userId1, userId2) => {
    try {
      const friendshipQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'accepted'),
        where('users', 'array-contains', userId1)
      );
      const friendshipSnapshot = await getDocs(friendshipQuery);
      
      const areFriends = friendshipSnapshot.docs.some(doc => {
        const data = doc.data();
        return data.users.includes(userId2);
      });
      
      return areFriends;
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  }, []);

  const createPrivateChat = useCallback(async () => {
    const userInput = newChatEmail.trim();
    if (!userInput) return;

    setIsCreatingPrivate(true);
    try {
      // Check if user is trying to chat with themselves
      if (userInput === currentUser.email || 
          userInput === currentUser.displayName || 
          userInput === currentUser.uid) {
        toast({
          title: "Cannot Chat With Yourself",
          description: "You cannot start a private chat with yourself.",
          variant: "destructive",
        });
        return;
      }

      // Search by email or username
      const emailQuery = query(collection(db, 'users'), where('email', '==', userInput));
      const usernameQuery = query(collection(db, 'users'), where('username', '==', userInput));
      
      const [emailSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(usernameQuery)
      ]);

      let userDoc = null;
      if (!emailSnapshot.empty) {
        userDoc = emailSnapshot.docs[0];
      } else if (!usernameSnapshot.empty) {
        userDoc = usernameSnapshot.docs[0];
      }

      if (!userDoc) {
        toast({
          title: "User Not Found",
          description: "No user found with that email or username.",
          variant: "destructive",
        });
        return;
      }

      const userId = userDoc.id;
      
      // Double-check to prevent self-chat
      if (userId === currentUser.uid) {
        toast({
          title: "Cannot Chat With Yourself",
          description: "You cannot start a private chat with yourself.",
          variant: "destructive",
        });
        return;
      }
      
      // Check if users are friends
      const areFriends = await checkIfFriends(currentUser.uid, userId);
      if (!areFriends) {
        toast({
          title: "Friends Only",
          description: "You can only start private chats with your friends. Visit the Friends page to add them first!",
          variant: "destructive",
        });
        return;
      }

      // Check if an active private chat already exists between these users (not deleted)
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('type', '==', 'private'),
        where('members', 'array-contains', currentUser.uid)
      );
      const existingChatSnapshot = await getDocs(existingChatQuery);
      
      const activeChatExists = existingChatSnapshot.docs.some(doc => {
        const chatData = doc.data();
        return chatData.members.includes(userId) && 
               chatData.members.length === 2 && 
               !chatData.deletedForEveryone;
      });

      if (activeChatExists) {
        toast({
          title: "Chat Already Exists",
          description: "You already have a private chat with this friend.",
          variant: "default",
        });
        return;
      }

      const chatDoc = await addDoc(collection(db, 'chats'), {
        type: 'private',
        members: [currentUser.uid, userId],
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        deleted: false,
        deletedForEveryone: false
      });

      // Send notification to the other user
      try {
        const userData = userDoc.data();
        const otherUserName = userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.first_name || userData.username || userData.email;

        const notificationData = {
          userId: userId,
          type: 'new_chat',
          title: 'New Private Chat',
          message: `${currentUser.displayName || currentUser.email} started a private chat with you`,
          chatId: chatDoc.id,
          timestamp: serverTimestamp(),
          read: false
        };

        console.log('Sending notification to user:', userId);
        console.log('Notification data:', notificationData);
        const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
        console.log('Notification sent successfully with ID:', notificationRef.id);
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }

      setNewChatEmail('');
      toast({
        title: "Private Chat Created",
        description: "Your private chat has been created successfully!",
        variant: "success",
      });
      navigate(`/private-chat/${chatDoc.id}`);
    } catch (error) {
      console.error('Error creating private chat:', error);
      toast({
        title: "Error",
        description: "Failed to create private chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPrivate(false);
    }
  }, [newChatEmail, currentUser?.uid, currentUser?.email, currentUser?.displayName, navigate, checkIfFriends, toast]);

  const createGroupChat = useCallback(async () => {
    const userInputs = newGroupEmails.split(',').map(input => input.trim());
    if (!newGroupName || userInputs.length === 0) return;

    setIsCreatingGroup(true);
    try {
      // Check if user is trying to add themselves
      const selfInputs = userInputs.filter(input => 
        input === currentUser.email || 
        input === currentUser.displayName || 
        input === currentUser.username
      );
      
      if (selfInputs.length > 0) {
        toast({
          title: "Cannot Add Yourself",
          description: "You cannot add yourself to a group chat.",
          variant: "destructive",
        });
        return;
      }

      // Find users by email or username
      const foundUsers = [];
      const notFoundUsers = [];

      for (const userInput of userInputs) {
        const emailQuery = query(collection(db, 'users'), where('email', '==', userInput));
        const usernameQuery = query(collection(db, 'users'), where('username', '==', userInput));
        
        const [emailSnapshot, usernameSnapshot] = await Promise.all([
          getDocs(emailQuery),
          getDocs(usernameQuery)
        ]);

        let userDoc = null;
        if (!emailSnapshot.empty) {
          userDoc = emailSnapshot.docs[0];
        } else if (!usernameSnapshot.empty) {
          userDoc = usernameSnapshot.docs[0];
        }

        if (userDoc) {
          foundUsers.push(userDoc);
        } else {
          notFoundUsers.push(userInput);
        }
      }

      if (notFoundUsers.length > 0) {
        toast({
          title: "Users Not Found",
          description: `No users found with: ${notFoundUsers.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      const userIds = foundUsers.map(doc => doc.id);
      
      // Check if all users are friends with the current user
      const nonFriends = [];
      for (const userId of userIds) {
        const areFriends = await checkIfFriends(currentUser.uid, userId);
        if (!areFriends) {
          const userData = foundUsers.find(doc => doc.id === userId)?.data();
          nonFriends.push(userData?.email || userData?.username || userId);
        }
      }

      if (nonFriends.length > 0) {
        toast({
          title: "Friends Only",
          description: `You can only add friends to group chats. The following users are not your friends: ${nonFriends.join(', ')}. Visit the Friends page to add them first!`,
          variant: "destructive",
        });
        return;
      }

      userIds.push(currentUser.uid);

      const chatDoc = await addDoc(collection(db, 'chats'), {
        type: 'group',
        members: userIds,
        name: newGroupName,
      });

      setNewGroupName('');
      setNewGroupEmails('');
      toast({
        title: "Group Chat Created",
        description: "Your group chat has been created successfully!",
        variant: "success",
      });
      navigate(`/group-chat/${chatDoc.id}`);
    } catch (error) {
      console.error('Error creating group chat:', error);
      toast({
        title: "Error",
        description: "Failed to create group chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingGroup(false);
    }
  }, [newGroupName, newGroupEmails, currentUser?.uid, currentUser?.email, currentUser?.displayName, currentUser?.username, navigate, checkIfFriends, toast]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Chat Dashboard
        </h1>
        <p className="text-muted-foreground">
          Connect with friends and join group conversations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Private Chats */}
        <Card>
          <CardHeader>
                    <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Private Chats
        </CardTitle>
            <CardDescription>
              One-on-one conversations with your friends only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {privateChats.length > 0 ? (
              <div className="space-y-2">
                {privateChats.map(chat => (
                  <Link
                    key={chat.id}
                    to={`/private-chat/${chat.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={chat.otherUser?.photoURL} />
                      <AvatarFallback>
                        {chat.otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chat.otherUser?.name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground">{chat.otherUser?.email}</p>
                    </div>
                                         {chat.unreadCount > 0 && (
                       <Badge variant="default" className="text-xs bg-blue-500 hover:bg-blue-600">
                         {chat.unreadCount}
                       </Badge>
                     )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No private chats yet</p>
                <p className="text-sm">Start a conversation with a friend below</p>

              </div>
            )}

            <Separator />

            {/* Create Private Chat */}
            <div className="space-y-3">
              <Label htmlFor="private-email" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Start a private chat with a friend
              </Label>
              <div className="flex gap-2">
                <Input
                  id="private-email"
                  type="text"
                  placeholder="Enter friend's email or username"
                  value={newChatEmail}
                  onChange={(e) => setNewChatEmail(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={createPrivateChat}
                  disabled={isCreatingPrivate || !newChatEmail.trim()}
                  size="sm"
                >
                  {isCreatingPrivate ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                You can only start private chats with users who are your friends. Use email or username to find them. 
                <Link to="/friends" className="text-blue-500 hover:underline ml-1">
                  Manage friends →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Group Chats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Chats
            </CardTitle>
            <CardDescription>
              Group conversations with your friends only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {groupChats.length > 0 ? (
              <div className="space-y-2">
                {groupChats.map(chat => (
                  <Link
                    key={chat.id}
                    to={`/group-chat/${chat.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Users className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{chat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {chat.members.length} members
                      </p>
                    </div>
                    <Badge variant="outline">Group</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No group chats yet</p>
                <p className="text-sm">Create a group with friends below</p>
              </div>
            )}

            <Separator />

            {/* Create Group Chat */}
            <div className="space-y-3">
              <Label htmlFor="group-name" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Create a group chat with friends
              </Label>
              <Input
                id="group-name"
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Enter friends' emails or usernames separated by commas"
                value={newGroupEmails}
                onChange={(e) => setNewGroupEmails(e.target.value)}
              />
              <Button 
                onClick={createGroupChat}
                disabled={isCreatingGroup || !newGroupName.trim() || !newGroupEmails.trim()}
                className="w-full"
              >
                {isCreatingGroup ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                You can only add users who are your friends to group chats. Use email or username to find them. 
                <Link to="/friends" className="text-blue-500 hover:underline ml-1">
                  Manage friends →
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
