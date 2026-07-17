import React from 'react';

interface AdminPageWrapperProps {
    children: React.ReactNode;
}

export default function AdminPageWrapper({ children }: AdminPageWrapperProps) {
    return (
        <div className="flex flex-col flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-[calc(100vh-4rem)]">
            {children}
        </div>
    );
}
