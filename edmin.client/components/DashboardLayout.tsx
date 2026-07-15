'use client';

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { UserRole, Notification } from '@/types/types';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole: UserRole;
    userName?: string;
    userAvatar?: string;
    notifications: Notification[];
    currentPath?: string;
}

export default function DashboardLayout({
    children,
    userRole,
    userName,
    userAvatar,
    notifications,
    currentPath,
}: DashboardLayoutProps) {
    const { data: currentUser, isLoading } = useCurrentUser();
    const effectiveUserName = currentUser?.fullName || userName || (isLoading ? 'Loading...' : 'User');

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        const storedState = localStorage.getItem('sidebarOpen');
        if (storedState !== null) {
            setIsSidebarOpen(storedState === 'true');
        }
    }, []);

    // Prevent hydration mismatch by rendering a consistent server state first
    if (!isMounted) {
        return null; // Or a loading skeleton if preferred, but for layout null/default is often safer to avoid flash
    }

    const handleSidebarToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newState = e.target.checked;
        setIsSidebarOpen(newState);
        localStorage.setItem('sidebarOpen', String(newState));
    };

    const roleLower = String(userRole).toLowerCase() as UserRole;

    return (
        <div className="drawer">
            <input
                id="dashboard-drawer"
                type="checkbox"
                className="drawer-toggle"
                checked={isSidebarOpen}
                onChange={handleSidebarToggle}
            />

            <div className="drawer-content flex flex-col">
                {/* Navbar */}
                <Navbar
                    userRole={roleLower}
                    userName={effectiveUserName}
                    userAvatar={userAvatar}
                    notifications={notifications}
                />

                {/* Page content */}
                <div className="flex-1 overflow-x-hidden">
                    {children}
                </div>
            </div>

            <div className="drawer-side z-40">
                <label
                    htmlFor="dashboard-drawer"
                    aria-label="close sidebar"
                    className="drawer-overlay"
                ></label>
                <Sidebar
                    userRole={roleLower}
                    roles={currentUser?.roles}
                    designation={currentUser?.designation}
                    userName={effectiveUserName}
                    userAvatar={userAvatar}
                    currentPath={currentPath}
                    isOpen={isSidebarOpen}
                />
            </div>
        </div>
    );
}
