'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, UserCircle2 } from 'lucide-react';
import { useAvatar, useUploadAvatar } from '@/features/profile/hooks/useProfile';

interface AvatarUploadProps {
  userId?: number;
  role?: string;
  displayName?: string;
  size?: 'sm' | 'md' | 'lg';
  accentColor?: string; // tailwind bg color class e.g. 'bg-primary-light'
  accentTextColor?: string; // e.g. 'text-primary'
}

export default function AvatarUpload({
  userId,
  role,
  displayName = 'User',
  size = 'lg',
  accentColor = 'bg-primary-light',
  accentTextColor = 'text-primary',
}: AvatarUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: avatarUrl, isLoading } = useAvatar(userId, role);
  const uploadAvatar = useUploadAvatar(userId, role);

  const sizeMap = {
    sm: 'w-20 h-20 text-2xl',
    md: 'w-28 h-28 text-3xl',
    lg: 'w-36 h-36 text-4xl',
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    // 5 MB client-side guard
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please choose an image under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      uploadAvatar.mutate(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar circle */}
      <div
        className={`relative group ${sizeMap[size]} rounded-[2px] cursor-pointer`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Image or placeholder */}
        <div
          className={`
            w-full h-full rounded-[2px] border-4 border-white overflow-hidden
            ${accentColor} ${accentTextColor}
            flex items-center justify-center font-bold
            transition-all duration-200
            ${dragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
          `}
        >
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin opacity-50" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className={size === 'sm' ? 'text-xl' : size === 'md' ? 'text-2xl' : 'text-3xl'}>
              {initials || <UserCircle2 className="w-10 h-10 opacity-40" />}
            </span>
          )}
        </div>

        {/* Hover overlay */}
        <div className={`
          absolute inset-0 rounded-[2px] bg-black/50 flex flex-col items-center justify-center gap-1
          opacity-0 group-hover:opacity-100 transition-all duration-200
          ${uploadAvatar.isPending ? 'opacity-100' : ''}
        `}>
          {uploadAvatar.isPending ? (
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6 text-white" />
              <span className="text-white text-[10px] font-bold uppercase tracking-wide">Change</span>
            </>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {/* Helper text */}
      <div className="text-center">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadAvatar.isPending}
          className="text-sm font-semibold text-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {uploadAvatar.isPending ? 'Uploading...' : 'Upload Photo'}
        </button>
        <p className="text-xs text-text-muted mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
      </div>
    </div>
  );
}
