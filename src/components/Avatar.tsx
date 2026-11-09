'use client';

import React from 'react';

interface AvatarProps {
  username: string;
  size?: number;
}

export default function Avatar({ username, size = 32 }: AvatarProps) {
  // Extract first 2 characters as initials
  const initials = username ? username.substring(0, 2).toUpperCase() : '??';

  // Palette gradients mapping
  const gradients = [
    'from-purple-600 to-cyan-500 text-black',
    'from-pink-500 to-rose-600 text-white',
    'from-cyan-500 to-emerald-400 text-black',
    'from-indigo-600 to-violet-500 text-white',
    'from-amber-400 to-orange-600 text-black',
    'from-fuchsia-500 to-pink-600 text-white',
    'from-emerald-500 to-teal-600 text-white',
    'from-blue-600 to-indigo-500 text-white'
  ];

  // Stable hash based on username to ensure same user always gets the same gradient
  let hash = 0;
  if (username) {
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  
  const index = Math.abs(hash) % gradients.length;
  const selectedGradient = gradients[index];

  return (
    <div
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      className={`rounded-full bg-gradient-to-br ${selectedGradient} flex items-center justify-center font-black select-none shadow-md shrink-0`}
    >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
