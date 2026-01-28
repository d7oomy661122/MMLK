import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  label?: string;
}

export const Input: React.FC<InputProps> = ({ leftElement, rightElement, label, className, ...props }) => {
  return (
    <div className="mb-5">
      {label && <label className="block text-xs font-bold text-gray-400 mb-2 mr-1">{label}</label>}
      <div className="relative group brand-input rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300">
        <input
          className={`w-full bg-transparent text-white py-3.5 px-4 text-right focus:outline-none text-base placeholder-gray-600 font-medium ${className} ${leftElement ? 'pl-12' : ''} ${rightElement ? 'pr-12' : ''}`}
          {...props}
        />
        {leftElement && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 flex items-center justify-center transition-colors group-focus-within:text-primary">
            {leftElement}
          </div>
        )}
        {rightElement && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 flex items-center justify-center pointer-events-none">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  );
};