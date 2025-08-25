import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './authContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [systemNotificationCount, setSystemNotificationCount] = useState(0);

  // Listen to unread messages in chats
  useEffect(() => {
    console.log('NotificationContext - currentUser:', currentUser?.uid);
    
    if (!currentUser?.uid) {
      setUnreadCount(0);
      setNotifications([]);
      setSystemNotificationCount(0);
      return;
    }

    // Listen to chats with unread messages
    const chatsQuery = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      let totalUnread = 0;
      
      snapshot.docs.forEach((doc) => {
        const chatData = doc.data();
        if (!chatData.deletedForEveryone) {
          const chatUnread = chatData?.unreadMessages?.[currentUser.uid] || 0;
          totalUnread += chatUnread;
        }
      });
      
      setUnreadCount(totalUnread);
    });

    // Listen to notifications - without orderBy to avoid compound query issues
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      console.log('Raw notifications snapshot:', snapshot.docs.length, 'documents');
      
      const allNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('All notifications for user:', allNotifications);
      
      const notificationList = allNotifications
        .filter(notification => !notification.read) // Filter unread notifications client-side
        .sort((a, b) => {
          // Sort by timestamp descending (most recent first)
          const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return timeB - timeA;
        });
      
      console.log('Filtered unread notifications:', notificationList);
      setNotifications(notificationList);
      setSystemNotificationCount(notificationList.length);
    }, (error) => {
      console.error('Error listening to notifications:', error);
    });

    return () => {
      unsubscribeChats();
      unsubscribeNotifications();
    };
  }, [currentUser?.uid]);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        batch.update(notificationRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value = {
    unreadCount,
    notifications,
    systemNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
