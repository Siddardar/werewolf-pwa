'use client';

import Image from "next/image";
import MainButton from "@/components/main-button";
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  const WEREWOLF_ICON = "/characters/werewolf.png";

  const handleCreateGame = () => {
    console.log("Create Game button clicked");
    router.push('/create-game');  
  }

  const handleJoinGame = () => {
    console.log("Join Game button clicked");
    router.push('/join-game');
  }

  return (
    <div className="bg-gray-50 flex flex-col items-center justify-center px-4" style={{ height: '100dvh' }}>
      <div className="w-full max-w-md mx-auto space-y-8">
        
        {/* Logo/Icon */}
        <div className="text-center">
          <Image 
            src={WEREWOLF_ICON} 
            alt="Werewolf Icon" 
            width={225} 
            height={225}
            className="mx-auto"
            priority
          />
        </div>
        
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-black tracking-wide">
            WEREWOLF
          </h1>
          <p className="text-gray-600 text-sm tracking-widest uppercase">
            SOCIAL DEDUCTION GAME
          </p>
        </div>
        
        {/* Buttons */}
        <div className="space-y-4 flex flex-col items-center">
          <MainButton 
            variant="black" 
            onClick={handleCreateGame}
            className="w-64"
            
          >
            CREATE GAME
          </MainButton>

          <MainButton 
            variant="white" 
            onClick={handleJoinGame}
            className="w-64"
          >
            JOIN GAME
          </MainButton>
        </div>
      </div>
    </div>
  );
}
