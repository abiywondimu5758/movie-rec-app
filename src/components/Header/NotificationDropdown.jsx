import { useState, useEffect } from 'react';
import { useNotifications } from '../../contexts/notificationContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Bell, MessageCircle, Trash2, Check, UserPlus, UserCheck, UserX, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const NotificationDropdown = () => {
  const { notifications, systemNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  console.log('NotificationDropdown - notifications:', notifications);
  console.log('NotificationDropdown - systemNotificationCount:', systemNotificationCount);

  const handleNotificationClick = async (notification) => {
    // Mark as read
    await markNotificationAsRead(notification.id);
    
               // Navigate based on notification type
           if (notification.type === 'new_chat' && notification.chatId) {
             navigate(`/private-chat/${notification.chatId}`);
           } else if (notification.type === 'chat_deleted') {
             navigate('/chat');
           } else if (notification.type === 'friend_request' || notification.type === 'friend_accepted' || notification.type === 'friend_rejected') {
             navigate('/friends');
           } else if (notification.type === 'group_invite' || notification.type === 'group_removed') {
             if (notification.groupId) {
               navigate(`/group-chat/${notification.groupId}`);
             } else {
               navigate('/group-chat');
             }
           }
    
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };



           const getNotificationIcon = (type) => {
           switch (type) {
             case 'new_chat':
               return <MessageCircle className="h-4 w-4" />;
             case 'chat_deleted':
               return <Trash2 className="h-4 w-4" />;
             case 'friend_request':
               return <UserPlus className="h-4 w-4" />;
             case 'friend_accepted':
               return <UserCheck className="h-4 w-4" />;
             case 'friend_rejected':
               return <UserX className="h-4 w-4" />;
             case 'group_invite':
               return <Users className="h-4 w-4" />;
             case 'group_removed':
               return <UserX className="h-4 w-4" />;
             default:
               return <Bell className="h-4 w-4" />;
           }
         };

           const getNotificationColor = (type) => {
           switch (type) {
             case 'new_chat':
               return 'text-blue-600';
             case 'chat_deleted':
               return 'text-red-600';
             case 'friend_request':
               return 'text-green-600';
             case 'friend_accepted':
               return 'text-blue-600';
             case 'friend_rejected':
               return 'text-red-600';
             case 'group_invite':
               return 'text-purple-600';
             case 'group_removed':
               return 'text-red-600';
             default:
               return 'text-gray-600';
           }
         };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
                     {systemNotificationCount > 0 && (
             <Badge 
               variant="default" 
               className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-blue-500 hover:bg-blue-600"
             >
               {systemNotificationCount > 99 ? '99+' : systemNotificationCount}
             </Badge>
           )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-6 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-accent"
              >
                <div className={`mt-0.5 ${getNotificationColor(notification.type)}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {notification.title}
                    </p>
                    {notification.timestamp && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(notification.timestamp.toDate(), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
