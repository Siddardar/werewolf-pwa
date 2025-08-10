'use client';

interface CardProps {
  image: string;
  title: string;
  description: string;
  selectable?: boolean;
  selected?: boolean;
  flipped?: boolean;
  onSelect?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  image,
  title,
  description,
  selectable = false,
  selected = false,
  flipped = false,
  onSelect
}) => {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect();
    }
  };

  return (
    <div className="perspective-1000 w-64 h-96 mx-auto">
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          flipped ? 'rotate-y-180' : ''
        } ${selectable ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleClick}
      >
        {/* Front of card */}
        <div className={`absolute inset-0 backface-hidden bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all duration-200 ${
          selected ? 'grayscale brightness-60 contrast-125' : ''
        }`}>
          {/* Inner black border */}
          <div className="absolute inset-2 border border-black rounded-lg pointer-events-none z-10"></div>
          
          {/* Selection tick covering whole card */}
          {selected && (
            <div className="absolute inset-0 flex items-center justify-center z-20 animate-in fade-in duration-200">
              <svg 
                className="w-56 h-56 text-gray-400 drop-shadow-lg" 
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                viewBox="0 0 24 24"
              >
                <path 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}
          
          <div className="flex flex-col h-full">
            {/* Centered Image */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-48 h-48">
                <img 
                  src={image} 
                  alt={title}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            
            {/* Title and Description at Bottom */}
            <div className="px-4 pb-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-3 tracking-wide uppercase">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed italic">{description}</p>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-black rounded-xl shadow-xl border border-gray-600 overflow-hidden">
          {/* Inner border for back */}
          <div className="absolute inset-2 border border-gray-600 rounded-lg pointer-events-none z-10"></div>
          
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-2xl text-gray-400">?</span>
              </div>
              <h3 className="text-lg font-bold text-gray-400 mb-2">HIDDEN</h3>
              <p className="text-xs text-gray-500">Role Concealed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;