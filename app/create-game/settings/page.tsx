'use client';

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";

import Card from "@/components/card";
import Input from "@/components/input";
import MainButton from "@/components/main-button";
import characterMap from "../../../public/characters/character_map.json";

export default function Page() {
    const router = useRouter();
    const { socket } = useSocket();

    const searchParams = useSearchParams();
    
    // Get data from URL params
    const hostName = searchParams.get('host') || '';
    const charactersParam = searchParams.get('characters') || '';
    const selectedCharacters = charactersParam ? charactersParam.split(',') : [];
    
    // State for character quantities
    const [characterQuantities, setCharacterQuantities] = useState<Record<string, number>>({});
    const [dayTimeMinutes, setDayTimeMinutes] = useState("5");
    const [nightTimeMinutes, setNightTimeMinutes] = useState("2");
    
    // Initialize quantities to 1 for all selected characters
    useEffect(() => {
        const initialQuantities: Record<string, number> = {};
        selectedCharacters.forEach(char => {
            initialQuantities[char] = 1;
        });
        setCharacterQuantities(initialQuantities);
    }, []);
    
    const handleQuantityChange = (characterKey: string, quantity: number) => {
        if (quantity > 0) {
            setCharacterQuantities(prev => ({
                ...prev,
                [characterKey]: quantity
            }));
        }
    };
    
    const handleCreateGame = () => {
        if (dayTimeMinutes.trim() === "") {
            alert("Please enter day time in minutes");
            return;
        }

        if (nightTimeMinutes.trim() === "") {
            alert("Please enter night time in minutes");
            return;
        }
        
        const gameSettings = {
            roles: characterQuantities,
            dayTime: parseInt(dayTimeMinutes) * 60, // Backend expects seconds
            nightTime: parseInt(nightTimeMinutes) * 60 // Backend expects seconds
        };

        console.log("Final game settings:", gameSettings);
        
        socket.emit('create-room', {
            userName: hostName,
            gameSettings
        })
    };

    useEffect(() => {
        socket.on('room-created', (data) => {
            
            console.log("Room created:", data);

            const roomCode = data.roomCode

            router.push(`/game-room/${roomCode}`);

        });

        return () => {
            socket.off('room-created');
        };
        
    }, [socket]);
    
    return (
        <div className="bg-white min-h-screen px-4 py-12">
            <div className="w-full max-w-5xl mx-auto space-y-16">
                {/* Header */}
                <div className="text-center space-y-3 relative">
                    {/* Back Button */}
                    <button 
                        onClick={() => router.back()}
                        className="cursor-pointer absolute left-0 top-2 text-gray-600 hover:text-black transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <h1 className="text-3xl font-bold text-black tracking-tight mt-5">GAME SETTINGS</h1>
                    <div className="w-48 h-0.5 bg-black mx-auto"></div>
                    <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
                        Configure quantities and timing
                    </p>
                </div>

                {/* Host Info */}
                <div className="text-center">
                    <p className="text-lg text-black font-medium">Host: <span className="font-bold">{hostName}</span></p>
                </div>

                {/* Character Quantities */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-black tracking-wide uppercase mb-2">
                            Character Quantities
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Set how many of each character type
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-4xl mx-auto">
                        {selectedCharacters.map((key) => {
                            const character = characterMap[key as keyof typeof characterMap];
                            if (!character) return null;
                            
                            return (
                                <div key={key} className="space-y-4">
                                    <Card
                                        image={character.image}
                                        title={character.name}
                                        description={character.description}
                                        selectable={false}
                                        selected={false}
                                    />
                                    <div className="flex items-center justify-center space-x-4">
                                        <button
                                            onClick={() => handleQuantityChange(key, characterQuantities[key] - 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-black font-bold transition-colors"
                                        >
                                            -
                                        </button>
                                        <span className="text-xl font-bold text-black min-w-[2rem] text-center">
                                            {characterQuantities[key]}
                                        </span>
                                        <button
                                            onClick={() => handleQuantityChange(key, characterQuantities[key] + 1)}
                                            className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-black font-bold transition-colors"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Time Settings */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-black tracking-wide uppercase mb-2">
                            Time Settings
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Set the duration for each phase
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                        <div>
                            <Input
                                label="DAY TIME (MINUTES)"
                                placeholder="Enter day time in min"
                                value={dayTimeMinutes}
                                onChange={(e) => setDayTimeMinutes(e.target.value)}
                            />
                        </div>
                        <div>
                            <Input
                                label="NIGHT TIME (MINUTES)"
                                placeholder="Enter night time in min"
                                value={nightTimeMinutes}
                                onChange={(e) => setNightTimeMinutes(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* Create Game Button */}
                <div className="flex justify-center space-y-4">
                    <MainButton
                        variant="black"
                        onClick={handleCreateGame}
                    >
                        Create Game
                    </MainButton>
                    
                </div>
            </div>
        </div>
    );
}