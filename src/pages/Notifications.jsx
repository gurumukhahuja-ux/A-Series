import React, { useEffect, useState } from 'react';
import { Bell, Check, Trash2, Clock, ShieldAlert, BadgeInfo, BadgeCheck } from 'lucide-react';
import axios from 'axios';
import { apis } from '../types';
import { getUserData } from '../userStore/userData';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = getUserData()?.token;

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await axios.get(apis.notifications, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000 // 5 seconds timeout
                });
                setNotifications(res.data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
                // On error, we still clear loading to show the demo fallback
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchNotifications();
        }
    }, [token]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${apis.notifications}/read/${id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'ALERT': return <ShieldAlert className="w-6 h-6 text-red-500" />;
            case 'SUCCESS': return <BadgeCheck className="w-6 h-6 text-green-500" />;
            default: return <BadgeInfo className="w-6 h-6 text-blue-500" />;
        }
    };

    return (
        <div className="p-4 md:p-8 h-full bg-secondary overflow-y-auto">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-maintext mb-2">Notifications</h1>
                <p className="text-sm md:text-base text-subtext">Stay updated with your account and subscription status.</p>
            </div>

            <div className="grid gap-4 max-w-3xl">
                {/* 1. Welcome Notification - ALWAYS SHOW IMMEDIATELY */}
                <div className="bg-white p-6 rounded-2xl border border-primary/20 ring-1 ring-primary/5 shadow-sm flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-50">
                        <BadgeInfo className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-maintext">Welcome to AI-Mall!</h3>
                        <p className="text-sm text-subtext leading-relaxed">
                            We're glad to have you here. This is your notifications center where you'll receive updates about your subscriptions, payments, and new agent launches.
                        </p>
                    </div>
                </div>

                {/* 2. Real Notifications from Backend */}
                {notifications.map((notif) => (
                    <div
                        key={notif._id}
                        className={`bg-white p-5 rounded-2xl border transition-all flex items-start gap-4 shadow-sm hover:shadow-md ${!notif.isRead ? 'border-primary/30 ring-1 ring-primary/5' : 'border-border'
                            }`}
                    >
                        <div className={`p-3 rounded-xl ${notif.type === 'ALERT' ? 'bg-red-50' :
                                notif.type === 'SUCCESS' ? 'bg-green-50' : 'bg-blue-50'
                            }`}>
                            {getIcon(notif.type)}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className={`font-bold ${!notif.isRead ? 'text-maintext' : 'text-subtext'}`}>
                                    {notif.title}
                                </h3>
                                <span className="text-[10px] text-subtext flex items-center gap-1 bg-surface px-2 py-1 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className={`text-sm leading-relaxed ${!notif.isRead ? 'text-subtext' : 'text-subtext/70'}`}>
                                {notif.message}
                            </p>

                            {!notif.isRead && (
                                <button
                                    onClick={() => markAsRead(notif._id)}
                                    className="mt-3 text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                                >
                                    <Check className="w-3 h-3" /> Mark as read
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* 3. Loading State (Subtle Spinner at bottom if needed) */}
                {loading && (
                    <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary/30"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
