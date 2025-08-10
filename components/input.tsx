'use client';
import { useState } from 'react';

interface InputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const Input = ({ 
  placeholder,
  value,
  onChange,
  label = "",
  error = "",
  disabled = false,
  className = ""
}: InputProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className={`relative ${className} w-2/3 mx-auto`}>
      {label && (
        <label className={`block text-sm font-bold mb-2 transition-colors text-center ${
          error ? 'text-red-500' : 'text-gray-700'
        }`}>
          {label}
        </label>
      )}
      
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full px-0 py-0 text-gray-900 placeholder-gray-400 bg-transparent text-center
          border-0 border-b-2 transition-all duration-200 ease-in-out
          outline-none focus:outline-none focus:ring-0
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-300 focus:border-red-500' 
            : focused 
              ? 'border-gray-900' 
              : 'border-gray-300 hover:border-gray-400'
          }
        `}
      />
      
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
};

export default Input;