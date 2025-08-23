import { useRoutes, useLocation, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/authContext";
import { MovieProvider } from "./contexts/movieContext";
import { SeriesProvider } from "./contexts/seriesContext";
import { WatchlistProvider } from "./contexts/watchlistContext";
import { ThemeProvider } from "./components/theme-provider";
import Header from "./components/Header";
import Home from "./components/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Profile from "./components/Home/Profile";
import Favorites from "./components/Home/Favorites";
import Watchlist from "./components/Home/Watchlist";
import Urgent from "./components/Home/Urgent";
import Recommended from "./components/Home/Recommended";

import Trending from "./components/Home/Trending";
import Friends from "./components/Social/Friends";
import Tags from "./components/Home/Tags";
import History from "./components/Home/History";
import Chat from "./components/chats/Chat";
import GlobalChat from "./components/chats/GlobalChat";
import PrivateChat from "./components/chats/PrivateChat";
import GroupChat from "./components/chats/GroupChat";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MovieProvider>
          <SeriesProvider>
            <WatchlistProvider>
              <AppContent />
            </WatchlistProvider>
          </SeriesProvider>
        </MovieProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // Don't show header on login/register pages
  const showHeader = !['/login', '/register'].includes(location.pathname);

  const routes = [
    {
      path: "/",
      element: <Navigate to="/home" replace />,
    },
    {
      path: "/home",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/favorites",
      element: <Favorites />,
    },
    {
      path: "/watchlist",
      element: <Watchlist />,
    },
    {
      path: "/urgent",
      element: <Urgent />,
    },
    {
      path: "/recommended",
      element: <Recommended />,
    },

    {
      path: "/trending",
      element: <Trending />,
    },
    {
      path: "/friends",
      element: <Friends />,
    },
    {
      path: "/tags",
      element: <Tags />,
    },
    {
      path: "/history",
      element: <History />,
    },
    {
      path: "/chat",
      element: <Chat />,
    },
    {
      path: "/global-chat",
      element: <GlobalChat />,
    },
    {
      path: "/private-chat",
      element: <PrivateChat />,
    },
    {
      path: "/group-chat",
      element: <GroupChat />,
    },
  ];

  const routesElement = useRoutes(routes);

  return (
    <>
      {showHeader && <Header />}
      <div className={`w-full h-screen flex flex-col bg-background ${showHeader ? 'pt-16' : ''}`}>
        {routesElement}
      </div>
    </>
  );
}

export default App;
