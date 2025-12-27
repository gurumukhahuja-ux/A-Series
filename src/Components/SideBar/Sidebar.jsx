import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router';
import {
  LayoutGrid,
  MessageSquare,
  ShoppingBag,
  Bot,
  Settings,
  LogOut,
  Zap,
  X,
  Video,
  FileText,
  Bell
} from 'lucide-react';
import { apis, AppRoute } from '../../types';
import NotificationBar from '../NotificationBar/NotificationBar.jsx';
import { useRecoilState } from 'recoil';
import { clearUser, getUserData, toggleState } from '../../userStore/userData';
import axios from 'axios';



const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifiyTgl, setNotifyTgl] = useRecoilState(toggleState)
  const userData = JSON.parse(
    localStorage.getItem('user') || '{"name":"User","email":"user@example.com","role":"user"}'
  )
  const [user, setUser] = useState(userData)
  const [notifications, setNotifications] = useState([]);

  const handleLogout = () => {
    localStorage.clear();
    navigate(AppRoute.LANDING);
  };
  const token = getUserData()?.token

  useEffect(() => {
    // User data
    axios.get(apis.user, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.error(err);
      if (err.status == 401) {
        clearUser()
        navigate(AppRoute.LOGIN)
      }

    })

    // Notifications
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(apis.notifications, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error("Notifications fetch failed", err);
      }
    };

    if (token) {
      fetchNotifications();
      // Refresh every 5 mins
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token])

  // Dynamic class for active nav items
  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium border border-transparent ${isActive
      ? 'bg-primary/10 text-primary border-primary/10'
      : 'text-subtext hover:bg-surface hover:text-maintext'
    }`;



  return (
    <>
      {/* Mobile Background Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      {notifiyTgl.notify && <div className='fixed w-full z-10 flex justify-center items-center mt-5 ml-6'>
        <NotificationBar msg={"Successfully Owned"} />
      </div>}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[100] w-64 bg-secondary border-r border-border 
          flex flex-col transition-transform duration-300 ease-in-out 
          md:relative md:translate-x-0 shadow-2xl md:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-6 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary">AI-Mall</h1>
          </Link>


          <button
            onClick={onClose}
            className="md:hidden p-2 -mr-2 text-subtext hover:text-maintext rounded-lg hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* <NavLink to="/dashboard/overview" className={navItemClass} onClick={onClose}>
            <LayoutGrid className="w-5 h-5" />
            <span>Dashboard</span>
          </NavLink> */}

          <NavLink to="/dashboard/chat" className={navItemClass} onClick={onClose}>
            <MessageSquare className="w-5 h-5" />
            <span>Chat</span>
          </NavLink>

          <NavLink to={AppRoute.MY_AGENTS} className={navItemClass} onClick={onClose}>
            <Bot className="w-5 h-5" />
            <span>My Agents</span>
          </NavLink>


          <NavLink to={AppRoute.MARKETPLACE} className={navItemClass} onClick={onClose}>
            <ShoppingBag className="w-5 h-5" />
            <span>Marketplace</span>
          </NavLink>

          <NavLink to={AppRoute.INVOICES} className={navItemClass} onClick={onClose}>
            <FileText className="w-5 h-5" />
            <span>Billing</span>
          </NavLink>

          {/* <NavLink to="/dashboard/automations" className={navItemClass} onClick={onClose}>
            <Zap className="w-5 h-5" />
            <span>Automations</span>
          </NavLink> */}
          {user.role == "admin" && <NavLink to="/dashboard/admin" className={navItemClass} onClick={onClose}>
            <Settings className="w-5 h-5" />
            <span>Admin</span>
          </NavLink>}

        </div>

        {/* Notifications Section */}
        <div className="px-4 py-2 mt-4">
          <NavLink
            to={AppRoute.NOTIFICATIONS}
            className="flex items-center gap-2 mb-3 px-2 group cursor-pointer"
            onClick={onClose}
          >
            <Bell className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-subtext uppercase tracking-wider group-hover:text-primary transition-colors">Updates</span>
            {notifications.some(n => !n.isRead) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </NavLink>

          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
            {notifications.length > 0 && notifications.map((notif) => (
              <div
                key={notif._id}
                className={`p-2 rounded-lg border text-[11px] transition-all ${notif.type === 'ALERT'
                  ? 'bg-red-50 border-red-100 text-red-700'
                  : 'bg-surface border-border text-subtext'
                  } ${!notif.isRead ? 'ring-1 ring-primary/20' : 'opacity-80'}`}
              >
                <p className="font-bold mb-1">{notif.title}</p>
                <p className="leading-tight">{notif.message}</p>
              </div>
            ))}
          </div>
          {notifications.length > 0 && (
            <NavLink
              to={AppRoute.NOTIFICATIONS}
              className="mt-2 px-2 text-[10px] font-bold text-primary hover:underline block text-center"
              onClick={onClose}
            >
              View All Notifications
            </NavLink>
          )}
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-2 py-3 mb-2 rounded-xl hover:bg-surface border border-transparent hover:border-border cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
              {user.name.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-maintext truncate">{user.name}</p>
              <p className="text-xs text-subtext truncate">{user.email}</p>
            </div>
          </div>
          {user.name !== "User" &&
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 w-full rounded-lg text-subtext hover:text-red-500 hover:bg-red-50 transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>}

        </div>
      </div>
    </>
  );
};

export default Sidebar;