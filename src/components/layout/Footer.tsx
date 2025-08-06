import React from "react";

export function Footer() {
  return (
    <footer className="w-full border-t border-greyscale-200/60 bg-white transition-colors duration-200 dark:border-dark-border dark:bg-dark-surface">
      <div className="container mx-auto flex h-16 items-center justify-center px-4 lg:px-8 sm:px-6">
        <p className="text-center text-sm text-greyscale-500 dark:text-dark-text-secondary">
          © {new Date().getFullYear()} Dharitri Protocol. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
