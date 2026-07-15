import { Suspense } from 'react';
import ChatContent from './ChatContent';
import { Loader2 } from 'lucide-react';

export default function AIChatPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
