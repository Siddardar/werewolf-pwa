"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import MainButton from "@/components/main-button";

export type GameResults = {
    winner: 'werewolves' | 'villagers';
    players: Array<{
        id: string;
        name: string;
        role: string;
        isAlive: boolean;
    }>;
    dayCount: number;
};

export default function GameOverPage() {
    const router = useRouter();
    const params = useParams();
    const [gameResults, setGameResults] = useState<GameResults | null>(null);
    const [loading, setLoading] = useState(true);

    const roomCode = params.roomcode as string;

    useEffect(() => {
        // Fetch game results from session storage
        const storedResults = sessionStorage.getItem('gameResults');
        
        if (storedResults) {
            try {
                const results = JSON.parse(storedResults) as GameResults;
                setGameResults(results);
            } catch (error) {
                console.error('Failed to parse game results:', error);
            }
        } else {
            console.warn('No game results found in session storage');
        }
        
        setLoading(false);
    }, []);

    const handleBackToHome = () => {
        // Clear game session data
        sessionStorage.removeItem('gameResults');
        router.push('/');
    };

    if (loading) {
        return (
            <div className="bg-grey-50 min-h-screen px-4 py-12 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading game results...</p>
                </div>
            </div>
        );
    }

    if (!gameResults) {
        return (
            <div className="bg-grey-50 min-h-screen px-4 py-12 flex flex-col">
                <div className="w-full max-w-md mx-auto space-y-16 flex-1">
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl font-bold text-black tracking-tight">GAME OVER</h1>
                        <div className="w-48 h-0.5 bg-black mx-auto"></div>
                        <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
                            No game data found
                        </p>
                    </div>
                    
                    <div className="text-center space-y-4">
                        <p className="text-gray-600">Unable to load game results.</p>
                        <p className="text-gray-500 text-sm">The game data may have been lost or expired.</p>
                    </div>
                </div>
                
                <div className="w-full max-w-md mx-auto pb-8">
                    <div className="flex justify-center">
                        <MainButton variant="white" onClick={handleBackToHome}>
                            Back to Home
                        </MainButton>
                    </div>
                </div>
            </div>
        );
    }

    const winningTeam = gameResults.winner;
    const winnerTitle = winningTeam === 'werewolves' ? 'WEREWOLVES WIN!' : 'VILLAGERS WIN!';
    const winnerColor = winningTeam === 'werewolves' ? 'text-red-600' : 'text-green-600';
    const winnerDescription = winningTeam === 'werewolves' 
        ? 'The werewolves have taken over the village' 
        : 'The villagers have eliminated all werewolves';

    // Separate players by team
    const werewolves = gameResults.players.filter(p => p.role === 'werewolf');
    const villagers = gameResults.players.filter(p => p.role !== 'werewolf');

    return (
        <div className="bg-grey-50 min-h-screen px-4 py-12 flex flex-col">
            <div className="w-full max-w-md mx-auto space-y-12 flex-1">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-bold text-black tracking-tight">GAME OVER</h1>
                    <div className="w-48 h-0.5 bg-black mx-auto"></div>
                    <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
                        Room {roomCode} • Day {gameResults.dayCount}
                    </p>
                </div>

                {/* Winner Announcement */}
                <div className="text-center space-y-4 bg-white rounded-lg p-6 shadow-sm border">
                    <h2 className={`text-2xl font-bold ${winnerColor} tracking-tight`}>
                        {winnerTitle}
                    </h2>
                    <p className="text-gray-600 text-sm">
                        {winnerDescription}
                    </p>
                </div>

                {/* Teams Revealed */}
                <div className="space-y-6">
                    {/* Werewolves Team */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-red-600 text-center">
                            🐺 WEREWOLVES
                        </h3>
                        <div className="space-y-2">
                            {werewolves.map((player) => (
                                <div 
                                    key={player.id} 
                                    className={`bg-white rounded-lg p-4 border ${
                                        player.isAlive ? 'border-red-200' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-red-700">
                                                    {player.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`font-medium ${
                                                    player.isAlive ? 'text-black' : 'text-gray-500 line-through'
                                                }`}>
                                                    {player.name}
                                                </span>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {player.role}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-medium ${
                                                player.isAlive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {player.isAlive ? 'ALIVE' : 'ELIMINATED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Villagers Team */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-green-600 text-center">
                            🏘️ VILLAGERS
                        </h3>
                        <div className="space-y-2">
                            {villagers.map((player) => (
                                <div 
                                    key={player.id} 
                                    className={`bg-white rounded-lg p-4 border ${
                                        player.isAlive ? 'border-green-200' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-green-700">
                                                    {player.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`font-medium ${
                                                    player.isAlive ? 'text-black' : 'text-gray-500 line-through'
                                                }`}>
                                                    {player.name}
                                                </span>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {player.role}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-medium ${
                                                player.isAlive ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {player.isAlive ? 'ALIVE' : 'ELIMINATED'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to Home Button */}
            <div className="w-full max-w-md mx-auto pb-8">
                <div className="flex justify-center">
                    <MainButton variant="white" onClick={handleBackToHome}>
                        Back to Home
                    </MainButton>
                </div>
            </div>
        </div>
    );
}
