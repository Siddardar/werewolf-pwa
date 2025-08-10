"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/input";
import MainButton from "@/components/main-button";

import { useSocket } from "@/contexts/SocketContext";

export default function Page() {
    const router = useRouter();
    const [userName, setUserName] = useState("");
    const [roomCode, setroomCode] = useState("");

    const { socket } = useSocket();

    const handleJoinGame = () => {
        if (!userName.trim()) {
            alert("Please enter your name");
            return;
        }
        if (!roomCode.trim()) {
            alert("Please enter a room code");
            return;
        }
        if (roomCode.length !== 6) {
            alert("Room code must be exactly 6 digits");
            return;
        }

        // TODO: Add logic to join the game with the provided code
        socket.emit('join-room', { userName, roomCode: roomCode });
    };

    useEffect(() => {
        socket.on('room-joined', (data) => {
            // Handle successful room join
            console.log("Joined room successfully:", data);

            router.push(`/game-room/${data.roomCode}`);

        });

        socket.on('join-room-failed', (error) => {
            // Handle failed room join
            console.error("Failed to join room:", error);
        });



        return () => {
            socket.off('room-joined');
            socket.off('join-room-failed');
        };
    }, [socket]);

    const handleroomCodeChange = (index: number, value: string) => {
        // Capitalize the input value
        const capitalizedValue = value.toUpperCase();
        
        const newroomCode = roomCode.split('');
        newroomCode[index] = capitalizedValue;
        
        // Pad with empty strings to maintain 6 positions
        while (newroomCode.length < 6) {
            newroomCode.push('');
        }
        
        setroomCode(newroomCode.join(''));
        
        // Auto-focus next input if value entered
        if (capitalizedValue && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        // Handle backspace to go to previous input
        if (e.key === 'Backspace' && !roomCode[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').toUpperCase();
        
        // Only process if it's exactly 6 characters
        if (pastedData.length === 6) {
            setroomCode(pastedData);
            // Focus the last input after pasting
            const lastInput = document.getElementById(`code-5`);
            lastInput?.focus();
        }
    };

    return (
        <div className="bg-grey-50 min-h-screen px-4 py-12 flex flex-col">
            <div className="w-full max-w-md mx-auto space-y-16 flex-1">
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
                    
                    <h1 className="text-4xl font-bold text-black tracking-tight mt-5">JOIN GAME</h1>
                    <div className="w-48 h-0.5 bg-black mx-auto"></div>
                    <p className="text-gray-500 text-sm tracking-widest uppercase font-medium">
                        Enter game details to join
                    </p>
                </div>

                {/* Form Inputs */}
                <div className="space-y-8">
                    {/* User Name Input */}
                    <div>
                        <Input 
                            label="YOUR NAME"
                            placeholder="Enter your name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </div>

                    {/* Game Code Input */}
                    <div>
                        <label className="block text-sm font-bold mb-4 text-center text-gray-700">
                            GAME CODE
                        </label>
                        <div className="flex justify-center gap-3 mb-2">
                            {[...Array(6)].map((_, index) => (
                                <input
                                    key={index}
                                    id={`code-${index}`}
                                    type="text"
                                    maxLength={1}
                                    value={roomCode[index] || ''}
                                    onChange={(e) => handleroomCodeChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-12 h-12 text-center text-xl font-bold text-black border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors duration-200"
                                />
                            ))}
                        </div>
                        <p className="text-gray-400 text-xs mt-2 text-center">
                            Enter the code provided by the host
                        </p>
                    </div>
                </div>
            </div>

            {/* Join Game Button - Fixed at bottom */}
            <div className="w-full max-w-md mx-auto pb-8">
                <div className="flex justify-center">
                    <MainButton
                        variant="white"
                        onClick={handleJoinGame}
                        disabled={!userName.trim() || roomCode.length !== 6}
                    >
                        Join Game
                    </MainButton>
                </div>
            </div>
        </div>
    );
}
