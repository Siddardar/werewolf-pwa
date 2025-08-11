"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Card from "@/components/card";
import MainButton from "@/components/main-button";

import { GamePhase, GameSettings, GameState, Player, Role } from "@/types/game";
import { GameResults } from "../game-over/page";

import { useSocket } from "@/contexts/SocketContext";

export default function GamePage() {
    const router = useRouter();
    const params = useParams();
    const { socket } = useSocket();

    const [loading, setLoading] = useState(true);
    const [timerLoading, setTimerLoading] = useState(false);

    // Get room code from URL params
    const roomCode = params.roomCode as string;

    // Game state
    const [game, setGame] = useState<{
        players: Player[];
        currentPlayer: Player;
        currentPhase: GamePhase;
    }>({
        players: [],
        currentPlayer: {} as Player,
        currentPhase: GamePhase.NIGHT,
    });
    const { players, currentPlayer, currentPhase } = game;

    const [timeLeft, setTimeLeft] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    
    // Day phase state
    const [selectedVote, setSelectedVote] = useState<string | null>(null);
    const [hasVoted, setHasVoted] = useState(false);

    // Special messages for seer
    const [seerMessage, setSeerMessage] = useState<string | null>(null);

    // Local timer for display (syncs with backend)
    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [timeLeft, isTimerRunning]);

    type RoomInfo = {
        currentPlayer: Player,
        players: Player[],
        settings: GameSettings,
        gameState: GameState,
        currentPhase: GamePhase,
        timeLeft?: number
    }

    type ReconnectionInfo = {
        player: Player,
        players: Player[],
        currentPhase: GamePhase,
        timeLeft: number
    }

    useEffect(() => {

        const handleRoomInfo = (data: RoomInfo) => {
            setGame({
                currentPlayer: data.currentPlayer,
                players: data.players,
                currentPhase: data.currentPhase,
            });
            setTimeLeft(data.settings.nightTime);
            setLoading(false);
        }

        const handleReconnectionSuccess = (data: ReconnectionInfo) => {
            setGame({
                currentPlayer: data.player,
                players: data.players,
                currentPhase: data.currentPhase,
            });
            
            setTimeLeft(data.timeLeft);
            

            setLoading(false);
        }

        const handleReconnectionFailed = (error: any) => {
            console.error('Reconnection failed:', error);
            setLoading(false);
            router.push('/join-game')
        }

        const handleRoomInfoFailure = (error: {message: string}) => {
            console.log('Failed to get room info:', error);

            const savedData = localStorage.getItem('gameSession')
            if (!savedData) {
                router.push('/join-game')
                return
            }

            const { userName, roomCode } = JSON.parse(savedData);

            if (error.message == "Player not found") {
                // Handle reconnection logic
                console.log('Player is not connected, attempting reconnection...');
                socket.emit('reconnect-to-room', {
                    userName: userName,
                    roomCode: roomCode
                });
                return;
            
            } else {
                router.push('/join-game');
            }
        }

        // Backend timer event handlers
        const handleStartGameSuccess = (data: { message: string, roomCode: string }) => {
            console.log('Game started, waiting for timer...', data);
            setTimerLoading(true);
        };

        const handleGameTimerStarted = (data: { currentPhase: GamePhase, timeLeft: number, dayCount: number }) => {
            console.log('Game timer started:', data);
            setGame(prevGame => ({
                ...prevGame,
                currentPhase: data.currentPhase,
            }));
            setTimeLeft(data.timeLeft);
            setIsTimerRunning(true);
            setTimerLoading(false); // Timer is now ready
            // Reset phase-specific state when game starts
            setSelectedVote(null);
            setHasVoted(false);
        };

        const handleTimerUpdate = (data: { timeLeft: number, currentPhase: GamePhase }) => {
            console.log('Timer update:', data);
            // Sync with backend timer to prevent drift
            setTimeLeft(data.timeLeft);
            setGame(prevGame => ({
                ...prevGame,
                currentPhase: data.currentPhase,
            }));
        };

        const handlePhaseChanged = (data: { newPhase: GamePhase, timeLeft: number, dayCount: number, players: Player[] }) => {
            console.log('Phase changed:', data);
            
            // This is now an atomic update.
            setGame(prevGame => {

                const updatedCurrentPlayerStatus = data.players.find(p => p.id === prevGame.currentPlayer.id);
                const updatedCurrentPlayer = {
                    ...prevGame.currentPlayer,
                    ...updatedCurrentPlayerStatus
                }
                return {
                    ...prevGame,
                    players: data.players,
                    currentPlayer: updatedCurrentPlayer,
                    currentPhase: data.newPhase,
                };
            });

            setTimeLeft(data.timeLeft);
            setIsTimerRunning(true);
            
            // Reset phase-specific state when phase changes
            setSelectedVote(null);
            setHasVoted(false);
            
        };

        const handleGameOver = (data: GameResults) => {
            localStorage.removeItem('gameSession');
            sessionStorage.setItem('gameResults', JSON.stringify(data));
            router.push(`/game-room/${roomCode}/game-over`);
        }

        // Seer Message handler
        const handleSeerMessage = (data: { message: string }) => {
            setSeerMessage(data.message);
        };

        socket.on('seer-message', handleSeerMessage);

        // Register event listeners
        socket.on('get-room-info-success', handleRoomInfo)
        socket.on('get-room-info-failure', handleRoomInfoFailure);
        
        // Reconnection handlers
        socket.on('reconnection-success', handleReconnectionSuccess)
        socket.on('reconnection-failed', handleReconnectionFailed);

        // Game events
        socket.on('start-game-success', handleStartGameSuccess);
        
        // Backend timer events
        socket.on('game-timer-started', handleGameTimerStarted);
        socket.on('timer-update', handleTimerUpdate);
        socket.on('phase-changed', handlePhaseChanged);

        socket.on('game-over', handleGameOver);

        const savedData = localStorage.getItem('gameSession')
        if (!savedData) {
            router.push('/join-game')
            return
        }

        const { userName, roomCode: savedRoomCode } = JSON.parse(savedData);
        if (savedRoomCode !== roomCode) {
            localStorage.removeItem('gameSession');
            router.push('/join-game');
        }

        socket.emit('get-room-info', { roomCode })

        return () => {
            socket.off('seer-message', handleSeerMessage);

            socket.off('get-room-info-success', handleRoomInfo)
            socket.off('get-room-info-failure', handleRoomInfoFailure)
            
            socket.off('start-game-success', handleStartGameSuccess);

            socket.off('reconnection-success', handleReconnectionSuccess);
            socket.off('reconnection-failed', handleReconnectionFailed);

            socket.off('game-timer-started', handleGameTimerStarted);
            socket.off('timer-update', handleTimerUpdate);
            socket.off('phase-changed', handlePhaseChanged);

            socket.off('game-over', handleGameOver);
        }

    }, [socket])


    if (loading || !currentPlayer || players.length === 0 || timerLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {timerLoading ? 'Starting Game...' : 'Loading Game...'}
                    </h2>
                    <p className="text-slate-300">
                        {timerLoading ? 'Initializing timer and game state' : `Connecting to room ${roomCode}`}
                    </p>
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    // Day phase functions
    const handleVote = (playerId: string) => {
        if (hasVoted || !currentPlayer.isAlive || currentPhase !== 'day') return;
        setSelectedVote(playerId);
    };
    
    const submitVote = () => {
        if (selectedVote && !hasVoted) {
            setHasVoted(true);
                
            socket.emit('submit-vote', { 
                roomCode, 
                targetPlayerId: selectedVote, 
                currentPlayerId: currentPlayer.id,
                currentPlayerRole: currentPlayer.role
            })
        }
    };
    
    // Night phase functions
    const handleSelectTarget = (playerId: string) => {
        if (hasVoted || !currentPlayer.isAlive || !canAct() || currentPhase !== 'night') return;
        setSelectedVote(playerId);
    };
    
    // Night phase helper functions
    const canAct = () => {
        return ['werewolf', 'doctor', 'seer', 'witch'].includes(currentPlayer.role);
    };
    
    const getActionDescription = () => {
        switch (currentPlayer.role) {
            case 'werewolf':
                return 'Choose a player to eliminate';
            case 'doctor':
                return 'Choose a player to protect';
            case 'seer':
                return 'Choose a player to investigate';
            case 'witch':
                return 'Choose a player to use potion on';
            default:
                return 'Sleep peacefully';
        }
    };
    
    const getValidTargets = () => {
        switch (currentPlayer.role) {
            case 'werewolf':
                return players.filter(p => p.isAlive && p.id !== currentPlayer.id && p.role !== 'werewolf');
            case 'doctor':
                return players.filter(p => p.isAlive);
            case 'seer':
                return players.filter(p => p.isAlive && p.id !== currentPlayer.id);
            case 'witch':
                return players.filter(p => p.isAlive);
            default:
                return [];
        }
    };
    
    // Get theme colors based on phase
    const getPhaseColors = () => {
        if (currentPhase === 'day') {
            return {
                background: 'bg-gradient-to-br from-yellow-100 to-orange-200',
                header: 'text-orange-800',
                divider: 'bg-orange-600',
                timer: 'bg-white bg-opacity-80 border-orange-200',
                timerText: 'text-orange-800',
                timerCount: timeLeft <= 30 ? 'text-red-600' : 'text-orange-700',
                timerSub: 'text-orange-600'
            };
        } else {
            return {
                background: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900',
                header: 'text-blue-100',
                divider: 'bg-blue-400',
                timer: 'bg-black bg-opacity-40 border border-blue-500',
                timerText: 'text-blue-200',
                timerCount: timeLeft <= 30 ? 'text-red-400' : 'text-blue-300',
                timerSub: 'text-blue-400'
            };
        }
    };
    
    const colors = getPhaseColors();
    const alivePlayersExceptSelf = game.players.filter(p => p.isAlive && p.id !== currentPlayer.id);
    const validTargets = getValidTargets();
    
    return (
        <div className={`${colors.background} min-h-screen px-4 py-8 flex flex-col transition-all duration-1000`}>
            <div className="w-full max-w-md mx-auto space-y-6 flex-1">
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className={`text-3xl font-bold ${colors.header} tracking-tight transition-colors duration-1000`}>
                        {currentPhase === 'day' ? 'DAY PHASE' : 'NIGHT PHASE'}
                    </h1>
                    <div className={`w-32 h-0.5 ${colors.divider} mx-auto transition-colors duration-1000`}></div>
                </div>
                
                {/* Timer */}
                <div className={`${colors.timer} rounded-lg p-6 text-center shadow-lg transition-all duration-1000`}>
                    <h2 className={`text-lg font-bold ${colors.timerText} mb-2 transition-colors duration-1000`}>Time Remaining</h2>
                    <div className={`text-4xl font-bold ${colors.timerCount} transition-colors duration-300`}>
                        {formatTime(timeLeft)}
                    </div>
                    <p className={`${colors.timerSub} text-sm mt-2 transition-colors duration-1000`}>
                        {timeLeft <= 30 ? (currentPhase === 'day' ? "Hurry up!" : "Time's almost up!") : 
                         (currentPhase === 'day' ? "Discuss and vote!" : "Make your move...")}
                    </p>
                </div>
                
                {/* Player's role with Flip Animation */}
                <div className="space-y-3">
                    <h3 className={`text-lg font-bold ${colors.header} text-center transition-colors duration-1000`}>Your role</h3>
                    <div className="flex justify-center items-center h-100">
                        <div className="w-64 h-96">
                            <Card
                                image={`/characters/${currentPlayer.role}.png`}
                                title={currentPlayer.role.charAt(0).toUpperCase() + currentPlayer.role.slice(1)}
                                description={
                                    currentPlayer.role === 'villager' ? 'Defend the Village' :
                                    currentPlayer.role === 'werewolf' ? 'Take over the Village' :
                                    currentPlayer.role === 'doctor' ? 'Heal the innocent' :
                                    currentPlayer.role === 'seer' ? 'See the truth' :
                                    currentPlayer.role === 'witch' ? 'Use your potions' :
                                    'Unknown role'
                                }
                                selectable={false}
                                selected={false}
                                flipped={currentPhase === 'day'}
                            />
                        </div>
                    </div>
                    {currentPhase === 'day' && (
                        <p className="text-orange-600 text-xs text-center transition-opacity duration-1000">
                            Card is hidden during day phase
                        </p>
                    )}
                </div>
                
                {/* Day Phase Content */}
                {currentPhase === 'day' && (
                    <>
                        {/* Game Status */}
                        {!currentPlayer.isAlive ? (
                            <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
                                <p className="text-red-700 font-bold">You are dead</p>
                                <p className="text-red-600 text-sm">You can observe but cannot vote</p>
                            </div>
                        ) : (
                            <div className="bg-green-100 border border-green-300 rounded-lg p-4 text-center">
                                <p className="text-green-700 font-bold">You are alive</p>
                                <p className="text-green-600 text-sm">Discuss and vote to eliminate a player</p>
                            </div>
                        )}
                        
                        {/* Voting Section */}
                        {currentPlayer.isAlive && !hasVoted && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-orange-800 text-center">Vote to Eliminate</h3>
                                <div className="space-y-2">
                                    {alivePlayersExceptSelf.map((player) => (
                                        <button
                                            key={player.id}
                                            onClick={() => handleVote(player.id)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                                                selectedVote === player.id
                                                    ? 'border-orange-500 bg-orange-100 text-orange-800'
                                                    : 'border-gray-300 bg-white hover:border-orange-300 text-gray-700'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-orange-700">
                                                        {player.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium">{player.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Vote Confirmation */}
                        {currentPlayer.isAlive && hasVoted && (
                            <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 text-center">
                                <p className="text-blue-700 font-bold">Vote Submitted</p>
                                <p className="text-blue-600 text-sm">
                                    You voted for {game.players.find(p => p.id === selectedVote)?.name}
                                </p>
                                <p className="text-blue-600 text-xs mt-1">
                                    Waiting for other players...
                                </p>
                            </div>
                        )}
                    </>
                )}
                
                {/* Night Phase Content */}
                {currentPhase === 'night' && (
                    <>
                        {/* Game Status */}
                        {!currentPlayer.isAlive ? (
                            <div className="bg-red-900 bg-opacity-60 border border-red-500 rounded-lg p-4 text-center">
                                <p className="text-red-300 font-bold">You are dead</p>
                                <p className="text-red-400 text-sm">You can observe but cannot act</p>
                            </div>
                        ) : !canAct() ? (
                            <div className="bg-blue-900 bg-opacity-60 border border-blue-500 rounded-lg p-4 text-center">
                                <p className="text-blue-300 font-bold">Sleep peacefully</p>
                                <p className="text-blue-400 text-sm">You have no night action</p>
                            </div>
                        ) : (
                            <div className="bg-purple-900 bg-opacity-60 border border-purple-500 rounded-lg p-4 text-center">
                                <p className="text-purple-200 font-bold">Your turn to act</p>
                                <p className="text-purple-300 text-sm">{getActionDescription()}</p>
                            </div>
                        )}
                        
                        {/* Action Section */}
                        {currentPlayer.isAlive && canAct() && !hasVoted && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-blue-200 text-center">Choose Your Target</h3>
                                <div className="space-y-2">
                                    {validTargets.map((player) => (
                                        <button
                                            key={player.id}
                                            onClick={() => handleSelectTarget(player.id)}
                                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                                                selectedVote === player.id
                                                    ? 'border-purple-400 bg-purple-900 bg-opacity-60 text-purple-200'
                                                    : 'border-blue-600 bg-black bg-opacity-40 hover:border-purple-500 text-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                    <span className="text-sm font-bold text-blue-100">
                                                        {player.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-medium block">{player.name}</span>
                                                    {currentPlayer.role === 'seer' && selectedVote === player.id && hasVoted && (
                                                        <span className="text-xs text-purple-300">
                                                            Role: {player.role}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Action Confirmation */}
                        {currentPlayer.isAlive && hasVoted && (
                            <div className="bg-green-900 bg-opacity-60 border border-green-500 rounded-lg p-4 text-center">
                                <p className="text-green-300 font-bold">Action Submitted</p>
                                <p className="text-green-400 text-sm">
                                    You used your {currentPlayer.role} ability on {game.players.find(p => p.id === selectedVote)?.name}
                                </p>
                                {currentPlayer.role === 'seer' && seerMessage && (
                                    <p className="text-green-400 text-md font-bold">
                                        Seer Message: {seerMessage}
                                    </p>
                                )}
                                <p className="text-green-500 text-xs mt-1">
                                    Waiting for other players...
                                </p>
                            </div>
                        )}
                        
                        {/* Special ability info */}
                        {currentPlayer.isAlive && canAct() && (
                            <div className="bg-black bg-opacity-40 border border-gray-600 rounded-lg p-4">
                                <h4 className="text-sm font-bold text-gray-300 mb-2">Your Night Ability:</h4>
                                <p className="text-xs text-gray-400">
                                    {currentPlayer.role === 'werewolf' && 'Work with other werewolves to eliminate a villager'}
                                    {currentPlayer.role === 'doctor' && 'Protect one player from elimination (can protect yourself)'}
                                    {currentPlayer.role === 'seer' && 'Learn the true role of one player'}
                                    {currentPlayer.role === 'witch' && 'Use one of your potions (heal or poison)'}
                                </p>
                            </div>
                        )}
                    </>
                )}
                
                {/* Dead Players List */}
                {game.players.some(p => !p.isAlive) && (
                    <div className="space-y-2">
                        <h3 className={`text-md font-bold text-center transition-colors duration-1000 ${
                            currentPhase === 'day' ? 'text-gray-600' : 'text-gray-400'
                        }`}>Eliminated Players</h3>
                        <div className="space-y-1">
                            {game.players.filter(p => !p.isAlive).map((player) => (
                                <div key={player.id} className={`rounded-lg p-3 text-center transition-colors duration-1000 ${
                                    currentPhase === 'day' ? 'bg-gray-100' : 'bg-gray-800'
                                }`}>
                                    <span className={`line-through transition-colors duration-1000 ${
                                        currentPhase === 'day' ? 'text-gray-600' : 'text-gray-400'
                                    }`}>{player.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Submit Button */}
            {((currentPhase === 'day' && currentPlayer.isAlive && selectedVote && !hasVoted) ||
              (currentPhase === 'night' && currentPlayer.isAlive && canAct() && selectedVote && !hasVoted)) && (
                <div className="w-full max-w-md mx-auto pt-8 pb-8">
                    <div className="flex justify-center">
                        <MainButton
                            variant="black"
                            onClick={submitVote}
                        >
                            {currentPhase === 'day' ? 'Submit Vote' : 'Confirm Action'}
                        </MainButton>
                    </div>
                </div>
            )}
        </div>
    );
}
