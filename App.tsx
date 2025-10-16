
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, GameMode } from './types';
import { getWordList, getImageForWord, generateUnapprovedWordAndImage, generateImageForProvidedWord, getMathItems, generateImageForMathItem, getColorItems, generateImageForColorItem, generateUnapprovedMathItem, generateUnapprovedColorItem } from './services/geminiService';
import { scrambleWord, shuffleArray } from './utils/wordHelper';
// FIX: Refactored to named imports to resolve potential type resolution issues with namespace import.
import {
    WordImageRecord,
    getAllWordImagePairs,
    addWordImage,
    deleteWordImage,
    MathItemRecord,
    getAllMathItems,
    addMathItem,
    deleteMathItem,
    ColorItemRecord,
    getAllColorItems,
    addColorItem,
    deleteColorItem
} from './db/indexedDB';
import { playSound } from './utils/sound';

// --- Reusable Icon Components ---
const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 inline-block text-red-500" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);
const PlayerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);
const LeaderboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" />
    </svg>
);
const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const SmallTrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);
// --- UI Sub-Components ---
const Scoreboard: React.FC<{ score: number; lives: number; }> = ({ score, lives }) => (
    <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-full pl-4 pr-6 py-2 shadow-lg border-2 border-red-300 text-2xl text-gray-700 font-bold flex items-center gap-2">
            {Array.from({ length: lives }).map((_, i) => <HeartIcon key={i} />)}
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-2 shadow-lg border-2 border-yellow-300 text-2xl text-yellow-600 font-bold flex items-center">
            <StarIcon /> Score: {score}
        </div>
    </div>
);
const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-24 h-24 border-8 border-dashed rounded-full animate-spin border-yellow-400"></div>
        <p className="text-2xl text-blue-600 font-bold tracking-wider">{message}</p>
    </div>
);
const WordArea: React.FC<{
  scrambledLetters: { letter: string; id: number }[];
  userGuess: { letter: string; id: number }[];
  isIncorrect: boolean;
  onLetterClick: (item: { letter: string; id: number }) => void;
  onGuessLetterClick: (item: { letter: string; id: number }) => void;
  onClear: () => void;
}> = ({ scrambledLetters, userGuess, isIncorrect, onLetterClick, onGuessLetterClick, onClear }) => {
    const guessButtonColor = isIncorrect ? 'bg-red-500' : 'bg-green-400';

    return (
        <div className="w-full max-w-lg flex flex-col items-center space-y-6">
          <div className="w-full bg-white rounded-2xl shadow-inner p-4 min-h-[80px] flex items-center justify-center border-4 border-gray-200">
            <div className="flex flex-wrap justify-center gap-2">
              {userGuess.map((item) => (
                <button key={item.id} onClick={() => onGuessLetterClick(item)} className={`w-14 h-14 md:w-16 md:h-16 ${guessButtonColor} text-white text-3xl md:text-4xl rounded-xl shadow-md transform hover:scale-110 transition-all duration-200`}>
                  {item.letter.toUpperCase()}
                </button>
              ))}
            </div>
            {userGuess.length === 0 && <p className="text-gray-400 text-xl">Click letters below!</p>}
          </div>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {scrambledLetters.map((item) => (
              <button key={item.id} onClick={() => onLetterClick(item)} className="w-14 h-14 md:w-16 md:h-16 bg-blue-500 hover:bg-blue-600 text-white text-3xl md:text-4xl rounded-xl shadow-lg transform hover:-translate-y-1 transition-transform duration-200">
                {item.letter.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={onClear} className="mt-4 px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-full shadow-lg text-xl transition-transform duration-200 transform hover:scale-105">
            Clear
          </button>
        </div>
    );
};
const Typewriter: React.FC<{ text: string; className?: string; speed?: number }> = ({ text, className, speed = 150 }) => {
    const [index, setIndex] = useState(0);
    useEffect(() => { setIndex(0); }, [text]);
    useEffect(() => {
        if (index < text.length) {
            const timeoutId = setTimeout(() => setIndex(prev => prev + 1), speed);
            return () => clearTimeout(timeoutId);
        }
    }, [index, text, speed]);
    const displayedText = text.substring(0, index);
    return (<p className={className}>{displayedText}{index < text.length && <span className="inline-block w-0.5 h-5 bg-gray-600 animate-pulse ml-1 align-bottom"></span>}</p>);
};
const Dashboard: React.FC<{
    playerName: string;
    onPlayerNameChange: (name: string) => void;
    onStartGame: () => void;
    onShowLeaderboard: () => void;
    onShowSettings: () => void;
}> = ({ playerName, onPlayerNameChange, onStartGame, onShowLeaderboard, onShowSettings }) => (
    <div className="relative text-center bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-blue-200 flex flex-col items-center gap-6 w-full max-w-md">
        <button onClick={() => { playSound('click'); onShowSettings(); }} className="absolute top-4 right-4 z-10 p-4 bg-gray-200 hover:bg-gray-300 rounded-full shadow-md transition-transform transform hover:scale-110" aria-label="Settings">
            <SettingsIcon className="w-8 h-8 text-gray-600" />
        </button>
        <h1 className="text-6xl md:text-7xl text-blue-600 drop-shadow-lg">Play Sprouts</h1>
        <p className="text-xl text-gray-700">A Fun Learning Adventure!</p>
        <div className="relative w-full mt-4">
            <PlayerIcon />
            <input type="text" value={playerName} onChange={(e) => onPlayerNameChange(e.target.value)} placeholder="Enter Your Name" className="w-full pl-10 pr-4 py-4 text-2xl border-2 border-gray-300 rounded-full shadow-inner focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none" />
        </div>
        <button onClick={onStartGame} disabled={!playerName.trim()} className="w-full px-12 py-5 bg-green-500 text-white text-3xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 ease-in-out border-b-8 border-green-700 active:border-b-2 disabled:bg-gray-400 disabled:border-gray-500 disabled:cursor-not-allowed disabled:transform-none">
            Play Now!
        </button>
        <button onClick={() => { playSound('click'); onShowLeaderboard(); }} className="w-full flex items-center justify-center px-12 py-4 bg-purple-500 hover:bg-purple-600 text-white text-2xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 ease-in-out border-b-4 border-purple-700 active:border-b-2">
            <LeaderboardIcon /> Leaderboards
        </button>
        <Typewriter text="Made by Otaku Empire" className="text-lg text-gray-600 mt-4" />
    </div>
);
const Leaderboard: React.FC<{ leaderboard: Record<string, number>; title: string; }> = ({ leaderboard, title }) => {
    const sortedScores = Object.entries(leaderboard).sort((a, b) => Number(b[1]) - Number(a[1]));
    return (
        <>
            <h2 className="text-5xl md:text-6xl text-purple-600 mb-6">{title}</h2>
            <div className="max-h-80 overflow-y-auto space-y-3 pr-2 w-full">
                {sortedScores.length > 0 ? sortedScores.map(([name, score], index) => (
                    <div key={name} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-md text-2xl">
                        <span className="font-bold text-gray-700">{index + 1}. {name}</span>
                        <span className="text-yellow-600 font-bold">{score} pts</span>
                    </div>
                )) : <p className="text-xl text-gray-500">No scores yet. Be the first!</p>}
            </div>
        </>
    );
};
const LeaderboardSelection: React.FC<{ onSelect: (mode: GameMode) => void; onBack: () => void; }> = ({ onSelect, onBack }) => (
    <div className="text-center bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border-4 border-purple-300 w-full max-w-lg flex flex-col items-center gap-5">
        <h2 className="text-5xl md:text-6xl text-purple-600 mb-4">Leaderboards</h2>
        <button onClick={() => { playSound('click'); onSelect(GameMode.WORD_SPROUTS); }} className="w-full py-4 bg-blue-500 text-white text-2xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">Play Sprouts</button>
        <button onClick={() => { playSound('click'); onSelect(GameMode.MATH_ADDITION); }} className="w-full py-4 bg-green-500 text-white text-2xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">Math Puzzles</button>
        <button onClick={() => { playSound('click'); onSelect(GameMode.COLOR_MATCHING); }} className="w-full py-4 bg-red-500 text-white text-2xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">Color Quest</button>
        <button onClick={() => { playSound('click'); onBack(); }} className="mt-4 px-10 py-3 bg-gray-500 hover:bg-gray-600 text-white text-xl rounded-lg shadow-md transition-colors">Back</button>
    </div>
);
const GameOver: React.FC<{
    playerName: string;
    score: number;
    highScore: number;
    reason: 'completed' | 'no_lives' | null;
    onPlayAgain: () => void;
    onGoToDashboard: () => void;
}> = ({ playerName, score, highScore, reason, onPlayAgain, onGoToDashboard }) => {
    const isWin = reason === 'completed';
    const title = isWin ? 'Great Job, amore!' : 'Game Over';
    const message = isWin ? "You finished all the words!" : `You ran out of lives, ${playerName}.`;
    const titleColor = isWin ? 'text-green-600' : 'text-red-500';
    const borderColor = isWin ? 'border-green-300' : 'border-red-300';
    return (
        <div className={`text-center bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border-4 ${borderColor} w-full max-w-lg`}>
            <h2 className={`text-5xl md:text-6xl font-bold mb-4 ${titleColor}`}>{title}</h2>
            <p className="text-2xl text-gray-700 mb-4">{message}</p>
            <div className="bg-white/50 p-4 rounded-xl shadow-inner">
                <p className="text-xl text-gray-600">Your final score is:</p>
                <p className="text-6xl font-bold text-yellow-500 my-2 drop-shadow-md">{score}</p>
                <p className="text-lg text-amber-700">Your high score: {highScore}</p>
            </div>
            <div className="flex justify-center gap-4 mt-8">
                <button onClick={onPlayAgain} className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white text-2xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform">Play Again</button>
                <button onClick={onGoToDashboard} className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white text-2xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform">Dashboard</button>
            </div>
        </div>
    );
};
const ModeSelection: React.FC<{ onSelect: (mode: GameMode) => void; onBack: () => void; }> = ({ onSelect, onBack }) => (
    <div className="text-center bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border-4 border-green-300 w-full max-w-lg flex flex-col items-center gap-5">
        <h2 className="text-5xl md:text-6xl text-green-600 mb-4">Choose a Game!</h2>
        <button onClick={() => onSelect(GameMode.WORD_SPROUTS)} className="w-full py-5 bg-blue-500 text-white text-3xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform border-b-8 border-blue-700 active:border-b-2">Play Sprouts</button>
        <button onClick={() => onSelect(GameMode.MATH_ADDITION)} className="w-full py-5 bg-green-500 text-white text-3xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform border-b-8 border-green-700 active:border-b-2">Math Puzzles</button>
        <button onClick={() => onSelect(GameMode.COLOR_MATCHING)} className="w-full py-5 bg-red-500 text-white text-3xl rounded-2xl shadow-xl transform hover:scale-105 transition-transform border-b-8 border-red-700 active:border-b-2">Color Quest</button>
        <button onClick={() => { playSound('click'); onBack(); }} className="mt-4 px-10 py-3 bg-gray-500 hover:bg-gray-600 text-white text-xl rounded-lg shadow-md transition-colors">Back to Main Menu</button>
    </div>
);

// --- Settings Component and Sub-Components ---
const Settings: React.FC<{ onBack: () => void; onContentUpdate: () => void; }> = ({ onBack, onContentUpdate }) => {
    const [activeTab, setActiveTab] = useState<GameMode>(GameMode.WORD_SPROUTS);
    const tabs: { mode: GameMode, name: string, color: string }[] = [
        { mode: GameMode.WORD_SPROUTS, name: 'Play Sprouts', color: 'blue' },
        { mode: GameMode.MATH_ADDITION, name: 'Math Puzzles', color: 'green' },
        { mode: GameMode.COLOR_MATCHING, name: 'Color Quest', color: 'red' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case GameMode.WORD_SPROUTS: return <PlaySproutsSettingsPanel onContentUpdate={onContentUpdate} />;
            case GameMode.MATH_ADDITION: return <MathSettingsPanel onContentUpdate={onContentUpdate} />;
            case GameMode.COLOR_MATCHING: return <ColorSettingsPanel onContentUpdate={onContentUpdate} />;
            default: return null;
        }
    }

    return (
        <div className="bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-2xl border-4 border-gray-300 w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl sm:text-4xl text-gray-700">Parent Settings</h2>
                <button onClick={onBack} className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white text-lg rounded-lg shadow-md transition-colors">Back</button>
            </div>
            <div className="flex flex-wrap border-b-2 border-gray-200">
                {tabs.map(tab => (
                    <button key={tab.mode} onClick={() => { playSound('click'); setActiveTab(tab.mode); }}
                        className={`px-4 sm:px-6 py-3 text-base sm:text-lg font-bold transition-colors ${activeTab === tab.mode ? `border-b-4 border-${tab.color}-500 text-${tab.color}-600` : 'text-gray-500 hover:bg-gray-100'}`}>
                        {tab.name}
                    </button>
                ))}
            </div>
            <div className="flex-grow overflow-y-auto p-1 sm:p-4">{renderContent()}</div>
        </div>
    );
};
const PlaySproutsSettingsPanel: React.FC<{ onContentUpdate: () => void; }> = ({ onContentUpdate }) => {
    const [wordList, setWordList] = useState<WordImageRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reviewItem, setReviewItem] = useState<{ word: string; imageUrl: string } | null>(null);
    const [customWord, setCustomWord] = useState('');
    const [error, setError] = useState<string | null>(null);

    const refreshList = useCallback(async () => { setWordList(await getAllWordImagePairs()); }, []);
    useEffect(() => { refreshList(); }, [refreshList]);

    const handleGenerateRandom = async () => {
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateUnapprovedWordAndImage();
        // FIX: Corrected state update logic to properly handle discriminated union types returned from the API, resolving a TypeScript error. The `else` branch now correctly narrows the type.
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false);
    };

    const handleGenerateCustom = async () => {
        if (!customWord.trim()) return;
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateImageForProvidedWord(customWord);
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false); setCustomWord('');
    };

    const handleApprove = async () => {
        if (!reviewItem) return;
        playSound('click');
        await addWordImage(reviewItem.word, reviewItem.imageUrl);
        setReviewItem(null);
        await refreshList();
        onContentUpdate();
    };

    const handleDelete = async (word: string) => {
        playSound('click');
        if (window.confirm(`Are you sure you want to delete "${word.toUpperCase()}"?`)) {
            await deleteWordImage(word);
            await refreshList();
            onContentUpdate();
        }
    };
    
    const renderReview = () => (
        <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
            <h3 className="text-xl font-bold text-yellow-800 mb-2">Review New Word</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
                <img src={reviewItem!.imageUrl} alt={reviewItem!.word} className="w-32 h-32 object-contain bg-white rounded-md shadow-md" />
                <p className="text-4xl font-bold text-gray-800 break-all">{reviewItem!.word.toUpperCase()}</p>
                <div className="flex gap-2 ml-auto">
                    <button onClick={handleApprove} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600"><CheckIcon className="w-6 h-6" /></button>
                    <button onClick={() => { playSound('click'); setReviewItem(null); }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"><TrashIcon className="w-6 h-6" /></button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {isLoading && <LoadingSpinner message="Generating..." />}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert"><p className="font-bold">Oops!</p><p>{error}</p></div>}
            {reviewItem && renderReview()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Generate Random Word</h3>
                    <button onClick={handleGenerateRandom} disabled={isLoading} className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">Generate</button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Generate Your Own Word</h3>
                    <div className="flex gap-2">
                        <input type="text" value={customWord} onChange={e => setCustomWord(e.target.value)} placeholder="e.g., house" className="flex-grow p-2 border rounded-md"/>
                        <button onClick={handleGenerateCustom} disabled={isLoading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400">Go</button>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-gray-700">Manage Game Words ({wordList.length})</h3>
                <div className="max-h-96 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 bg-gray-100 rounded-lg">
                    {wordList.map(item => (
                        <div key={item.word} className="relative bg-white p-2 rounded-md shadow group">
                            <img src={item.image} alt={item.word} className="w-full h-24 object-contain rounded" />
                            <p className="text-center font-bold mt-1">{item.word.toUpperCase()}</p>
                            <button onClick={() => handleDelete(item.word)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <SmallTrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
const MathSettingsPanel: React.FC<{ onContentUpdate: () => void; }> = ({ onContentUpdate }) => {
    const [itemList, setItemList] = useState<MathItemRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reviewItem, setReviewItem] = useState<{ name: string; imageUrl: string } | null>(null);
    const [customItemName, setCustomItemName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const refreshList = useCallback(async () => { setItemList(await getAllMathItems()); }, []);
    useEffect(() => { refreshList(); }, [refreshList]);
    
    const handleGenerateRandom = async () => {
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateUnapprovedMathItem();
        // FIX: Corrected state update logic to properly handle discriminated union types returned from the API, resolving a TypeScript error. The `else` branch now correctly narrows the type.
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!customItemName.trim()) return;
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateImageForMathItem(customItemName);
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false); setCustomItemName('');
    };
    
    const handleApprove = async () => {
        if (!reviewItem) return;
        playSound('click');
        await addMathItem(reviewItem.name, reviewItem.imageUrl);
        setReviewItem(null);
        await refreshList();
        onContentUpdate();
    };

    const handleDelete = async (name: string) => {
        playSound('click');
        if (window.confirm(`Are you sure you want to delete "${name.toUpperCase()}"?`)) {
            await deleteMathItem(name);
            await refreshList();
            onContentUpdate();
        }
    };
    
    return (
         <div className="space-y-6">
            {isLoading && <LoadingSpinner message="Generating..." />}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert"><p className="font-bold">Oops!</p><p>{error}</p></div>}
            {reviewItem && (
                 <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">Review New Item</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <img src={reviewItem.imageUrl} alt={reviewItem.name} className="w-32 h-32 object-contain bg-white rounded-md shadow-md" />
                        <p className="text-4xl font-bold text-gray-800 break-all">{reviewItem.name.toUpperCase()}</p>
                         <div className="flex gap-2 ml-auto">
                            <button onClick={handleApprove} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600"><CheckIcon className="w-6 h-6" /></button>
                            <button onClick={() => { playSound('click'); setReviewItem(null); }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"><TrashIcon className="w-6 h-6" /></button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Generate Random Item</h3>
                    <p className="text-sm text-gray-500 mb-2">Let AI suggest a new item for counting problems.</p>
                    <button onClick={handleGenerateRandom} disabled={isLoading} className="w-full py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400">Generate</button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Add Your Own Item</h3>
                    <p className="text-sm text-gray-500 mb-2">Enter a single object name (e.g., apple, star).</p>
                    <div className="flex gap-2">
                        <input type="text" value={customItemName} onChange={e => setCustomItemName(e.target.value)} placeholder="e.g., butterfly" className="flex-grow p-2 border rounded-md"/>
                        <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400">Go</button>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-gray-700">Manage Math Items ({itemList.length})</h3>
                <div className="max-h-96 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 bg-gray-100 rounded-lg">
                    {/* FIX: Explicitly type `item` to resolve properties `name` and `image` not being found on type `unknown`. */}
                    {/* FIX: Explicitly type `item` to resolve properties `name` and `image` not being found on type `unknown`. */}
                    {itemList.map((item: MathItemRecord) => (
                        <div key={item.name} className="relative bg-white p-2 rounded-md shadow group">
                            <img src={item.image} alt={item.name} className="w-full h-24 object-contain rounded" />
                            <p className="text-center font-bold mt-1">{item.name.toUpperCase()}</p>
                            <button onClick={() => handleDelete(item.name)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <SmallTrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
const ColorSettingsPanel: React.FC<{ onContentUpdate: () => void; }> = ({ onContentUpdate }) => {
    const [itemList, setItemList] = useState<ColorItemRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [reviewItem, setReviewItem] = useState<{ name: string; color: string; imageUrl: string } | null>(null);
    const [itemName, setItemName] = useState('');
    const [itemColor, setItemColor] = useState('');
    const [error, setError] = useState<string | null>(null);

    const refreshList = useCallback(async () => { setItemList(await getAllColorItems()); }, []);
    useEffect(() => { refreshList(); }, [refreshList]);

    const handleGenerateRandom = async () => {
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateUnapprovedColorItem();
        // FIX: Corrected state update logic to properly handle discriminated union types returned from the API, resolving a TypeScript error. The `else` branch now correctly narrows the type.
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false);
    };

    const handleGenerate = async () => {
        if (!itemName.trim() || !itemColor.trim()) return;
        playSound('click');
        setIsLoading(true); setReviewItem(null); setError(null);
        const result = await generateImageForColorItem(itemName, itemColor);
        if ('error' in result) {
            setError(result.error);
        } else {
            setReviewItem(result);
        }
        setIsLoading(false); setItemName(''); setItemColor('');
    };
    
    const handleApprove = async () => {
        if (!reviewItem) return;
        playSound('click');
        await addColorItem(reviewItem.name, reviewItem.color, reviewItem.imageUrl);
        setReviewItem(null);
        await refreshList();
        onContentUpdate();
    };

    const handleDelete = async (name: string) => {
        playSound('click');
        if (window.confirm(`Are you sure you want to delete "${name.toUpperCase()}"?`)) {
            await deleteColorItem(name);
            await refreshList();
            onContentUpdate();
        }
    };
    
    const commonColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown'];

    return (
        <div className="space-y-6">
            {isLoading && <LoadingSpinner message="Generating..." />}
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md my-4" role="alert"><p className="font-bold">Oops!</p><p>{error}</p></div>}
            {reviewItem && (
                 <div className="bg-yellow-100 p-4 rounded-lg border-2 border-yellow-300">
                    <h3 className="text-xl font-bold text-yellow-800 mb-2">Review New Item</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <img src={reviewItem.imageUrl} alt={reviewItem.name} className="w-32 h-32 object-contain bg-white rounded-md shadow-md" />
                        <div className="text-center sm:text-left">
                            <p className="text-4xl font-bold text-gray-800 break-all">{reviewItem.name.toUpperCase()}</p>
                            <p className="text-2xl font-bold capitalize" style={{color: reviewItem.color}}>{reviewItem.color}</p>
                        </div>
                         <div className="flex gap-2 ml-auto">
                            <button onClick={handleApprove} className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600"><CheckIcon className="w-6 h-6" /></button>
                            <button onClick={() => { playSound('click'); setReviewItem(null); }} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600"><TrashIcon className="w-6 h-6" /></button>
                        </div>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Generate Random Item</h3>
                    <p className="text-sm text-gray-500 mb-2">Let AI suggest a new colored item for the game.</p>
                    <button onClick={handleGenerateRandom} disabled={isLoading} className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">Generate</button>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <h3 className="text-lg font-bold mb-2 text-gray-700">Add Your Own Item</h3>
                     <div className="flex flex-col gap-2">
                        <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Item Name (e.g., car)" className="p-2 border rounded-md"/>
                        <select value={itemColor} onChange={e => setItemColor(e.target.value)} className="p-2 border rounded-md bg-white capitalize">
                            <option value="" disabled>Select a color</option>
                            {commonColors.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading || !itemName.trim() || !itemColor} className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400">Go</button>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-bold mb-2 text-gray-700">Manage Color Items ({itemList.length})</h3>
                <div className="max-h-96 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 bg-gray-100 rounded-lg">
                    {/* FIX: Explicitly type `item` to resolve property `color` not being found on type `unknown`. */}
                    {/* FIX: Explicitly type `item` to resolve property `color` not being found on type `unknown`. */}
                    {itemList.map((item: ColorItemRecord) => (
                        <div key={item.name} className="relative bg-white p-2 rounded-md shadow group">
                            <img src={item.image} alt={item.name} className="w-full h-24 object-contain rounded" />
                            <p className="text-center font-bold mt-1">{item.name.toUpperCase()}</p>
                            <p className="text-center text-sm capitalize" style={{color: item.color}}>{item.color}</p>
                            <button onClick={() => handleDelete(item.name)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <SmallTrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
const GAME_MODE_NAMES: Record<GameMode, string> = {
    [GameMode.WORD_SPROUTS]: 'Play Sprouts',
    [GameMode.MATH_ADDITION]: 'Math Puzzles',
    [GameMode.COLOR_MATCHING]: 'Color Quest',
};
const LAST_PLAYER_KEY = 'playSproutsLastPlayer';
const LEADERBOARD_KEYS: Record<GameMode, string> = {
    [GameMode.WORD_SPROUTS]: 'playSproutsLeaderboard',
    [GameMode.MATH_ADDITION]: 'mathAdditionLeaderboard',
    [GameMode.COLOR_MATCHING]: 'colorMatchingLeaderboard',
};
const MAX_LIVES = 10;
const STARTING_LIVES = 5;

const App: React.FC = () => {
    // --- State Declarations ---
    const [gameState, setGameState] = useState<GameState>(GameState.DASHBOARD);
    const [gameMode, setGameMode] = useState<GameMode | null>(null);
    const [playerName, setPlayerName] = useState<string>('');
    const [leaderboards, setLeaderboards] = useState<Record<GameMode, Record<string, number>>>({
        [GameMode.WORD_SPROUTS]: {},
        [GameMode.MATH_ADDITION]: {},
        [GameMode.COLOR_MATCHING]: {},
    });
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(STARTING_LIVES);
    const [gameOverReason, setGameOverReason] = useState<'completed' | 'no_lives' | null>(null);
    const [selectedLeaderboard, setSelectedLeaderboard] = useState<GameMode | null>(null);
    // Game-specific state
    const [wordList, setWordList] = useState<string[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [scrambledLetters, setScrambledLetters] = useState<{ letter: string, id: number }[]>([]);
    const [userGuess, setUserGuess] = useState<{ letter: string, id: number }[]>([]);
    const [isIncorrectGuess, setIsIncorrectGuess] = useState(false);
    // Math Game State
    const [mathProblem, setMathProblem] = useState<{ item: MathItemRecord, num1: number, num2: number, answer: number, options: number[], question: string } | null>(null);
    const [mathItems, setMathItems] = useState<MathItemRecord[]>([]);
    const [selectedMathAnswer, setSelectedMathAnswer] = useState<number | null>(null);
    const [isMathAnswered, setIsMathAnswered] = useState(false);
    // Color Game State
    const [colorProblem, setColorProblem] = useState<{ item: ColorItemRecord, answer: string, options: string[] } | null>(null);
    const [colorItems, setColorItems] = useState<ColorItemRecord[]>([]);

    // --- Effects ---
    useEffect(() => {
        const loadInitialData = async () => {
            const loadedLeaderboards = { ...leaderboards };
            for (const mode in GameMode) {
                if (!isNaN(Number(mode))) {
                    const key = LEADERBOARD_KEYS[Number(mode) as GameMode];
                    const saved = localStorage.getItem(key);
                    if (saved) {
                        loadedLeaderboards[Number(mode) as GameMode] = JSON.parse(saved);
                    }
                }
            }
            setLeaderboards(loadedLeaderboards);
            const lastPlayer = localStorage.getItem(LAST_PLAYER_KEY);
            if (lastPlayer) setPlayerName(lastPlayer);
            handleContentUpdate();
        };
        loadInitialData();
    }, []);
    
    const handleContentUpdate = useCallback(async () => {
        setMathItems(await getMathItems());
        setColorItems(await getColorItems());
    }, []);

    const playerHighScore = useMemo(() => {
        if (gameMode === null) return 0;
        return leaderboards[gameMode]?.[playerName] || 0;
    }, [leaderboards, playerName, gameMode]);

    // --- Game Setup and Progression ---
    const prepareWord = useCallback((word: string) => {
        const lettersWithIds = scrambleWord(word).map((letter, index) => ({ letter, id: index }));
        setScrambledLetters(lettersWithIds);
        setUserGuess([]);
    }, []);

    const fetchImageForWord = useCallback(async (word: string) => {
        setGameState(GameState.LOADING_IMAGE);
        setCurrentImage(null);
        const imageUrl = await getImageForWord(word);
        if (imageUrl) {
            setCurrentImage(imageUrl);
            prepareWord(word);
            setGameState(GameState.PLAYING);
        } else {
            alert(`Error: Could not find an image for "${word}". Please check Settings.`);
            setGameState(GameState.DASHBOARD);
        }
    }, [prepareWord]);

    const handleNextWord = useCallback(() => {
        playSound('click');
        const nextIndex = currentWordIndex + 1;
        if (nextIndex < wordList.length) {
            setCurrentWordIndex(nextIndex);
            fetchImageForWord(wordList[nextIndex]);
        } else {
            playSound('gameOver');
            setGameOverReason('completed');
            setGameState(GameState.GAME_OVER);
        }
    }, [currentWordIndex, wordList, fetchImageForWord]);

    const generateNewMathProblem = () => {
        if (mathItems.length === 0) return;
        const item = shuffleArray(mathItems)[0];
        const num1 = Math.floor(Math.random() * 5) + 1;
        const num2 = Math.floor(Math.random() * 5) + 1;
        const answer = num1 + num2;
        const options = shuffleArray([answer, answer + 2, Math.max(1, answer - 1)]);

        const templates = [
            `How many ${item.name}s are there in total?`,
            `Can you count all the ${item.name}s?`,
            `What is ${num1} + ${num2}?`,
            `Add the ${item.name}s together!`,
        ];
        const question = shuffleArray(templates)[0];

        setMathProblem({ item, num1, num2, answer, options, question });
        setSelectedMathAnswer(null);
        setIsMathAnswered(false);
        setIsIncorrectGuess(false);
        setGameState(GameState.PLAYING);
    };

    const generateNewColorProblem = () => {
        if (colorItems.length === 0) return;
    
        const item = shuffleArray(colorItems)[0];
        const answer = item.color;
    
        const allColorsInDb = [...new Set(colorItems.map(i => i.color))];
        const commonColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown'];
        
        // Create a pool of potential wrong answers, ensuring no duplicates and excluding the correct answer
        const wrongOptionsPool = [...new Set([...allColorsInDb, ...commonColors])]
            .filter(c => c.toLowerCase() !== answer.toLowerCase());
    
        // Shuffle the pool and take the first 2 as our distractors
        const finalWrongOptions = shuffleArray(wrongOptionsPool).slice(0, 2);
    
        // This guarantees we always have 3 options unless the pool itself is too small, which is highly unlikely.
        const options = shuffleArray([answer, ...finalWrongOptions]);
        
        setColorProblem({ item, answer, options });
        setGameState(GameState.PLAYING);
    };

    const handleModeSelected = async (mode: GameMode) => {
        playSound('click');
        setGameMode(mode);
        setScore(0);
        setLives(STARTING_LIVES);
        setIsIncorrectGuess(false);
        setGameOverReason(null);
        setSelectedMathAnswer(null);
        setIsMathAnswered(false);
        setGameState(GameState.LOADING_WORDS);

        if (mode === GameMode.WORD_SPROUTS) {
            const words = await getWordList();
            if (words.length > 0) {
                setWordList(words);
                setCurrentWordIndex(0);
                fetchImageForWord(words[0]);
            } else {
                alert("No words in game! Add some in Settings.");
                setGameState(GameState.DASHBOARD);
            }
        } else if (mode === GameMode.MATH_ADDITION) {
            if (mathItems.length > 0) {
                generateNewMathProblem();
            } else {
                alert("No math items in game! Add some in Settings.");
                setGameState(GameState.DASHBOARD);
            }
        } else if (mode === GameMode.COLOR_MATCHING) {
            if (colorItems.length > 0) {
                generateNewColorProblem();
            } else {
                alert("No color items in game! Add some in Settings.");
                setGameState(GameState.DASHBOARD);
            }
        }
    };

    const handleCorrectAnswer = () => {
        playSound('success');
        const newScore = score + 10;
        setScore(newScore);
        setLives(prev => Math.min(prev + 1, MAX_LIVES));

        if (gameMode !== null && newScore > playerHighScore) {
            const newLeaderboards = { ...leaderboards };
            const modeLeaderboard = { ...newLeaderboards[gameMode], [playerName]: newScore };
            const sorted = Object.entries(modeLeaderboard).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 20);
            newLeaderboards[gameMode] = Object.fromEntries(sorted);
            setLeaderboards(newLeaderboards);
            localStorage.setItem(LEADERBOARD_KEYS[gameMode], JSON.stringify(newLeaderboards[gameMode]));
        }

        if (gameMode === GameMode.WORD_SPROUTS) {
            setGameState(GameState.CORRECT_GUESS);
        } else if (gameMode === GameMode.MATH_ADDITION) {
            setTimeout(generateNewMathProblem, 1000);
        } else if (gameMode === GameMode.COLOR_MATCHING) {
            setTimeout(generateNewColorProblem, 1000);
        }
    };
    
    const handleIncorrectAnswer = () => {
        playSound('incorrect');
        const newLives = lives - 1;
        setLives(newLives);
        setIsIncorrectGuess(true);

        if (newLives <= 0) {
            playSound('gameOver');
            setGameOverReason('no_lives');
            setGameState(GameState.GAME_OVER);
        } else {
             if (gameMode === GameMode.MATH_ADDITION) {
                setTimeout(() => {
                    setIsIncorrectGuess(false);
                    setSelectedMathAnswer(null);
                    setIsMathAnswered(false);
                }, 1500);
            } else if (gameMode === GameMode.COLOR_MATCHING) {
                 setTimeout(() => setIsIncorrectGuess(false), 1000);
            }
        }
    };
    
    const handleMathAnswer = (option: number) => {
        if (isMathAnswered) return;
        setIsMathAnswered(true);
        playSound('select');
        setSelectedMathAnswer(option);
        if (option === mathProblem?.answer) {
            handleCorrectAnswer();
        } else {
            handleIncorrectAnswer();
        }
    };

    // --- Word Sprouts Specific Logic ---
    useEffect(() => {
        if (gameMode === GameMode.WORD_SPROUTS && gameState === GameState.PLAYING && wordList[currentWordIndex] && userGuess.length === wordList[currentWordIndex].length) {
            if (userGuess.map(l => l.letter).join('') === wordList[currentWordIndex]) {
                handleCorrectAnswer();
            } else if (!isIncorrectGuess) {
                handleIncorrectAnswer();
            }
        }
    }, [userGuess, gameState, gameMode, isIncorrectGuess]);
    
    // --- Render Logic ---
    const renderGameState = () => {
        switch (gameState) {
            case GameState.DASHBOARD:
                return <Dashboard playerName={playerName} onPlayerNameChange={setPlayerName}
                    onStartGame={() => {
                        if (!playerName.trim()) { playSound('clear'); alert("Please enter your name!"); return; }
                        playSound('click');
                        localStorage.setItem(LAST_PLAYER_KEY, playerName);
                        setGameState(GameState.MODE_SELECTION);
                    }}
                    onShowLeaderboard={() => setGameState(GameState.LEADERBOARD_SELECTION)}
                    onShowSettings={() => setGameState(GameState.SETTINGS)}
                />;
            case GameState.MODE_SELECTION:
                return <ModeSelection onSelect={handleModeSelected} onBack={() => { playSound('click'); setGameState(GameState.DASHBOARD); }} />;
            case GameState.LEADERBOARD_SELECTION:
                return <LeaderboardSelection onSelect={(mode) => { setSelectedLeaderboard(mode); setGameState(GameState.LEADERBOARD); }} onBack={() => setGameState(GameState.DASHBOARD)} />;
            case GameState.LEADERBOARD:
                if (selectedLeaderboard === null) return <div>Error</div>;
                return (
                    <div className="text-center bg-white/80 backdrop-blur-md p-8 md:p-10 rounded-3xl shadow-2xl border-4 border-purple-300 w-full max-w-lg flex flex-col items-center">
                        <Leaderboard leaderboard={leaderboards[selectedLeaderboard]} title={GAME_MODE_NAMES[selectedLeaderboard]} />
                        <button onClick={() => { playSound('click'); setGameState(GameState.LEADERBOARD_SELECTION); }} className="mt-8 px-10 py-4 bg-blue-500 hover:bg-blue-600 text-white text-2xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">Back</button>
                    </div>
                );
            case GameState.SETTINGS:
                return <Settings onBack={() => { playSound('click'); setGameState(GameState.DASHBOARD); }} onContentUpdate={handleContentUpdate} />;
            case GameState.LOADING_WORDS:
            case GameState.LOADING_IMAGE:
                return <LoadingSpinner message="Getting things ready..." />;
            case GameState.PLAYING:
            case GameState.CORRECT_GUESS:
                if (gameMode === GameMode.WORD_SPROUTS) {
                     return (
                        <div className="w-full h-full flex flex-col items-center justify-center pt-28 md:pt-8 space-y-4 md:space-y-6">
                             <div className="relative w-full max-w-sm md:max-w-lg h-64 md:h-80 bg-white rounded-3xl shadow-2xl border-4 border-blue-300 flex items-center justify-center p-4">
                                {currentImage ? <img src={currentImage} alt={wordList[currentWordIndex]} className="max-w-full max-h-full object-contain rounded-2xl" /> : null}
                            </div>
                            {gameState === GameState.CORRECT_GUESS ? (
                                <div className="flex flex-col items-center space-y-4 text-center">
                                    <h2 className="text-5xl text-green-500 animate-bounce">Correct!</h2>
                                    <p className="text-3xl text-yellow-500 font-bold">The word was: {wordList[currentWordIndex].toUpperCase()}</p>
                                    <button onClick={handleNextWord} className="px-10 py-4 bg-yellow-400 hover:bg-yellow-500 text-white text-2xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">Next Word</button>
                                </div>
                            ) : (
                                <WordArea scrambledLetters={scrambledLetters} userGuess={userGuess} isIncorrect={isIncorrectGuess} 
                                onLetterClick={(item) => { playSound('select'); setIsIncorrectGuess(false); setUserGuess(prev => [...prev, item]); setScrambledLetters(prev => prev.filter(l => l.id !== item.id)); }} 
                                onGuessLetterClick={(item) => { playSound('deselect'); setIsIncorrectGuess(false); setUserGuess(prev => prev.filter(l => l.id !== item.id)); setScrambledLetters(prev => [...prev, item].sort((a, b) => a.id - b.id)); }} 
                                onClear={() => { playSound('clear'); setIsIncorrectGuess(false); prepareWord(wordList[currentWordIndex]); }}  />
                            )}
                        </div>
                    );
                }
                if (gameMode === GameMode.MATH_ADDITION && mathProblem) {
                     const getOptionButtonColor = (option: number) => {
                        if (!isIncorrectGuess) {
                            return 'bg-blue-500 hover:bg-blue-600';
                        }
                        if (option === mathProblem.answer) {
                            return 'bg-green-500';
                        }
                        if (option === selectedMathAnswer) {
                            return 'bg-red-500';
                        }
                        return 'bg-gray-400 cursor-not-allowed';
                    };

                    return (
                        <div className="w-full h-full flex flex-col items-center justify-center pt-28 md:pt-8 space-y-4 md:space-y-6">
                            <div className="relative w-full max-w-sm md:max-w-lg min-h-[256px] md:min-h-[320px] bg-white rounded-3xl shadow-2xl border-4 border-green-300 flex flex-col items-center justify-center p-4 gap-4">
                                <p className="text-5xl md:text-6xl font-bold text-gray-700">{mathProblem.num1} + {mathProblem.num2} = ?</p>
                                <div className="flex items-center justify-center flex-wrap gap-2">
                                    {Array.from({ length: mathProblem.num1 }).map((_, i) => <img key={`n1-${i}`} src={mathProblem.item.image} alt={mathProblem.item.name} className="w-12 h-12 md:w-16 md:h-16" />)}
                                    <span className="text-4xl font-bold mx-2 text-gray-600">+</span>
                                    {Array.from({ length: mathProblem.num2 }).map((_, i) => <img key={`n2-${i}`} src={mathProblem.item.image} alt={mathProblem.item.name} className="w-12 h-12 md:w-16 md:h-16" />)}
                                </div>
                            </div>

                            <div className="w-full max-w-lg flex flex-col items-center space-y-6">
                                <div className="w-full bg-white rounded-2xl shadow-inner p-4 min-h-[80px] flex items-center justify-center border-4 border-gray-200">
                                    {selectedMathAnswer !== null ? (
                                        <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-white text-3xl md:text-4xl rounded-xl shadow-md ${isIncorrectGuess ? 'bg-red-500' : 'bg-green-400'}`}>
                                            {selectedMathAnswer}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-xl">Select an answer below!</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                                    {mathProblem.options.map(option => (
                                        <button 
                                            key={option} 
                                            onClick={() => handleMathAnswer(option)}
                                            disabled={isMathAnswered}
                                            className={`w-14 h-14 md:w-16 md:h-16 text-white text-3xl md:text-4xl rounded-xl shadow-lg transform transition-all duration-200 ${isMathAnswered ? '' : 'hover:-translate-y-1'} ${getOptionButtonColor(option)}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                }
                 if (gameMode === GameMode.COLOR_MATCHING && colorProblem) {
                    const colors: Record<string, string> = { red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-400', orange: 'bg-orange-500', purple: 'bg-purple-500', black: 'bg-gray-800', white: 'bg-gray-100 text-black border-2 border-gray-400', pink: 'bg-pink-400', brown: 'bg-yellow-800' };
                    return (
                        <div className="w-full h-full flex flex-col items-center justify-center pt-28 md:pt-8 space-y-4">
                            <h2 className="text-3xl md:text-4xl text-purple-800 font-bold drop-shadow-md text-center">What color is the {colorProblem.item.name}?</h2>
                            <div className="w-full max-w-sm h-64 md:h-80 bg-white rounded-3xl shadow-2xl border-4 border-purple-300 flex items-center justify-center p-4">
                                <img src={colorProblem.item.image} alt={colorProblem.item.name} className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                {/* FIX: Explicitly type `option` to `string` to resolve `toLowerCase` not existing on type `unknown`. */}
                                {/* FIX: Explicitly type `option` to `string` to resolve `toLowerCase` not existing on type `unknown`. */}
                                {colorProblem.options.map((option: string) => (
                                    <button key={option} onClick={() => option === colorProblem.answer ? handleCorrectAnswer() : handleIncorrectAnswer()}
                                        className={`px-8 py-5 text-white text-3xl font-bold rounded-xl shadow-lg capitalize transform transition-transform hover:scale-105 ${colors[option.toLowerCase()] || 'bg-gray-500'} ${isIncorrectGuess && option !== colorProblem.answer ? 'opacity-50' : ''}`}>
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                }
                return <LoadingSpinner message="Loading..." />; // Fallback
            case GameState.GAME_OVER:
                return <GameOver playerName={playerName} score={score} highScore={playerHighScore} reason={gameOverReason} onPlayAgain={() => gameMode !== null && handleModeSelected(gameMode)} onGoToDashboard={() => { playSound('click'); setGameState(GameState.DASHBOARD); }} />;
            default: return <div>Something went wrong!</div>;
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-sky-200 to-lime-200 w-full flex items-center justify-center p-4 overflow-hidden">
            {gameState !== GameState.DASHBOARD && gameState !== GameState.LEADERBOARD_SELECTION && gameState !== GameState.LEADERBOARD && gameState !== GameState.SETTINGS && gameState !== GameState.MODE_SELECTION && <Scoreboard score={score} lives={lives} />}
            {renderGameState()}
        </main>
    );
};
export default App;
