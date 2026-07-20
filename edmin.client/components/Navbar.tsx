'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, User, Settings, LogOut, KeyRound, Menu, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Notification } from '@/types/types';

import { UserRole } from '@/types/types';
import Link from 'next/link';

import { useNotifications } from '@/features/notifications/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';

interface NavbarProps {
    userRole?: UserRole;
    userName: string;
    userAvatar?: string;
    notifications?: Notification[];
}

export default function Navbar({ userRole, userName, userAvatar }: NavbarProps) {
    const { logout } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    const { notifications: hookNotifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    const notifications = hookNotifications.map(n => ({
        id: n.notificationid.toString(),
        title: n.title,
        message: n.message,
        timestamp: new Date(n.createdat),
        read: n.isread,
        type: n.type || 'info'
    }));


    // Set mounted state on client side only
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type: string) => {
        const iconClasses = "h-4 w-4";
        switch (type) {
            case 'success': return <CheckCircle className={`${iconClasses} text-success-text`} strokeWidth={1.5} />;
            case 'warning': return <AlertTriangle className={`${iconClasses} text-warning-text`} strokeWidth={1.5} />;
            case 'error': return <XCircle className={`${iconClasses} text-error-text`} strokeWidth={1.5} />;
            default: return <Info className={`${iconClasses} text-text-primary`} strokeWidth={1.5} />;
        }
    };

    const formatNotificationTime = (date: Date) => {
        if (!mounted) return 'Just now';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <nav className="sticky top-0 z-50 bg-surface border-b border-[#D2D0CE] shadow-sm" style={{ height: '48px' }}>
            <div className="flex items-center justify-between px-3 h-12 max-w-[1920px] mx-auto">
                {/* Left Side - Toggle Button and Logo */}
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="dashboard-drawer"
                        className="flex items-center justify-center w-8 h-8 hover:bg-surface-hover transition-colors cursor-pointer rounded-[2px]"
                        aria-label="Toggle sidebar"
                    >
                        <Menu className="h-5 w-5 text-text-primary" strokeWidth={1.5} />
                    </label>
                    <Link href={userRole ? `/dashboard/${userRole}` : '/'}>
                        <img src="/edmin-logo.png" alt="Edmin Logo" className="h-5 w-auto object-contain " />
                    </Link>
                </div>

                {/* Right Side - Notifications and Profile */}
                <div className="flex items-center gap-1">
                    {/* Notifications Dropdown */}
                    <div className="relative" ref={notificationRef}>
                        <button type="button"
                            onClick={() => {
                                setShowNotifications(!showNotifications);
                                setShowProfile(false);
                            }}
                            className="relative flex items-center justify-center w-8 h-8 hover:bg-surface-hover transition-colors rounded-[2px]"
                            aria-label="Notifications"
                        >
                            <Bell className="h-5 w-5 text-text-primary" strokeWidth={1.5} />
                            {unreadCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-[2px] bg-primary text-[9px] font-semibold text-white">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications Dropdown Menu */}
                        {showNotifications && (
                            <div className="fixed md:absolute inset-0 md:inset-auto md:right-0 md:mt-1 md:w-80 lg:w-96 md:max-h-[calc(100vh-60px)] h-full md:h-auto overflow-y-auto bg-surface md:border md:border-border z-50 rounded-[2px]">
                                <div className="sticky top-0 bg-surface border-b border-border px-4 py-2.5">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-sm text-text-primary">Notifications</h3>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <button type="button"
                                                    onClick={() => markAllAsRead()}
                                                    className="px-2 py-1 text-[10px] font-semibold text-text-primary hover:bg-surface-hover rounded-[2px] transition-colors uppercase tracking-wide"
                                                >
                                                    Mark all read
                                                </button>
                                            )}
                                            <button type="button"
                                                onClick={() => setShowNotifications(false)}
                                                className="md:hidden p-1.5 hover:bg-surface-hover rounded-[2px] transition-colors"
                                                aria-label="Close notifications"
                                            >
                                                <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-[#EDEBE9]">
                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-text-muted text-sm">
                                            No notifications
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => {
                                                    if (!notification.read) {
                                                        markAsRead(parseInt(notification.id, 10));
                                                    }
                                                }}
                                                className={`px-4 py-3 hover:bg-surface-hover transition-colors cursor-pointer ${!notification.read ? 'bg-surface-hover' : ''}`}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        {getNotificationIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-semibold text-xs line-clamp-1 text-text-primary">
                                                                {notification.title}
                                                            </p>
                                                            {!notification.read && (
                                                                <div className="h-1.5 w-1.5 rounded-[2px] bg-primary flex-shrink-0 mt-1"></div>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-text-secondary line-clamp-2 mt-0.5">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-[10px] text-text-muted mt-1">
                                                            {formatNotificationTime(notification.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-2">
                                        <Link
                                            href="/dashboard/notifications"
                                            className="block w-full text-center py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-hover rounded-[2px] transition-colors"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            View All Notifications
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative" ref={profileRef}>
                        <button type="button"
                            onClick={() => {
                                setShowProfile(!showProfile);
                                setShowNotifications(false);
                            }}
                            className="flex items-center justify-center w-8 h-8 hover:bg-surface-hover transition-colors rounded-[2px]"
                            aria-label="Profile menu"
                        >
                            <div className="w-7 h-7 rounded-[2px] bg-primary flex items-center justify-center text-white font-semibold text-xs">
                                {userAvatar ? (
                                    <img src={userAvatar} alt={userName} className="rounded-[2px] w-full h-full object-cover" />
                                ) : (
                                    <span>{userName.charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                        </button>

                        {/* Profile Dropdown Menu */}
                        {showProfile && (
                            <div className="absolute right-0 mt-1 w-64 bg-surface border border-border rounded-[2px] overflow-hidden">
                                {/* User Info */}
                                <div className="px-4 py-3 bg-background border-b border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-[2px] bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                            {userAvatar ? (
                                                <img src={userAvatar} alt={userName} className="rounded-[2px] w-full h-full object-cover" />
                                            ) : (
                                                <span>{userName.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-text-primary truncate">{userName}</p>
                                            <p className="text-xs text-text-primary font-medium uppercase tracking-wide mt-0.5">{userRole}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <Link
                                        href="/dashboard/profile"
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
                                        onClick={() => setShowProfile(false)}
                                    >
                                        <User className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
                                        <span className="text-sm text-text-primary">My Profile</span>
                                    </Link>
                                    <Link
                                        href={userRole === 'admin' ? "/dashboard/admin/settings" : userRole === 'hr' ? "/dashboard/hr/settings" : "/dashboard/profile"}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
                                        onClick={() => setShowProfile(false)}
                                    >
                                        <Settings className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
                                        <span className="text-sm text-text-primary">Account Settings</span>
                                    </Link>
                                    <Link
                                        href={userRole === 'admin' ? "/dashboard/admin/settings?tab=security" : "/dashboard/change-password"}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors"
                                        onClick={() => setShowProfile(false)}
                                    >
                                        <KeyRound className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
                                        <span className="text-sm text-text-primary">Security</span>
                                    </Link>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-border py-1">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-error-bg transition-colors"
                                        onClick={() => {
                                            setShowProfile(false);
                                            logout();
                                        }}
                                    >
                                        <LogOut className="h-4 w-4 text-error-text" strokeWidth={1.5} />
                                        <span className="text-sm font-semibold text-error-text">Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
