interface MainButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  disabled?: boolean;
  variant: 'black' | 'white';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const MainButton: React.FC<MainButtonProps> = ({ 
  children = "CREATE GAME", 
  disabled = false, 
  variant = "black", 
  onClick,
  className = "",
  ...props 
}) => {
  const baseClasses = "px-8 py-4 font-bold text-sm tracking-wider uppercase transition-all duration-200 border-2";
  
  const variantClasses: Record<'black' | 'white', string> = {
    black: disabled 
      ? "bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed"
      : "bg-black text-white border-black hover:bg-gray-900 hover:border-gray-900 active:scale-95 cursor-pointer",
    white: disabled
      ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
      : "bg-white text-black border-black hover:bg-gray-50 hover:shadow-lg active:scale-95 cursor-pointer"
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
};

export default MainButton;