"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Card from "@/components/card";
import Input from "@/components/input";
import MainButton from "@/components/main-button";
import characterMap from "../../public/characters/character_map.json";


export default function Page() {
    const router = useRouter();
    const [hostName, setHostName] = useState("");
    const [selectedCharacters, setSelectedCharacters] = useState<string[]>(["werewolf"]);

    const handleCardSelect = (cardId: string) => {
        // Prevent deselecting werewolf
        if (cardId === "werewolf") {
            return;
        }
        
        setSelectedCharacters(prev => {
            if (prev.includes(cardId)) {
                // Remove if already selected
                return prev.filter(id => id !== cardId);
            } else {
                // Add if not selected
                return [...prev, cardId];
            }
        });
    };

    const handleCreateGame = () => {
        if (!hostName.trim()) {
            alert("Please enter your name");
            return;
        }
        if (selectedCharacters.length === 1) {
            alert("Please select at least one additional character");
            return;
        }
        
        // Navigate to settings page with URL parameters
        const params = new URLSearchParams({
            host: hostName.trim(),
            characters: selectedCharacters.join(',')
        });
        
        router.push(`/create-game/settings?${params.toString()}`);
    };

    return (
        <div className="bg-grey-50 min-h-screen px-4 py-12">
            <div className="w-full max-w-5xl mx-auto space-y-16">
                {/* Header */}
                <div className="text-center space-y-3 relative">
                    {/* Back Button */}
                    <button 
                        onClick={() => router.push('/')}
                        className="cursor-pointer absolute left-0 top-2 text-gray-600 hover:text-black transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    
                    <h1 className="text-4xl font-bold text-black tracking-tight mt-5">CREATE GAME</h1>
                    <div className="w-48 h-0.5 bg-black mx-auto"></div>
                    <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
                        Configure your werewolf experience
                    </p>
                </div>

                {/* Host Name Input */}
                <div className="max-w-sm mx-auto">
                    <Input 
                        label="HOST NAME"
                        placeholder="Enter your name"
                        value={hostName}
                        onChange={(e) => setHostName(e.target.value)}
                    />
                </div>

                {/* Character Selection */}
                <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-black tracking-wide uppercase mb-2">
                            Select Characters
                        </h2>
                        <p className="text-gray-500 text-sm">
                            Choose the roles for your game ({selectedCharacters.length} selected)
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center max-w-4xl mx-auto">
                        {Object.entries(characterMap).map(([key, character]) => (
                            <Card
                                key={key}
                                image={character.image}
                                title={character.name}
                                description={character.description}
                                selectable={true}
                                selected={selectedCharacters.includes(key)}
                                onSelect={() => handleCardSelect(key)}
                            />
                        ))}
                    </div>
                </div>

                {/* Create Game Button */}
                <div className="flex justify-center">
                    <MainButton
                        variant="black"
                        onClick={handleCreateGame}
                    >
                        Game Settings
                    </MainButton>
                </div>
            </div>
        </div>
    );
}