import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  User,
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
  Bell,

  DollarSign,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { apis, AppRoute } from '../../types';
import { faqs } from '../../constants'; // Import shared FAQs
import NotificationBar from '../NotificationBar/NotificationBar.jsx';
import { useRecoilState } from 'recoil';
import { clearUser, getUserData, toggleState, userData } from '../../userStore/userData';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { t, language, region, regionFlags } = useLanguage();
  const { theme, setTheme } = useTheme();

  const getFlagUrl = (code) => `https://flagcdn.com/w40/${code.toLowerCase()}.png`;

  const navigate = useNavigate();
  const [notifiyTgl, setNotifyTgl] = useRecoilState(toggleState)
  const [currentUserData, setUserRecoil] = useRecoilState(userData);
  const user = currentUserData.user || getUserData() || { name: "Loading...", email: "...", role: "user" };
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null); // null, 'success', 'error'
  const [issueText, setIssueText] = useState("");
  const [activeTab, setActiveTab] = useState("faq");
  const [issueType, setIssueType] = useState("General Inquiry");

  const issueOptions = [
    "General Inquiry",
    "Payment Issue",
    "Refund Request",
    "Technical Support",
    "Account Access",
    "Other"
  ];

  const handleSupportSubmit = async () => {
    if (!issueText.trim()) return;

    setIsSending(true);
    setSendStatus(null);

    try {
      await axios.post(apis.support, {
        email: user?.email || "guest@ai-mall.in",
        issueType,
        message: issueText,
        userId: user?.id || null
      });
      setSendStatus('success');
      setIssueText(""); // Clear text
      setTimeout(() => setSendStatus(null), 3000); // Reset status after 3s
    } catch (error) {
      console.error("Support submission failed", error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate(AppRoute.LANDING);
  };
  const token = getUserData()?.token

  useEffect(() => {
    // User data
    if (token) {
      axios.get(apis.user, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((res) => {
        if (res.data) {
          setUserRecoil({ user: res.data });
          setUserData(res.data);
        }
      }).catch((err) => {
        console.error(err);
        if (err.status == 401) {
          clearUser()
          navigate(AppRoute.LOGIN)
        }
      })
    }

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
  if (notifiyTgl.notify) {
    setTimeout(() => {
      setNotifyTgl({ notify: false })
    }, 2000)
  }
  // Dynamic class for active nav items
  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium border border-transparent ${isActive
      ? 'bg-primary/10 text-primary border-primary/10'
      : 'text-subtext hover:bg-surface hover:text-maintext'
    }`;



  return (
    <>
      <AnimatePresence>
        {notifiyTgl.notify && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className='fixed w-full z-10 flex justify-center items-center mt-5 ml-6'
          >
            <NotificationBar msg={"Successfully Owned"} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for Mobile/Tablet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-[100] w-full sm:w-72 lg:w-64 bg-secondary border-r border-border 
          flex flex-col transition-transform duration-300 ease-in-out 
          lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="p-6 flex items-center justify-between">
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary">A-Series <sup className="text-sm">TM</sup></h1>
          </Link>


          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-subtext hover:text-maintext rounded-lg hover:bg-surface"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <NavLink to="/dashboard/chat" className={navItemClass} onClick={onClose}>
            <MessageSquare className="w-5 h-5" />
            <span>{t('chat')}</span>
          </NavLink>

          <NavLink to={AppRoute.MY_AGENTS} className={navItemClass} onClick={onClose}>
            <Bot className="w-5 h-5" />
            <span>{t('myAgents')}</span>
          </NavLink>

          <NavLink to={AppRoute.MARKETPLACE} className={navItemClass} onClick={onClose}>
            <ShoppingBag className="w-5 h-5" />
            <span>{t('marketplace')}</span>
          </NavLink>

          {/* <NavLink to="/vendor/overview" className={navItemClass} onClick={onClose}>
            <LayoutGrid className="w-5 h-5" />
            <span>{t('vendorDashboard')}</span>
          </NavLink> */}

          {/*<NavLink to={AppRoute.INVOICES} className={navItemClass} onClick={onClose}>
            <FileText className="w-5 h-5" />
            <span>{t('billing')}</span>
          </NavLink>*/}



          {/* <NavLink to="/dashboard/automations" className={navItemClass} onClick={onClose}>
            <Zap className="w-5 h-5" />
            <span>Automations</span>
          </NavLink> */}
          <NavLink to={AppRoute.ADMIN} className={navItemClass} onClick={onClose}>
            <Settings className="w-5 h-5" />
            <span>{t('adminDashboard')}</span>
          </NavLink>
        </div>

        {/* Notifications Section */}
        <div className="px-4 py-2 mt-4">
          <NavLink
            to={AppRoute.NOTIFICATIONS}
            className="flex items-center gap-2 mb-3 px-2 group cursor-pointer"
            onClick={onClose}
          >
            <Bell className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold text-subtext uppercase tracking-wider group-hover:text-primary transition-colors">{t('updates')}</span>
            {notifications.some(n => !n.isRead) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            )}
          </NavLink>

          <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-none">
            {(() => {
              // Check settings directly from localStorage to ensure immediate feedback
              const settings = JSON.parse(localStorage.getItem('user_settings') || '{}');
              const showNotifications = settings.pushNotif !== false; // Default to true if not set

              if (!showNotifications) {
                return (
                  <div className="p-4 text-center text-xs text-subtext italic opacity-60">
                    Notifications are disabled.
                  </div>
                );
              }

              return notifications.length > 0 ? notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-2 rounded-lg border text-[11px] transition-all ${notif.type === 'ALERT'
                    ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
                    : 'bg-card border-border text-subtext'
                    } ${!notif.isRead ? 'ring-1 ring-primary/20' : 'opacity-80'}`}
                >
                  <p className="font-bold mb-1">{notif.title}</p>
                  <p className="leading-tight">{notif.message}</p>
                </div>
              )) : (
                <div className="p-2 text-center text-xs text-subtext opacity-60">No new notifications</div>
              );
            })()}
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
          {token ? (
            /* Integrated Profile Card */
            <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isProfileOpen ? 'bg-card border-border shadow-md' : 'border-transparent hover:bg-secondary'}`}>
              {/* Header / Toggle */}
              <div className="flex items-center gap-1 group">
                <div
                  onClick={() => {
                    navigate(AppRoute.PROFILE);
                    onClose();
                  }}
                  className="flex flex-1 items-center gap-3 px-3 py-3 cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0 overflow-hidden border border-primary/10">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          // Fallback to text initial
                          const parent = e.target.parentElement;
                          if (parent) {
                            parent.classList.add("flex", "items-center", "justify-center");
                            parent.innerText = user.name ? user.name.charAt(0).toUpperCase() : "U";
                          }
                        }}
                      />
                    ) : (
                      user.name ? user.name.charAt(0).toUpperCase() : "U"
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-maintext truncate">{user.name}</p>
                    <p className="text-[11px] text-subtext truncate">{user.email}</p>
                  </div>
                </div>

                <div
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`p-3 cursor-pointer transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-primary' : 'text-subtext group-hover:text-maintext'}`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Expandable Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-2 pb-2">
                      <div className="h-[1px] bg-border/40 mx-2 mb-2" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all text-[13px] font-medium"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t('logOut')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Guest / Login State */
            <div
              onClick={() => navigate(AppRoute.LOGIN)}
              className="rounded-2xl border border-transparent hover:bg-secondary transition-all cursor-pointer flex items-center gap-3 px-3 py-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0 border border-primary/10 group-hover:bg-primary/20 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="font-bold text-maintext text-sm group-hover:text-primary transition-colors">
                Log In
              </div>
            </div>
          )}

          <div className="mt-1 flex flex-col gap-1">
            {/* Region/Language Indicator - Only show if logged in */}
            {token && (
              <button
                onClick={() => {
                  navigate(AppRoute.PROFILE, { state: { openLanguage: true, timestamp: Date.now() } });
                  onClose();
                }}
                className="group flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-subtext hover:bg-secondary hover:text-maintext transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-border"
              >
                <img
                  src={getFlagUrl(regionFlags[region] || 'in')}
                  alt={region}
                  className="w-4 h-3 object-cover rounded-sm shadow-sm"
                />
                <span>{regionFlags[region] || 'IN'} - {language.substring(0, 2).toUpperCase()}</span>
              </button>
            )}

            {/* FAQ Button */}
            <button
              onClick={() => setIsFaqOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-lg text-subtext hover:bg-secondary hover:text-maintext transition-all text-sm border border-transparent hover:border-border"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{t('helpFaq')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Modal */}
      {isFaqOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">

            <div className="p-6 border-b border-border flex justify-between items-center bg-secondary">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('faq')}
                  className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'faq' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                >
                  FAQ
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className={`text-lg font-bold px-4 py-2 rounded-lg transition-colors ${activeTab === 'help' ? 'bg-primary/10 text-primary' : 'text-subtext hover:text-maintext'}`}
                >
                  Help
                </button>
              </div>
              <button
                onClick={() => setIsFaqOpen(false)}
                className="p-2 hover:bg-black/5 rounded-full text-subtext transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTab === 'faq' ? (
                <>
                  <p className="text-sm text-subtext font-medium">Get quick answers to common questions about our platform</p>
                  {faqs.map((faq, index) => (
                    <div key={index} className="border border-border rounded-xl bg-card overflow-hidden hover:border-primary/30 transition-all">
                      <button
                        onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                        className="w-full flex justify-between items-center p-4 text-left hover:bg-secondary transition-colors focus:outline-none"
                      >
                        <span className="font-semibold text-maintext text-[15px]">{faq.question}</span>
                        {openFaqIndex === index ? (
                          <ChevronUp className="w-4 h-4 text-primary" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-subtext" />
                        )}
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? 'max-h-96 opacity-100 bg-secondary/50' : 'max-h-0 opacity-0'
                          }`}
                      >
                        <div className="p-4 pt-0 text-subtext text-sm leading-relaxed border-t border-border/50 mt-2 pt-3">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col gap-6">

                  {/* Issue Type Dropdown */}
                  <div>
                    <label className="block text-sm font-bold text-maintext mb-2">Select Issue Category</label>
                    <div className="relative">
                      <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="w-full p-4 pr-10 rounded-xl bg-secondary border border-border focus:border-primary outline-none appearance-none text-maintext font-medium cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        {issueOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-subtext pointer-events-none" />
                    </div>
                  </div>

                  {/* Issue Description */}
                  <div>
                    <label className="block text-sm font-bold text-maintext mb-2">Describe your issue</label>
                    <textarea
                      className="w-full p-4 rounded-xl bg-secondary border border-border focus:border-primary outline-none resize-none text-maintext min-h-[150px]"
                      placeholder="Please provide details about the problem you are facing..."
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleSupportSubmit}
                    disabled={isSending || !issueText.trim()}
                    className={`flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 ${isSending || !issueText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  >
                    {isSending ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5" />
                        Send to Support
                      </>
                    )}
                  </button>

                  {sendStatus === 'success' && (
                    <div className="p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-sm text-center font-medium border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                      Tciket Submitted Successfully! Our team will contact you soon.
                    </div>
                  )}

                  {sendStatus === 'error' && (
                    <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                      Failed to submit ticket. Please try again or email us directly.
                    </div>
                  )}

                  <p className="text-xs text-center text-subtext">
                    Or email us directly at <a href="mailto:support@a-series.in" className="text-primary font-medium hover:underline">support@a-series.in</a>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-surface text-center">
              <button
                onClick={() => setIsFaqOpen(false)}
                className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
