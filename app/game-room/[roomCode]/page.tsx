"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSocket } from "@/contexts/SocketContext";

import { Player, GameSettings } from "@/types/game";

import MainButton from "@/components/main-button";

type RoomInfo = {
    currentPlayer: Player, 
    players: Player[],
    settings: GameSettings,
}

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const { socket } = useSocket()

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    
    // Get room code from URL params
    const roomCode = params.roomCode as string;
    
    const [currentPlayer, setCurrentPlayer] = useState<Player>();
    const [players, setPlayers] = useState<Player[]>([])

    // Mock game settings - this would come from your game state/API
    const [gameSettings, setGameSettings] = useState<GameSettings>({} as GameSettings);

    useEffect(() => {
        if (!socket || !roomCode) return;

        // Event handlers
        const handleRoomInfo = (data: RoomInfo) => {
            console.log('Room info received:', data);
            setPlayers(data.players);
            setGameSettings(data.settings);
            setCurrentPlayer(data.currentPlayer);

            // Store only the userName string, not the entire object
            if (data.currentPlayer) {
                localStorage.setItem('gameSession', JSON.stringify({
                    userName: data.currentPlayer.name,
                    roomCode: roomCode
                }));
            }
        };

        const handleRoomInfoFailed = (error: { message: string }) => {
            console.error('Failed to get room info:', error.message);
            router.push('/'); // Redirect if room doesn't exist
        };

        const handleReconnectionSuccess = (data: any) => {
            console.log('Reconnection successful:', data);
            setPlayers(data.players);
            setGameSettings(data.settings);
            setCurrentPlayer(data.player);
            // Update localStorage with fresh data
            localStorage.setItem('gameSession', JSON.stringify({
                userName: data.player.name,
                roomCode: data.roomCode
            }));
        };

        const handleReconnectionFailed = (error: { message: string }) => {
            console.error('Reconnection failed:', error.message);
            console.log('Fallback: trying to get fresh room info...');
            // Clear invalid session data
            localStorage.removeItem('gameSession');
            // Try to get fresh room info as fallback
            socket.emit('get-room-info', { roomCode });
        };

        const handleRoomUpdated = (data: { players: Player[], hostId: string, gameState: any, currentPhase: any }) => {
            console.log('Room updated:', data);
            setPlayers(data.players);
            
            // Update current player info when room is updated
            const savedData = localStorage.getItem('gameSession');
            if (savedData) {
                const { userName } = JSON.parse(savedData);
                const updatedCurrentPlayer = data.players.find(p => p.id === userName);
                if (updatedCurrentPlayer) {
                    // Add isHost property based on hostId
                    const playerWithHostInfo = {
                        ...updatedCurrentPlayer,
                        isHost: data.hostId === userName
                    };
                    setCurrentPlayer(playerWithHostInfo);
                }
            }
        };

        const handleStartGameSuccess = () => {
          router.push(`/game-room/${roomCode}/game`);
        };

        const handleStartGameFailed = (error: { message: string }) => {
            console.error('Failed to start game:', error.message);
        };

        // Register all event listeners
        socket.on('get-room-info-success', handleRoomInfo);
        socket.on('get-room-info-failed', handleRoomInfoFailed);
        
        socket.on('reconnection-success', handleReconnectionSuccess);
        socket.on('reconnection-failed', handleReconnectionFailed);
        
        socket.on('room-updated', handleRoomUpdated);

        socket.on('start-game-success', handleStartGameSuccess);
        socket.on('start-game-failed', handleStartGameFailed);

        // Initial connection logic - try reconnection first if we have saved data
        const savedData = localStorage.getItem('gameSession');
        if (savedData) {
            const { userName, roomCode: savedRoomCode } = JSON.parse(savedData);
            
            if (savedRoomCode === roomCode) {
                // We have saved data for this room - try to reconnect first
                console.log('Attempting to reconnect with saved user context...');
                socket.emit('reconnect-to-room', { userName, roomCode });
            } else {
                // Different room, clear old data and get fresh info
                localStorage.removeItem('gameSession');
                socket.emit('get-room-info', { roomCode });
            }
        } else {
            // No saved data, get fresh room info
            socket.emit('get-room-info', { roomCode });
        }

        return () => {
            socket.off('get-room-info-success', handleRoomInfo);
            socket.off('get-room-info-failed', handleRoomInfoFailed);
            
            socket.off('reconnection-success', handleReconnectionSuccess);
            socket.off('reconnection-failed', handleReconnectionFailed);
            
            socket.off('room-updated', handleRoomUpdated);

            socket.off('start-game-success', handleStartGameSuccess);
            socket.off('start-game-failed', handleStartGameFailed);
        };
    }, [socket, router, roomCode]);

    const handleShowSettings = () => {
        setShowSettingsModal(true);
    };

    const handleStartGame = () => {
        // TODO: Implement start game logic
        console.log("Starting game...");
        socket.emit('start-game', { roomCode });
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        // TODO: Add toast notification for copy confirmation
        console.log("Game code copied to clipboard");
        
        // Trigger the animation by adding the copied class
        const copyButton = document.getElementById('copy-button');
        const clipboardIcon = document.getElementById('clipboard-icon');
        const checkIcon = document.getElementById('check-icon');
        
        if (copyButton && clipboardIcon && checkIcon) {
            clipboardIcon.style.opacity = '0';
            clipboardIcon.style.transform = 'scale(0)';
            checkIcon.style.opacity = '1';
            checkIcon.style.transform = 'scale(1)';
            
            setTimeout(() => {
                clipboardIcon.style.opacity = '1';
                clipboardIcon.style.transform = 'scale(1)';
                checkIcon.style.opacity = '0';
                checkIcon.style.transform = 'scale(0)';
            }, 2000);
        }
    };

    return (
        <div className="bg-grey-50 min-h-screen px-4 py-12 flex flex-col">
            <div className="w-full max-w-md mx-auto space-y-8 flex-1">
                {/* Header with Settings */}
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

                    {/* Settings Button */}
                    <button 
                        onClick={handleShowSettings}
                        className="cursor-pointer absolute right-0 top-2 text-gray-600 hover:text-black transition-colors duration-200"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                    
                    <h1 className="text-4xl font-bold text-black tracking-tight mt-5">GAME ROOM</h1>
                    <div className="w-48 h-0.5 bg-black mx-auto"></div>
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-center text-gray-700">
                            ROOM CODE
                        </label>
                        <div className="flex items-center justify-center gap-3">
                            {/* OTP Style Code Display */}
                            <div className="flex gap-2">
                                {roomCode?.split('').map((char, index) => (
                                    <div
                                        key={index}
                                        className="w-10 h-10 text-center text-lg font-bold text-black border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white"
                                    >
                                        {char}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Copy to Clipboard Icon */}
                            <button
                                id="copy-button"
                                onClick={handleCopyCode}
                                className="text-gray-600 hover:text-black transition-colors duration-200 relative w-5 h-5"
                            >
                                {/* Clipboard Icon */}
                                <svg 
                                    id="clipboard-icon"
                                    className="w-5 h-5 transition-all duration-300 absolute top-0 left-0" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    style={{ opacity: 1, transform: 'scale(1)' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                
                                {/* Checkmark Icon */}
                                <svg 
                                    id="check-icon"
                                    className="w-5 h-5 transition-all duration-300 absolute top-0 left-0" 
                                    fill="none" 
                                    stroke="#16a34a" 
                                    viewBox="0 0 24 24"
                                    style={{ opacity: 0, transform: 'scale(0)' }}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-gray-400 text-xs text-center">
                            Share this code with other players
                        </p>
                    </div>
                </div>

                {/* Players List */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-black tracking-wide uppercase mb-2">
                            Players ({players.filter(p => p.connected).length})
                        </h2>
                    </div>
                    
                    <div className="space-y-3">
                        {players.filter(player => player.connected).map((player) => (
                            <div
                                key={player.id}
                                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
                            >
                                <div className="flex items-center space-x-3">
                                    {/* Player Avatar */}
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-bold text-gray-600">
                                            {player.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div>
                                        <span className="font-medium text-black">
                                            {player.name}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Host Indicator */}
                                <div className="flex items-center">
                                    {player.isHost && (
                                        <span className="px-2 py-1 text-xs font-bold text-white bg-black rounded">
                                            HOST
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Waiting Message */}
                <div className="text-center py-6">
                    <p className="text-gray-500 text-sm">
                        Waiting for all players to join...
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                        The host can start the game when ready
                    </p>
                </div>
            </div>

            {/* Start Game Button - Only show for host */}
            {currentPlayer?.isHost && (
                <div className="w-full max-w-md mx-auto pb-8">
                    <div className="flex justify-center">
                        <MainButton
                            variant="black"
                            onClick={handleStartGame}
                            disabled={!currentPlayer?.isHost} // Disable if not host 
                        >
                            Start Game
                        </MainButton>
                    </div>
                </div>
            )}
            
            {/* Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-30 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out">
                    <div className="bg-white rounded-lg w-full max-w-md p-6 space-y-6 shadow-2xl transform transition-all duration-300 ease-in-out scale-100 opacity-100">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-black tracking-wide uppercase">
                                Game Settings
                            </h2>
                            <button
                                onClick={() => setShowSettingsModal(false)}
                                className="text-gray-600 hover:text-black transition-colors duration-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Characters Section */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-black text-lg">Characters</h3>
                            <div className="space-y-3">
                                {Object.entries(gameSettings.roles).map(([role, count]) => (
                                    <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="font-medium text-black capitalize">
                                            {role}
                                        </span>
                                        <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded">
                                            {String(count)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Time Settings Section */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-black text-lg">Time Settings</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-black">
                                        Day Time
                                    </span>
                                    <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded">
                                        {gameSettings.dayTime} min
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-black">
                                        Night Time
                                    </span>
                                    <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded">
                                        {gameSettings.nightTime} min
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Close Button */}
                        <div className="flex justify-center pt-4">
                            <MainButton
                                variant="black"
                                onClick={() => setShowSettingsModal(false)}
                            >
                                Close
                            </MainButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
