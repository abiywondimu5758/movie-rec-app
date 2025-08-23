import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  Loader2, 
  AlertTriangle,
  Mail,
  Share2,
  Heart
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../hooks/use-toast';

const Friends = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [sendingRequests, setSendingRequests] = useState(new Set());
  const [userFriendshipStatus, setUserFriendshipStatus] = useState({});
  const [actionLoading, setActionLoading] = useState(new Set());
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const usersPerPage = 20;

  // Fetch user's friends and requests
  const fetchFriendsData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Fetch friends
      const friendsQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'accepted'),
        where('users', 'array-contains', currentUser.uid)
      );
      const friendsSnapshot = await getDocs(friendsQuery);
      const friendsData = [];
      
             for (const docSnapshot of friendsSnapshot.docs) {
         const data = docSnapshot.data();
         const friendId = data.users.find(id => id !== currentUser.uid);
                  if (friendId) {
            // Get friend's profile - use document ID instead of uid field
            const userDoc = doc(db, 'users', friendId);
            const userSnapshot = await getDoc(userDoc);
            if (userSnapshot.exists()) {
              const userData = userSnapshot.data();
              friendsData.push({
                id: docSnapshot.id,
                friendId,
                email: userData.email,
                displayName: userData.first_name && userData.last_name 
                  ? `${userData.first_name} ${userData.last_name}`.trim()
                  : userData.first_name || userData.username || userData.email,
                photoURL: userData.profile_picture
              });
            }
          }
       }
      setFriends(friendsData);

      // Fetch pending requests (received)
      const pendingQuery = query(
        collection(db, 'friendships'),
        where('status', '==', 'pending'),
        where('toUser', '==', currentUser.uid)
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingData = [];
      
             for (const docSnapshot of pendingSnapshot.docs) {
         const data = docSnapshot.data();
         const userDoc = doc(db, 'users', data.fromUser);
         const userSnapshot = await getDoc(userDoc);
         if (userSnapshot.exists()) {
           const userData = userSnapshot.data();
           pendingData.push({
             id: docSnapshot.id,
             fromUser: data.fromUser,
             email: userData.email,
             displayName: userData.first_name && userData.last_name 
               ? `${userData.first_name} ${userData.last_name}`.trim()
               : userData.first_name || userData.username || userData.email,
             photoURL: userData.profile_picture
           });
         }
       }
      setPendingRequests(pendingData);

             // Fetch sent requests
       const sentQuery = query(
         collection(db, 'friendships'),
         where('status', '==', 'pending'),
         where('fromUser', '==', currentUser.uid)
       );
               const sentSnapshot = await getDocs(sentQuery);
        const sentData = [];
        
        for (const docSnapshot of sentSnapshot.docs) {
          const data = docSnapshot.data();
         const userDoc = doc(db, 'users', data.toUser);
         const userSnapshot = await getDoc(userDoc);
         if (userSnapshot.exists()) {
           const userData = userSnapshot.data();
           sentData.push({
             id: docSnapshot.id,
             toUser: data.toUser,
             email: userData.email,
             displayName: userData.first_name && userData.last_name 
               ? `${userData.first_name} ${userData.last_name}`.trim()
               : userData.first_name || userData.username || userData.email,
             photoURL: userData.profile_picture
           });
         }
               }
        setSentRequests(sentData);
       
       // Refresh friendship status for all users
       if (allUsers.length > 0) {
         checkFriendshipStatus(allUsers);
       }
       

    } catch (error) {
      console.error('Error fetching friends data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch all users for the Add Friends tab
  const fetchAllUsers = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    
    setSearching(true);
         try {
       const usersQuery = query(collection(db, 'users'));
       const snapshot = await getDocs(usersQuery);
       
       if (snapshot.docs.length === 0) {
         setAllUsers([]);
         setTotalPages(1);
         setCurrentPage(1);
         return;
       }
       
       const allUsersData = snapshot.docs.map(doc => {
         const data = doc.data();
         // Use document ID as uid since the data doesn't contain uid field
         return { id: doc.id, uid: doc.id, ...data };
       });
       
       const filteredUsers = allUsersData.filter(user => {
         const isValid = user.uid !== currentUser.uid && user.uid;
         return isValid;
       });
      
             setAllUsers(filteredUsers);
       setTotalPages(Math.ceil(filteredUsers.length / usersPerPage));
       setCurrentPage(1);
       
       // Check friendship status for all users
       checkFriendshipStatus(filteredUsers);
         } catch (error) {
       console.error('Error fetching users:', error);
       setAllUsers([]);
     } finally {
      setSearching(false);
    }
  }, [currentUser]);



  useEffect(() => {
    fetchFriendsData();
  }, [fetchFriendsData]);

  // Fetch all users when component mounts
  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Fetch users when Add Friends tab is selected
  useEffect(() => {
    if (activeTab === 'add') {
      fetchAllUsers();
    }
  }, [activeTab, fetchAllUsers]);

  // Search for users to add as friends
  const searchUsers = useCallback(async (searchQuery) => {
    if (!currentUser) return;
    
    setSearching(true);
    try {
             if (searchQuery.trim()) {
         // Filter from allUsers client-side (more reliable)
         const results = allUsers.filter(user => 
           (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
         );
         setSearchResults(results);
       } else {
        // Show all users when search is empty
        setSearchResults(allUsers);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [currentUser, allUsers]);

  // Check friendship status for all users
  const checkFriendshipStatus = useCallback(async (users) => {
    if (!currentUser || users.length === 0) return;
    
    try {
      const statusMap = {};
      
      for (const user of users) {
        // Check if there's already a friendship between current user and this user
        const existingFriendshipQuery = query(
          collection(db, 'friendships'),
          where('fromUser', 'in', [currentUser.uid, user.uid]),
          where('toUser', 'in', [currentUser.uid, user.uid])
        );
        
        const existingFriendshipSnapshot = await getDocs(existingFriendshipQuery);
        
        if (!existingFriendshipSnapshot.empty) {
          const existingFriendship = existingFriendshipSnapshot.docs[0];
          const friendshipData = existingFriendship.data();
          
          if (friendshipData.status === 'accepted') {
            statusMap[user.uid] = 'friends';
          } else if (friendshipData.status === 'pending') {
            if (friendshipData.fromUser === currentUser.uid) {
              statusMap[user.uid] = 'request_sent';
            } else {
              statusMap[user.uid] = 'request_received';
            }
          }
        } else {
          statusMap[user.uid] = 'none';
        }
      }
      
      setUserFriendshipStatus(statusMap);
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  }, [currentUser, allUsers]);

    // Send friend request
  const sendFriendRequest = useCallback(async (toUserId) => {
    if (!currentUser || !toUserId) {
      console.error('Missing currentUser or toUserId:', { currentUser: currentUser?.uid, toUserId });
      return;
    }
    
    // Prevent duplicate requests
    if (sendingRequests.has(toUserId)) {
      return;
    }
    
    // Add to sending requests set
    setSendingRequests(prev => new Set(prev).add(toUserId));
    
    try {
      // Check if there's already a friendship between these users
      const existingFriendshipQuery = query(
        collection(db, 'friendships'),
        where('fromUser', 'in', [currentUser.uid, toUserId]),
        where('toUser', 'in', [currentUser.uid, toUserId])
      );
      
      const existingFriendshipSnapshot = await getDocs(existingFriendshipQuery);
      
      if (!existingFriendshipSnapshot.empty) {
        // Check if they're already friends
        const existingFriendship = existingFriendshipSnapshot.docs[0];
        const friendshipData = existingFriendship.data();
        
        if (friendshipData.status === 'accepted') {
          toast({
            title: "Already Friends",
            description: "You are already friends with this user!",
            variant: "default",
          });
          return;
        }
        
        // Check if there's already a pending request
        if (friendshipData.status === 'pending') {
          if (friendshipData.fromUser === currentUser.uid) {
            toast({
              title: "Request Already Sent",
              description: "You have already sent a friend request to this user!",
              variant: "default",
            });
          } else {
            toast({
              title: "Request Received",
              description: "This user has already sent you a friend request. Please check your 'Requests' tab to accept or reject it.",
              variant: "default",
            });
          }
          return;
        }
      }
      
      const friendshipData = {
        fromUser: currentUser.uid,
        toUser: toUserId,
        status: 'pending',
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'friendships'), friendshipData);
      
      // Refresh data
      fetchFriendsData();
      setSearchResults([]);
      setSearchQuery('');
      
      // Show success feedback
      toast({
        title: "Friend Request Sent",
        description: "Your friend request has been sent successfully!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from sending requests set
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(toUserId);
        return newSet;
      });
    }
  }, [currentUser, fetchFriendsData, sendingRequests, toast]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId, fromUserId) => {
    if (!currentUser) return;
    
    // Add to action loading set
    setActionLoading(prev => new Set(prev).add(`accept-${requestId}`));
    
    try {
      const requestRef = doc(db, 'friendships', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        users: [currentUser.uid, fromUserId],
        acceptedAt: new Date()
      });
      
      fetchFriendsData();
      toast({
        title: "Friend Request Accepted",
        description: "You are now friends!",
        variant: "success",
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from action loading set
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(`accept-${requestId}`);
        return newSet;
      });
    }
  }, [currentUser, fetchFriendsData, toast]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (requestId) => {
    // Add to action loading set
    setActionLoading(prev => new Set(prev).add(`reject-${requestId}`));
    
    try {
      await deleteDoc(doc(db, 'friendships', requestId));
      fetchFriendsData();
      toast({
        title: "Friend Request Rejected",
        description: "The friend request has been rejected.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to reject friend request. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from action loading set
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(`reject-${requestId}`);
        return newSet;
      });
    }
  }, [fetchFriendsData, toast]);

  // Remove friend
  const removeFriend = useCallback(async (friendshipId) => {
    // Add to action loading set
    setActionLoading(prev => new Set(prev).add(`remove-${friendshipId}`));
    
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
      fetchFriendsData();
      toast({
        title: "Friend Removed",
        description: "Friend has been removed from your list.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Error",
        description: "Failed to remove friend. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from action loading set
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(`remove-${friendshipId}`);
        return newSet;
      });
    }
  }, [fetchFriendsData, toast]);

  // Cancel sent request
  const cancelRequest = useCallback(async (requestId) => {
    // Add to action loading set
    setActionLoading(prev => new Set(prev).add(`cancel-${requestId}`));
    
    try {
      await deleteDoc(doc(db, 'friendships', requestId));
      fetchFriendsData();
      toast({
        title: "Request Cancelled",
        description: "Friend request has been cancelled.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error canceling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Remove from action loading set
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(`cancel-${requestId}`);
        return newSet;
      });
    }
  }, [fetchFriendsData, toast]);

  // Get paginated users
  const getPaginatedUsers = useCallback(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return allUsers.slice(startIndex, endIndex);
  }, [allUsers, currentPage, usersPerPage]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    searchUsers(searchQuery);
  }, [searchQuery, searchUsers]);

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  // Skeleton component for loading state
  const FriendsSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Friends</h1>
            <Badge variant="secondary" className="text-sm">
              Loading...
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Connect with friends and share your movie recommendations
          </p>
        </div>

        <Tabs value="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <FriendsSkeleton />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Friends</h1>
          <Badge variant="secondary" className="text-sm">
            {friends.length} friends
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Connect with friends and share your movie recommendations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Friends ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Sent ({sentRequests.length})
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add Friends
          </TabsTrigger>
        </TabsList>

        {/* Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          {friends.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No friends yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start adding friends to share your movie recommendations
                </p>
                <Button onClick={() => setActiveTab('add')}>
                  Add Friends
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {friends.map((friend) => (
                <Card key={friend.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {friend.photoURL ? (
                          <img src={friend.photoURL} alt={friend.displayName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{friend.displayName}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Lists
                      </Button>
                                             <Button 
                         variant="destructive" 
                         size="sm" 
                         onClick={() => removeFriend(friend.id)}
                         disabled={actionLoading.has(`remove-${friend.id}`)}
                       >
                         {actionLoading.has(`remove-${friend.id}`) ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <UserX className="h-4 w-4" />
                         )}
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserPlus className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No pending requests</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any pending friend requests
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {request.photoURL ? (
                          <img src={request.photoURL} alt={request.displayName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{request.displayName}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                                         <div className="flex items-center gap-2">
                       <Button 
                         size="sm" 
                         onClick={() => acceptFriendRequest(request.id, request.fromUser)}
                         disabled={actionLoading.has(`accept-${request.id}`)}
                       >
                         {actionLoading.has(`accept-${request.id}`) ? (
                           <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         ) : (
                           <UserCheck className="h-4 w-4 mr-2" />
                         )}
                         {actionLoading.has(`accept-${request.id}`) ? 'Accepting...' : 'Accept'}
                       </Button>
                       <Button 
                         variant="destructive" 
                         size="sm" 
                         onClick={() => rejectFriendRequest(request.id)}
                         disabled={actionLoading.has(`reject-${request.id}`)}
                       >
                         {actionLoading.has(`reject-${request.id}`) ? (
                           <Loader2 className="h-4 w-4 animate-spin" />
                         ) : (
                           <UserX className="h-4 w-4" />
                         )}
                       </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sent Requests Tab */}
        <TabsContent value="sent" className="space-y-4">
          {sentRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No sent requests</h3>
                <p className="text-muted-foreground text-center">
                  You haven't sent any friend requests yet
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {request.photoURL ? (
                          <img src={request.photoURL} alt={request.displayName} className="w-10 h-10 rounded-full" />
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{request.displayName}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                                         <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => cancelRequest(request.id)}
                       disabled={actionLoading.has(`cancel-${request.id}`)}
                     >
                       {actionLoading.has(`cancel-${request.id}`) ? (
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                       ) : (
                         <UserX className="h-4 w-4 mr-2" />
                       )}
                       {actionLoading.has(`cancel-${request.id}`) ? 'Cancelling...' : 'Cancel'}
                     </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Add Friends Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Friends</CardTitle>
                                            <CardDescription>
                 Browse all users or search by email/username to send friend requests
               </CardDescription>
             </CardHeader>
            <CardContent className="space-y-4">
                             <form onSubmit={handleSearch} className="flex gap-2">
                 <Input
                   type="text"
                   placeholder="Search by email or username (optional)"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="flex-1"
                 />
                                   <Button type="submit" disabled={searching}>
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
               </form>

                             {searching ? (
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Skeleton className="h-5 w-32" />
                     <Skeleton className="h-8 w-24" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {[...Array(6)].map((_, index) => (
                       <Card key={index} className="hover:shadow-md transition-shadow">
                         <CardContent className="flex items-center justify-between p-4">
                           <div className="flex items-center gap-3">
                             <Skeleton className="w-12 h-12 rounded-full" />
                             <div className="flex-1 min-w-0 space-y-2">
                               <Skeleton className="h-4 w-24" />
                               <Skeleton className="h-3 w-20" />
                             </div>
                           </div>
                           <Skeleton className="h-8 w-16" />
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </div>
               ) : searchQuery.trim() ? (
                // Show search results
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Search Results ({searchResults.length})</h4>
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  </div>
                  {searchResults.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <Search className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No users found</h3>
                                                 <p className="text-muted-foreground text-center">
                           No users found with that email or username
                         </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.map((user) => (
                        <Card key={user.uid} className="hover:shadow-md transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                {user.profile_picture ? (
                                  <img src={user.profile_picture} alt={user.first_name || user.username} className="w-12 h-12 rounded-full" />
                                ) : (
                                  <Users className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {user.first_name && user.last_name 
                                    ? `${user.first_name} ${user.last_name}`.trim()
                                    : user.first_name || user.username || user.email
                                  }
                                </p>
                                                                   <p className="text-sm text-muted-foreground truncate">
                                     @{user.username || user.email}
                                   </p>
                              </div>
                            </div>
                                                         {(() => {
                               const status = userFriendshipStatus[user.uid];
                               const isDisabled = sendingRequests.has(user.uid) || 
                                                 status === 'friends' || 
                                                 status === 'request_sent' || 
                                                 status === 'request_received';
                               
                               let buttonText = 'Add';
                               let buttonIcon = <UserPlus className="h-4 w-4 mr-2" />;
                               
                               if (sendingRequests.has(user.uid)) {
                                 buttonText = 'Sending...';
                                 buttonIcon = <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
                               } else if (status === 'friends') {
                                 buttonText = 'Friends';
                                 buttonIcon = <UserCheck className="h-4 w-4 mr-2" />;
                               } else if (status === 'request_sent') {
                                 buttonText = 'Request Sent';
                                 buttonIcon = <Mail className="h-4 w-4 mr-2" />;
                               } else if (status === 'request_received') {
                                 buttonText = 'Request Received';
                                 buttonIcon = <UserPlus className="h-4 w-4 mr-2" />;
                               }
                               
                               return (
                                 <Button 
                                   size="sm" 
                                   onClick={() => sendFriendRequest(user.uid)}
                                   disabled={isDisabled}
                                   variant={status === 'friends' ? 'outline' : 'default'}
                                 >
                                   {buttonIcon}
                                   {buttonText}
                                 </Button>
                               );
                             })()}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // Show all users with pagination
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">All Users ({allUsers.length})</h4>
                    <p className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                                     {searching ? (
                     <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <Skeleton className="h-5 w-32" />
                         <Skeleton className="h-4 w-20" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {[...Array(6)].map((_, index) => (
                           <Card key={index} className="hover:shadow-md transition-shadow">
                             <CardContent className="flex items-center justify-between p-4">
                               <div className="flex items-center gap-3">
                                 <Skeleton className="w-12 h-12 rounded-full" />
                                 <div className="flex-1 min-w-0 space-y-2">
                                   <Skeleton className="h-4 w-24" />
                                   <Skeleton className="h-3 w-20" />
                                 </div>
                               </div>
                               <Skeleton className="h-8 w-16" />
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                       <div className="flex items-center justify-center space-x-2 mt-6">
                         <Skeleton className="h-8 w-16" />
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-8" />
                         <Skeleton className="h-8 w-16" />
                       </div>
                     </div>
                   ) : allUsers.length === 0 ? (
                     <Card>
                       <CardContent className="flex flex-col items-center justify-center py-8">
                         <Users className="h-12 w-12 text-muted-foreground mb-4" />
                         <h3 className="text-lg font-semibold mb-2">No users found</h3>
                         <p className="text-muted-foreground text-center">
                           No other users are registered yet
                         </p>
                       </CardContent>
                     </Card>
                   ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getPaginatedUsers().map((user) => (
                          <Card key={user.uid} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  {user.profile_picture ? (
                                    <img src={user.profile_picture} alt={user.first_name || user.username} className="w-12 h-12 rounded-full" />
                                  ) : (
                                    <Users className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {user.first_name && user.last_name 
                                      ? `${user.first_name} ${user.last_name}`.trim()
                                      : user.first_name || user.username || user.email
                                    }
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                   @{user.username || user.email}
                                 </p>
                                </div>
                              </div>
                                                             {(() => {
                                 const status = userFriendshipStatus[user.uid];
                                 const isDisabled = sendingRequests.has(user.uid) || 
                                                   status === 'friends' || 
                                                   status === 'request_sent' || 
                                                   status === 'request_received';
                                 
                                 let buttonText = 'Add';
                                 let buttonIcon = <UserPlus className="h-4 w-4 mr-2" />;
                                 
                                 if (sendingRequests.has(user.uid)) {
                                   buttonText = 'Sending...';
                                   buttonIcon = <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
                                 } else if (status === 'friends') {
                                   buttonText = 'Friends';
                                   buttonIcon = <UserCheck className="h-4 w-4 mr-2" />;
                                 } else if (status === 'request_sent') {
                                   buttonText = 'Request Sent';
                                   buttonIcon = <Mail className="h-4 w-4 mr-2" />;
                                 } else if (status === 'request_received') {
                                   buttonText = 'Request Received';
                                   buttonIcon = <UserPlus className="h-4 w-4 mr-2" />;
                                 }
                                 
                                 return (
                                   <Button 
                                     size="sm" 
                                     onClick={() => sendFriendRequest(user.uid)}
                                     disabled={isDisabled}
                                     variant={status === 'friends' ? 'outline' : 'default'}
                                   >
                                     {buttonIcon}
                                     {buttonText}
                                   </Button>
                                 );
                               })()}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                      />
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Friends;
