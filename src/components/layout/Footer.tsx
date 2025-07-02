import React from 'react';

export function Footer() {
  return (
    <footer className="w-full border-t bg-white">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          © {new Date().getFullYear()} drt-pREWA Protocol. All rights reserved.
        </p>
      </div>
    </footer>
  );
}