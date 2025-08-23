import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  MessageCircle, 
  Users, 
  Plus, 
  Send, 
  UserPlus,
  Search
} from 'lucide-react';

const Chat = () => {
  const { currentUser } = useAuth();
  const [privateChats, setPrivateChats] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [newChatEmail, setNewChatEmail] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmails, setNewGroupEmails] = useState('');
  const [isCreatingPrivate, setIsCreatingPrivate] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const privateChatsQuery = query(
          collection(db, 'chats'),
          where('type', '==', 'private'),
          where('members', 'array-contains', currentUser.uid)
        );
        const groupChatsQuery = query(
          collection(db, 'chats'),
          where('type', '==', 'group'),
          where('members', 'array-contains', currentUser.uid)
        );

        const privateChatsSnapshot = await getDocs(privateChatsQuery);
        const groupChatsSnapshot = await getDocs(groupChatsQuery);

        setPrivateChats(privateChatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setGroupChats(groupChatsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    if (currentUser?.uid) {
      fetchChats();
    }
  }, [currentUser?.uid]);

  const createPrivateChat = useCallback(async () => {
    const userEmail = newChatEmail.trim();
    if (!userEmail) return;

    setIsCreatingPrivate(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('email', '==', userEmail));
      const userSnapshot = await getDocs(usersQuery);
      if (userSnapshot.empty) {
        alert('User not found');
        return;
      }

      const userId = userSnapshot.docs[0].id;
      const chatDoc = await addDoc(collection(db, 'chats'), {
        type: 'private',
        members: [currentUser.uid, userId],
      });

      setNewChatEmail('');
      navigate(`/private-chat/${chatDoc.id}`);
    } catch (error) {
      console.error('Error creating private chat:', error);
      alert('Failed to create private chat');
    } finally {
      setIsCreatingPrivate(false);
    }
  }, [newChatEmail, currentUser?.uid, navigate]);

  const createGroupChat = useCallback(async () => {
    const emails = newGroupEmails.split(',').map(email => email.trim());
    if (!newGroupName || emails.length === 0) return;

    setIsCreatingGroup(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('email', 'in', emails));
      const userSnapshot = await getDocs(usersQuery);
      if (userSnapshot.empty) {
        alert('Users not found');
        return;
      }

      const userIds = userSnapshot.docs.map(doc => doc.id);
      userIds.push(currentUser.uid);

      const chatDoc = await addDoc(collection(db, 'chats'), {
        type: 'group',
        members: userIds,
        name: newGroupName,
      });

      setNewGroupName('');
      setNewGroupEmails('');
      navigate(`/group-chat/${chatDoc.id}`);
    } catch (error) {
      console.error('Error creating group chat:', error);
      alert('Failed to create group chat');
    } finally {
      setIsCreatingGroup(false);
    }
  }, [newGroupName, newGroupEmails, currentUser?.uid, navigate]);

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
              One-on-one conversations with other users
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
                      <AvatarFallback>
                        <UserPlus className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {chat.members.filter(member => member !== currentUser.uid).join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">Private chat</p>
                    </div>
                    <Badge variant="secondary">1:1</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No private chats yet</p>
                <p className="text-sm">Start a conversation below</p>
              </div>
            )}

            <Separator />

            {/* Create Private Chat */}
            <div className="space-y-3">
              <Label htmlFor="private-email">Start a private chat</Label>
              <div className="flex gap-2">
                <Input
                  id="private-email"
                  type="email"
                  placeholder="Enter user's email"
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
              Group conversations with multiple users
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
                <p className="text-sm">Create a group below</p>
              </div>
            )}

            <Separator />

            {/* Create Group Chat */}
            <div className="space-y-3">
              <Label htmlFor="group-name">Create a group chat</Label>
              <Input
                id="group-name"
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <Input
                type="text"
                placeholder="Enter emails separated by commas"
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
