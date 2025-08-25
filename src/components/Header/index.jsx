import { useAuth } from "../../contexts/authContext";
import { useNotifications } from "../../contexts/notificationContext";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import NotificationDropdown from "./NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ThemeToggle } from "../theme-toggle";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
  Home, 
  LogOut, 
  User, 
  Heart, 
  Clock, 
  AlertTriangle, 
  Star,
  Sparkles,
  TrendingUp,
  Users,
  Tag,
  History,
  MessageCircle,
  Film,
  List
} from "lucide-react";
import { useState, useCallback } from "react";
import { doSignOut } from "../../Auth";

const Header = () => {
  const navigate = useNavigate();
  const { userLoggedIn, currentUser } = useAuth();
  const { unreadCount, systemNotificationCount } = useNotifications();
  
  console.log('Header - unreadCount:', unreadCount);
  console.log('Header - systemNotificationCount:', systemNotificationCount);

  const handleCategoryClick = useCallback((category) => {
    navigate(`/${category.toLowerCase()}`);
  }, [navigate]);

  const handleFavoritesClick = useCallback(() => {
    navigate("/favorites");
  }, [navigate]);

  const handleWatchlistClick = useCallback(() => {
    navigate("/watchlist");
  }, [navigate]);

  const handleHomeClick = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await doSignOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }, [navigate]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Navigation */}
        <div className="flex items-center space-x-6">
          <Link to="/home" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Film className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">MovieRec</span>
          </Link>

          {userLoggedIn && (
            <nav className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleHomeClick}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/favorites")}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                Favorites
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/watchlist")}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Watchlist
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/urgent")}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Urgent
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/recommended")}
                className="flex items-center gap-2"
              >
                <Star className="h-4 w-4" />
                Recommended
              </Button>
              

              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/friends")}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Friends
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/chat")}
                className="flex items-center gap-2 relative"
              >
                <MessageCircle className="h-4 w-4" />
                Chat
                {unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </nav>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          <NotificationDropdown />
          <ThemeToggle />
          
          {userLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser?.photoURL} alt={currentUser?.displayName} />
                    <AvatarFallback>
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser?.displayName || "User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/trending")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Trending</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/tags")}>
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Tags</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" />
                  <span>History</span>
                </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate("/chat")} className="relative">
                    <List className="mr-2 h-4 w-4" />
                    <span>Chat</span>
                    {unreadCount > 0 && (
                      <Badge 
                        variant="default" 
                        className="ml-auto h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/group-chat")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Group Chat</span>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
