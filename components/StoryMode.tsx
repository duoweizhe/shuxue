
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Sparkles, Bot, ListOrdered, Hash, Delete, Check, RotateCcw } from 'lucide-react';
import { WordProblem, Difficulty } from '../types';
import { generateWordProblem, getEncouragement } from '../services/geminiService';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

const difficultyLabels: Record<Difficulty, string> = {
  [Difficulty.EASY]: "简单",
  [Difficulty.MEDIUM]: "中等",
  [Difficulty.HARD]: "困难"
};

type AnswerMode = 'CHOICE' | 'INPUT';

const StoryMode: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<WordProblem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('CHOICE');
  const [userInputValue, setUserInputValue] = useState<string>("");
  const [isWrong, setIsWrong] = useState(false);

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setCompleted(false);
    setProblem(null);
    setSelectedOption(null);
    setUserInputValue("");
    setIsWrong(false);
    
    const data = await generateWordProblem(difficulty);
    setProblem(data);
    setLoading(false);
  }, [difficulty]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleCorrect = async () => {
    playCorrectSound();
    setCompleted(true);
    setIsWrong(false);
    confetti({ 
      particleCount: 150, 
      spread: 100,
      origin: { y: 0.6 }
    });
    const msg = await getEncouragement(true);
    setFeedback(msg);
  };

  const handleIncorrect = async () => {
    playIncorrectSound();
    setIsWrong(true);
    const msg = await getEncouragement(false);
    setFeedback(msg);
    // 重置震动状态
    setTimeout(() => setIsWrong(false), 500);
  };

  const handleOptionClick = async (selected: number) => {
    if (!problem || completed) return;
    setSelectedOption(selected);

    if (selected === problem.answer) {
      await handleCorrect();
    } else {
      await handleIncorrect();
    }
  };

  const handleKeypadPress = (key: string) => {
    if (completed) return;
    setFeedback(null);

    if (key === 'DEL') {
      setUserInputValue(prev => prev.slice(0, -1));
    } else if (key === 'CLR') {
      setUserInputValue("");
    } else {
      if (userInputValue.length < 5) {
        setUserInputValue(prev => prev + key);
      }
    }
  };

  const handleSubmitInput = useCallback(async () => {
    if (!problem || completed || userInputValue === "") return;
    
    const val = parseInt(userInputValue);
    if (val === problem.answer) {
      await handleCorrect();
    } else {
      await handleIncorrect();
    }
  }, [problem, completed, userInputValue]);

  // 物理键盘支持
  useEffect(() => {
    if (answerMode !== 'INPUT' || completed || loading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeypadPress('DEL');
      } else if (e.key === 'Enter') {
        handleSubmitInput();
      } else if (e.key === 'Escape') {
        handleKeypadPress('CLR');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answerMode, completed, loading, handleSubmitInput]);

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto animate-fade-in pb-12">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg text-purple-500 hover:scale-110 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        
        <div className="flex bg-white p-1 rounded-full shadow-md border border-purple-100">
           <button 
             onClick={() => setAnswerMode('CHOICE')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${answerMode === 'CHOICE' ? 'bg-purple-500 text-white' : 'text-slate-400'}`}
           >
             <ListOrdered size={18} /> 选择模式
           </button>
           <button 
             onClick={() => { setAnswerMode('INPUT'); setUserInputValue(""); }}
             className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${answerMode === 'INPUT' ? 'bg-purple-500 text-white' : 'text-slate-400'}`}
           >
             <Hash size={18} /> 填空模式
           </button>
        </div>
      </div>

      {/* Difficulty Controls */}
      <div className="flex gap-2 mb-6">
          {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(Difficulty[d])}
              className={`px-4 py-1 rounded-full text-xs md:text-sm font-bold transition-colors ${difficulty === Difficulty[d] ? 'bg-purple-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              {difficultyLabels[Difficulty[d]]}
            </button>
          ))}
      </div>

      {/* Main Content Card */}
      <div className="w-full bg-white rounded-[40px] shadow-2xl border-b-[12px] border-purple-100 overflow-hidden min-h-[500px] flex flex-col relative">
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <p className="text-purple-500 font-bold text-lg animate-pulse">魔法正在编写故事...</p>
          </div>
        )}

        {!loading && problem && (
          <div className="p-6 md:p-10 flex-1 flex flex-col">
            {/* Story Box */}
            <div className="bg-purple-50 p-6 md:p-8 rounded-[30px] mb-8 relative border-2 border-purple-100">
                <Sparkles className="absolute -top-4 -right-4 text-yellow-400 fill-yellow-400 animate-pulse" size={36} />
                <p className="text-xl md:text-2xl text-slate-700 leading-relaxed font-medium">
                  {problem.story}
                </p>
                <div className="mt-6 pt-4 border-t border-purple-200">
                   <h3 className="text-2xl md:text-3xl font-black text-purple-700">
                    {problem.question}
                  </h3>
                </div>
            </div>

            {/* Answer Feedback */}
            <div className="h-12 mb-6 flex items-center justify-center">
                {feedback && (
                    <div className={`text-2xl font-bold animate-bounce py-2 px-6 rounded-2xl ${completed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {feedback}
                    </div>
                )}
            </div>

            {/* Dynamic Answer Area */}
            <div className="flex-1 flex flex-col justify-end">
              {answerMode === 'CHOICE' ? (
                /* Choice Buttons */
                <div className="grid grid-cols-2 gap-4">
                  {problem.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = completed && opt === problem.answer;
                    
                    let btnClass = "bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600";
                    if (isCorrect) {
                        btnClass = "bg-green-500 text-white border-green-700 scale-105 shadow-xl";
                    } else if (isSelected && !completed) {
                        btnClass = "bg-red-500 text-white border-red-700 animate-shake";
                    }

                    return (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(opt)}
                          disabled={completed}
                          className={`py-5 rounded-2xl text-3xl font-black border-b-4 transition-all transform active:translate-y-1 active:border-b-0 ${btnClass}`}
                        >
                          {opt}
                        </button>
                    );
                  })}
                </div>
              ) : (
                /* Input / Keypad Area */
                <div className="w-full flex flex-col items-center">
                  {/* Input Display */}
                  <div className={`mb-8 w-full max-w-xs h-20 bg-purple-50 rounded-2xl border-4 flex items-center justify-center text-4xl font-black transition-all ${isWrong ? 'border-red-400 animate-shake bg-red-50' : completed ? 'border-green-400 bg-green-50 text-green-600' : 'border-purple-200 text-purple-600'}`}>
                      {userInputValue === "" ? (
                        <span className="text-purple-200">?</span>
                      ) : (
                        userInputValue
                      )}
                      {!completed && <span className="w-1 h-10 bg-purple-400 ml-1 animate-pulse rounded-full"></span>}
                  </div>

                  {/* Keypad */}
                  <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <button 
                        key={n} 
                        onClick={() => handleKeypadPress(n.toString())}
                        disabled={completed}
                        className="bg-white border-2 border-slate-100 rounded-xl py-4 text-2xl font-black text-slate-700 hover:bg-purple-50 active:bg-purple-100 transition-colors shadow-sm"
                      >
                        {n}
                      </button>
                    ))}
                    <button 
                      onClick={() => handleKeypadPress('DEL')}
                      disabled={completed}
                      className="bg-orange-50 text-orange-600 border-2 border-orange-100 rounded-xl py-4 flex items-center justify-center hover:bg-orange-100"
                    >
                      <Delete size={28} />
                    </button>
                    <button 
                      onClick={() => handleKeypadPress('0')}
                      disabled={completed}
                      className="bg-white border-2 border-slate-100 rounded-xl py-4 text-2xl font-black text-slate-700 hover:bg-purple-50"
                    >
                      0
                    </button>
                    <button 
                      onClick={handleSubmitInput}
                      disabled={completed || userInputValue === ""}
                      className="bg-green-500 text-white rounded-xl py-4 flex items-center justify-center shadow-lg hover:bg-green-600 disabled:opacity-50 disabled:grayscale"
                    >
                      <Check size={32} strokeWidth={4} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Next Problem Button */}
            {completed && (
                <button 
                    onClick={loadProblem}
                    className="mt-8 w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-2xl font-black rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all animate-fade-in flex items-center justify-center gap-3"
                >
                    <Sparkles /> 下一个故事
                </button>
            )}
          </div>
        )}

        {!loading && !problem && (
            <div className="flex flex-col items-center justify-center h-full p-10">
                <Bot size={64} className="text-slate-200 mb-4" />
                <p className="text-slate-400 mb-6 font-bold">哎呀，AI 正在休息，请稍后再试。</p>
                <button 
                  onClick={loadProblem} 
                  className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-600 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                >
                  <RotateCcw size={20} /> 点击重试
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default StoryMode;
