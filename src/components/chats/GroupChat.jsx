import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useAuth } from '../../contexts/authContext';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
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
  UserX,
  Users,
  Search,
  Plus,
  Heart,
  Smile,
  Image,
  Paperclip,
  Settings,
  UserPlus,
  Crown,
  Shield,
  User,
  Eye,
  EyeOff,
  Lock,
  Globe
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const GroupChat = () => {
  const navigate = useNavigate();
  const { id: groupIdFromUrl } = useParams();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State for groups
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for group creation
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupPrivacy, setGroupPrivacy] = useState('private');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  
  // State for group management
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState([]);
  
  // State for messages
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showReactions, setShowReactions] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  
  // State for file sharing
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user's groups
  useEffect(() => {
    if (!currentUser?.uid) return;

    const groupsQuery = query(
      collection(db, 'groups'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(groupsQuery, async (snapshot) => {
      const groupsData = [];
      for (const groupDoc of snapshot.docs) {
        const groupData = groupDoc.data();
        
        // Get group creator info
        const creatorDoc = await getDoc(doc(db, 'users', groupData.createdBy));
        const creatorData = creatorDoc.data();
        
        groupsData.push({
          id: groupDoc.id,
          ...groupData,
          creator: {
            id: groupData.createdBy,
            name: creatorData?.first_name && creatorData?.last_name 
              ? `${creatorData.first_name} ${creatorData.last_name}`.trim()
              : creatorData?.first_name || creatorData?.username || creatorData?.email,
            email: creatorData?.email
          }
        });
      }
      
      setGroups(groupsData);
      
      // Auto-select group if ID is provided in URL
      if (groupIdFromUrl && !selectedGroup) {
        const groupFromUrl = groupsData.find(group => group.id === groupIdFromUrl);
        if (groupFromUrl) {
          setSelectedGroup(groupFromUrl);
        } else {
          // Group not found or user doesn't have access
          toast({
            title: "Group Not Found",
            description: "This group doesn't exist or you don't have access to it.",
            variant: "destructive",
          });
          navigate('/group-chat');
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser?.uid, groupIdFromUrl, selectedGroup]);

  // Fetch available users for group creation/invites
  useEffect(() => {
    const fetchAvailableUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(user => user.id !== currentUser?.uid);
        
        setAvailableUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    if (currentUser?.uid) {
      fetchAvailableUsers();
    }
  }, [currentUser?.uid]);

  // Listen to messages when group is selected
  useEffect(() => {
    if (!selectedGroup?.id) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setMessages(messagesData);
      
      // Mark messages as read
      markMessagesAsRead();
    });

    return () => unsubscribe();
  }, [selectedGroup?.id]);

  // Listen to message reactions
  useEffect(() => {
    if (!selectedGroup?.id) return;

    const reactionsQuery = query(
      collection(db, 'groups', selectedGroup.id, 'reactions')
    );

    const unsubscribe = onSnapshot(reactionsQuery, (snapshot) => {
      const reactions = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!reactions[data.messageId]) {
          reactions[data.messageId] = [];
        }
        reactions[data.messageId].push(data);
      });
      setMessageReactions(reactions);
    });

    return () => unsubscribe();
  }, [selectedGroup?.id]);

  const markMessagesAsRead = async () => {
    if (!selectedGroup?.id || !currentUser?.uid) return;

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();
      
      const unreadMessages = groupData?.unreadMessages || {};
      if (unreadMessages[currentUser.uid]) {
        delete unreadMessages[currentUser.uid];
        await updateDoc(groupRef, { unreadMessages });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup?.id) return;

    try {
      const messageData = {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        edited: false,
        deleted: false,
        reactions: []
      };

      await addDoc(collection(db, 'groups', selectedGroup.id, 'messages'), messageData);

      // Update unread count for other members
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();
      
      const unreadMessages = groupData?.unreadMessages || {};
      const otherMembers = groupData.members.filter(member => member !== currentUser.uid);
      
      for (const memberId of otherMembers) {
        unreadMessages[memberId] = (unreadMessages[memberId] || 0) + 1;
      }
      
      await updateDoc(groupRef, { unreadMessages });

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

  const removeMember = async (memberId) => {
    if (!selectedGroup?.id) return;

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId),
        admins: arrayRemove(memberId)
      });

      // Send notification to removed member
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        const removerName = userData?.first_name && userData?.last_name 
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData?.first_name || userData?.username || currentUser.email;

        await addDoc(collection(db, 'notifications'), {
          userId: memberId,
          type: 'group_removed',
          title: 'Removed from Group',
          message: `${removerName} removed you from "${selectedGroup.name}"`,
          groupId: selectedGroup.id,
          timestamp: serverTimestamp(),
          read: false
        });
      } catch (error) {
        console.error('Error sending removal notification:', error);
      }

      toast({
        title: "Member Removed",
        description: "Member has been removed from the group.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const promoteToAdmin = async (memberId) => {
    if (!selectedGroup?.id) return;

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        admins: arrayUnion(memberId)
      });

      toast({
        title: "Admin Promoted",
        description: "Member has been promoted to admin.",
        variant: "success",
      });
    } catch (error) {
      console.error('Error promoting to admin:', error);
      toast({
        title: "Error",
        description: "Failed to promote member. Please try again.",
        variant: "destructive",
      });
    }
  };

  const demoteFromAdmin = async (memberId) => {
    if (!selectedGroup?.id) return;

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        admins: arrayRemove(memberId)
      });

      toast({
        title: "Admin Demoted",
        description: "Admin has been demoted to member.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error demoting admin:', error);
      toast({
        title: "Error",
        description: "Failed to demote admin. Please try again.",
        variant: "destructive",
      });
    }
  };

  const inviteMembers = async () => {
    if (!selectedGroup?.id || inviteSearchResults.length === 0) return;

    try {
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupDoc = await getDoc(groupRef);
      const groupData = groupDoc.data();
      
      const newMembers = inviteSearchResults.filter(user => 
        !groupData.members.includes(user.id)
      );

      if (newMembers.length === 0) {
        toast({
          title: "No New Members",
          description: "All selected users are already in the group.",
          variant: "default",
        });
        return;
      }

      await updateDoc(groupRef, {
        members: arrayUnion(...newMembers.map(user => user.id))
      });

      // Send notifications to invited members
      for (const user of newMembers) {
        try {
          const inviterDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const inviterData = inviterDoc.data();
          const inviterName = inviterData?.first_name && inviterData?.last_name 
            ? `${inviterData.first_name} ${inviterData.last_name}`.trim()
            : inviterData?.first_name || inviterData?.username || currentUser.email;

          await addDoc(collection(db, 'notifications'), {
            userId: user.id,
            type: 'group_invite',
            title: 'Group Invitation',
            message: `${inviterName} invited you to join "${selectedGroup.name}"`,
            groupId: selectedGroup.id,
            timestamp: serverTimestamp(),
            read: false
          });
        } catch (error) {
          console.error('Error sending group invite notification:', error);
        }
      }

      setShowInviteMembers(false);
      setInviteSearchResults([]);
      setInviteSearchQuery('');

      toast({
        title: "Members Invited",
        description: `${newMembers.length} member(s) have been invited to the group.`,
        variant: "success",
      });
    } catch (error) {
      console.error('Error inviting members:', error);
      toast({
        title: "Error",
        description: "Failed to invite members. Please try again.",
        variant: "destructive",
      });
    }
  };

  const searchInviteMembers = useCallback(() => {
    if (!inviteSearchQuery.trim()) {
      setInviteSearchResults([]);
      return;
    }

    const results = availableUsers.filter(user => 
      (user.email && user.email.toLowerCase().includes(inviteSearchQuery.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(inviteSearchQuery.toLowerCase())) ||
      (user.first_name && user.first_name.toLowerCase().includes(inviteSearchQuery.toLowerCase()))
    );

    setInviteSearchResults(results);
  }, [inviteSearchQuery, availableUsers]);

  useEffect(() => {
    searchInviteMembers();
  }, [searchInviteMembers]);

  const isAdmin = () => {
    return selectedGroup?.admins?.includes(currentUser.uid);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(message =>
    message.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addReaction = async (messageId, reaction) => {
    if (!selectedGroup?.id) return;

    try {
      await addDoc(collection(db, 'groups', selectedGroup.id, 'reactions'), {
        messageId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        reaction,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || !currentUser?.uid) return;

    try {
      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        privacy: groupPrivacy,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        members: [currentUser.uid, ...selectedMembers],
        admins: [currentUser.uid],
        unreadMessages: {}
      };

      const groupRef = await addDoc(collection(db, 'groups'), groupData);

      // Send notifications to invited members
      for (const memberId of selectedMembers) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          const userData = userDoc.data();
          const creatorName = userData?.first_name && userData?.last_name 
            ? `${userData.first_name} ${userData.last_name}`.trim()
            : userData?.first_name || userData?.username || currentUser.email;

          await addDoc(collection(db, 'notifications'), {
            userId: memberId,
            type: 'group_invite',
            title: 'Group Invitation',
            message: `${creatorName} invited you to join "${groupName}"`,
            groupId: groupRef.id,
            timestamp: serverTimestamp(),
            read: false
          });
        } catch (error) {
          console.error('Error sending group invite notification:', error);
        }
      }

      setShowCreateGroup(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedMembers([]);
      
      toast({
        title: "Group Created",
        description: "Your group has been created successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p>Please log in to access group chats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Groups Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Groups
                </CardTitle>
                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Group</DialogTitle>
                      <DialogDescription>
                        Create a new group chat with your friends.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Group Name</label>
                        <Input
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="Enter group name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          placeholder="Enter group description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Privacy</label>
                        <Select value={groupPrivacy} onValueChange={setGroupPrivacy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="private">
                              <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Private
                              </div>
                            </SelectItem>
                            <SelectItem value="public">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Public
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Invite Members</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {availableUsers.map(user => (
                            <div key={user.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedMembers(prev => [...prev, user.id]);
                                  } else {
                                    setSelectedMembers(prev => prev.filter(id => id !== user.id));
                                  }
                                }}
                              />
                              <span className="text-sm">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : user.first_name || user.username || user.email}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createGroup} disabled={!groupName.trim()}>
                        Create Group
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </CardHeader>
            <CardContent className="p-0">
                             <div className="space-y-1 max-h-[500px] overflow-y-auto">
                 {filteredGroups.map(group => (
                  <div
                    key={group.id}
                    className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                      selectedGroup?.id === group.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {group.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {group.members.length} members
                          </Badge>
                          {group.privacy === 'private' ? (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Globe className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                                 {filteredGroups.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No groups found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3">
          {selectedGroup ? (
            <div className="h-full flex flex-col">
              {/* Group Header */}
              <Card className="mb-4">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGroup(null)}
                        className="p-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-lg">{selectedGroup.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedGroup.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {selectedGroup.members.length} members
                          </Badge>
                          {selectedGroup.privacy === 'private' ? (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Private
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                                         </div>
                     
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="sm">
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end">
                         <DropdownMenuItem onClick={() => setShowGroupInfo(true)}>
                           <Settings className="h-4 w-4 mr-2" />
                           Group Info
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setShowMemberManagement(true)}>
                           <Users className="h-4 w-4 mr-2" />
                           Manage Members
                         </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => setShowInviteMembers(true)}>
                           <UserPlus className="h-4 w-4 mr-2" />
                           Invite Members
                         </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </CardHeader>
               </Card>

              {/* Messages */}
              <Card className="flex-1 mb-4">
                <CardContent className="p-4 h-full">
                                     <div className="space-y-4 max-h-[400px] overflow-y-auto">
                     {filteredMessages.map((message) => (
                       <div
                         key={message.id}
                         className={`flex ${message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}
                       >
                         <div className={`max-w-[70%] ${message.senderId === currentUser.uid ? 'bg-blue-500 text-white' : 'bg-gray-100'} rounded-lg p-3 relative group`}>
                           <div className="text-sm">{message.message}</div>
                           <div className="flex items-center gap-2 mt-1 text-xs opacity-70">
                             <span>{message.senderName}</span>
                             <span>{message.timestamp?.toDate?.()?.toLocaleTimeString() || 'Now'}</span>
                           </div>
                           
                           {/* Message Reactions */}
                           {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-2">
                               {Object.entries(
                                 messageReactions[message.id].reduce((acc, reaction) => {
                                   acc[reaction.reaction] = (acc[reaction.reaction] || 0) + 1;
                                   return acc;
                                 }, {})
                               ).map(([reaction, count]) => (
                                 <Badge key={reaction} variant="outline" className="text-xs cursor-pointer">
                                   {reaction} {count}
                                 </Badge>
                               ))}
                             </div>
                           )}
                           
                           {/* Message Actions */}
                           <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                   <MoreVertical className="h-3 w-3" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                 <DropdownMenuItem onClick={() => setShowReactions(message.id)}>
                                   <Smile className="h-4 w-4 mr-2" />
                                   React
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      accept="image/*"
                    />
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
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Group</h3>
                  <p className="text-muted-foreground">
                    Choose a group from the sidebar to start chatting
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
                 </div>
       </div>

       {/* Group Info Dialog */}
       <Dialog open={showGroupInfo} onOpenChange={setShowGroupInfo}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Group Information</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <div>
               <h4 className="font-medium">Name</h4>
               <p className="text-sm text-muted-foreground">{selectedGroup?.name}</p>
             </div>
             <div>
               <h4 className="font-medium">Description</h4>
               <p className="text-sm text-muted-foreground">
                 {selectedGroup?.description || 'No description'}
               </p>
             </div>
             <div>
               <h4 className="font-medium">Privacy</h4>
               <p className="text-sm text-muted-foreground capitalize">
                 {selectedGroup?.privacy}
               </p>
             </div>
             <div>
               <h4 className="font-medium">Created By</h4>
               <p className="text-sm text-muted-foreground">
                 {selectedGroup?.creator?.name}
               </p>
             </div>
             <div>
               <h4 className="font-medium">Members</h4>
               <p className="text-sm text-muted-foreground">
                 {selectedGroup?.members?.length || 0} members
               </p>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* Member Management Dialog */}
       <Dialog open={showMemberManagement} onOpenChange={setShowMemberManagement}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>Manage Members</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <Tabs defaultValue="members">
               <TabsList>
                 <TabsTrigger value="members">Members</TabsTrigger>
                 <TabsTrigger value="admins">Admins</TabsTrigger>
               </TabsList>
               <TabsContent value="members" className="space-y-2">
                 {selectedGroup?.members?.map(memberId => {
                   const user = availableUsers.find(u => u.id === memberId);
                   const isUserAdmin = selectedGroup?.admins?.includes(memberId);
                   const isCurrentUser = memberId === currentUser.uid;
                   
                   if (!user) return null;
                   
                   return (
                     <div key={memberId} className="flex items-center justify-between p-3 border rounded-lg">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={user.profile_picture} />
                           <AvatarFallback>
                             {user.first_name?.charAt(0) || user.email?.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                         <div>
                           <p className="font-medium">
                             {user.first_name && user.last_name 
                               ? `${user.first_name} ${user.last_name}`
                               : user.first_name || user.username || user.email}
                           </p>
                           <p className="text-sm text-muted-foreground">{user.email}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         {isUserAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                         {!isCurrentUser && isAdmin() && (
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="sm">
                                 <MoreVertical className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               {!isUserAdmin ? (
                                 <DropdownMenuItem onClick={() => promoteToAdmin(memberId)}>
                                   <Crown className="h-4 w-4 mr-2" />
                                   Promote to Admin
                                 </DropdownMenuItem>
                               ) : (
                                 <DropdownMenuItem onClick={() => demoteFromAdmin(memberId)}>
                                   <User className="h-4 w-4 mr-2" />
                                   Demote to Member
                                 </DropdownMenuItem>
                               )}
                               <DropdownMenuItem 
                                 onClick={() => removeMember(memberId)}
                                 className="text-destructive"
                               >
                                 <UserX className="h-4 w-4 mr-2" />
                                 Remove from Group
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </TabsContent>
               <TabsContent value="admins" className="space-y-2">
                 {selectedGroup?.admins?.map(adminId => {
                   const user = availableUsers.find(u => u.id === adminId);
                   
                   if (!user) return null;
                   
                   return (
                     <div key={adminId} className="flex items-center gap-3 p-3 border rounded-lg">
                       <Crown className="h-4 w-4 text-yellow-500" />
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={user.profile_picture} />
                         <AvatarFallback>
                           {user.first_name?.charAt(0) || user.email?.charAt(0)}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <p className="font-medium">
                           {user.first_name && user.last_name 
                             ? `${user.first_name} ${user.last_name}`
                             : user.first_name || user.username || user.email}
                         </p>
                         <p className="text-sm text-muted-foreground">{user.email}</p>
                       </div>
                     </div>
                   );
                 })}
               </TabsContent>
             </Tabs>
           </div>
         </DialogContent>
       </Dialog>

       {/* Invite Members Dialog */}
       <Dialog open={showInviteMembers} onOpenChange={setShowInviteMembers}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Invite Members</DialogTitle>
             <DialogDescription>
               Search and invite friends to join this group.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4">
             <Input
               placeholder="Search by name or email..."
               value={inviteSearchQuery}
               onChange={(e) => setInviteSearchQuery(e.target.value)}
             />
             <div className="space-y-2 max-h-48 overflow-y-auto">
               {inviteSearchResults.map(user => (
                 <div key={user.id} className="flex items-center gap-3 p-2 border rounded-lg">
                   <input
                     type="checkbox"
                     checked={inviteSearchResults.some(u => u.id === user.id)}
                     onChange={(e) => {
                       if (e.target.checked) {
                         setInviteSearchResults(prev => [...prev, user]);
                       } else {
                         setInviteSearchResults(prev => prev.filter(u => u.id !== user.id));
                       }
                     }}
                   />
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={user.profile_picture} />
                     <AvatarFallback>
                       {user.first_name?.charAt(0) || user.email?.charAt(0)}
                     </AvatarFallback>
                   </Avatar>
                   <div>
                     <p className="font-medium">
                       {user.first_name && user.last_name 
                         ? `${user.first_name} ${user.last_name}`
                         : user.first_name || user.username || user.email}
                     </p>
                     <p className="text-sm text-muted-foreground">{user.email}</p>
                   </div>
                 </div>
               ))}
               {inviteSearchResults.length === 0 && inviteSearchQuery && (
                 <p className="text-center text-muted-foreground">No users found</p>
               )}
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowInviteMembers(false)}>
               Cancel
             </Button>
             <Button onClick={inviteMembers} disabled={inviteSearchResults.length === 0}>
               Invite Selected
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

       {/* Reactions Dialog */}
       <Dialog open={!!showReactions} onOpenChange={() => setShowReactions(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add Reaction</DialogTitle>
           </DialogHeader>
           <div className="grid grid-cols-4 gap-2">
             {['👍', '❤️', '😂', '😮', '😢', '😡', '👏', '🎉'].map(reaction => (
               <Button
                 key={reaction}
                 variant="ghost"
                 size="lg"
                 onClick={() => {
                   addReaction(showReactions, reaction);
                   setShowReactions(null);
                 }}
                 className="text-2xl"
               >
                 {reaction}
               </Button>
             ))}
           </div>
         </DialogContent>
       </Dialog>
     </div>
   );
 };

export default GroupChat;
