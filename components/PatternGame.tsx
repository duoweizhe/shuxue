
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Zap, Heart, RotateCcw, Settings, Star, Hexagon, Cpu } from 'lucide-react';
import { PatternProblem, Difficulty } from '../types';
import { generatePatternProblem } from '../services/geminiService';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

const PatternGame: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [problem, setProblem] = useState<PatternProblem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Game Mechanics
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [isFailed, setIsFailed] = useState(false);
  const [rewardAnim, setRewardAnim] = useState<string | null>(null); 

  const loadProblem = useCallback(async () => {
    if (isFailed) return;

    setLoading(true);
    setFeedback(null);
    setCompleted(false);
    setProblem(null);
    setSelectedOption(null);
    const data = await generatePatternProblem(difficulty);
    setProblem(data);
    setLoading(false);
  }, [isFailed, difficulty]);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleRestart = () => {
    setLives(3);
    setCombo(0);
    setIsFailed(false);
    setLoading(true);
    setTimeout(() => {
        loadProblem();
    }, 100);
  };

  const triggerReward = () => {
      setRewardAnim("+1 ❤️");
      setTimeout(() => setRewardAnim(null), 1500);
  };

  const handleAnswer = async (val: number) => {
    if (!problem || completed || isFailed) return;
    setSelectedOption(val);

    if (val === problem.answer) {
      playCorrectSound();
      setCompleted(true);
      
      const newCombo = combo + 1;
      setCombo(newCombo);
      
      let msg = newCombo > 1 ? `连击 x${newCombo}！` : "回答正确！";

      if (newCombo % 3 === 0) {
          setLives(prev => {
              if (prev < 10) {
                  triggerReward();
                  return prev + 1;
              }
              return prev;
          });
          msg += " 能量恢复！";
      }

      const particleCount = 100 + (newCombo * 20); 
      confetti({ 
          particleCount: Math.min(particleCount, 300), 
          spread: 70,
          colors: problem.layout === 'GRID' ? ['#00ff00', '#000000', '#cccccc'] : ['#26ccff', '#a25afd', '#ff5e7e']
      });
      
      setFeedback(msg);
    } else {
      playIncorrectSound();
      
      setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
              setIsFailed(true);
              setCombo(0);
              setFeedback("次数用尽！");
              return 0;
          }
          setCombo(0);
          setFeedback("逻辑错误！能量受损！");
          return newLives;
      });
    }
  };

  // --- Visual Renderers ---

  const RenderConstellation = ({ seq }: { seq: (string | number)[] }) => {
    const points = seq.map((_, i) => {
        const x = 12 + (i / (seq.length - 1)) * 76; 
        const y = 50 + Math.sin(i * 1.5) * 30; 
        return { x, y };
    });

    return (
        <div className="relative w-full h-[240px] md:h-[300px] bg-slate-900 rounded-3xl overflow-hidden shadow-inner border-2 border-slate-700">
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <polyline 
                    points={points.map(p => `${p.x}%,${p.y}%`).join(' ')} 
                    fill="none" 
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="2" 
                    strokeDasharray="5,5"
                />
            </svg>
            {seq.map((item, idx) => (
                <div 
                    key={idx}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full text-lg md:text-2xl font-bold shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-500 z-10
                        ${item === '?' ? 'bg-yellow-400 text-yellow-900 animate-pulse scale-110' : 'bg-slate-800 text-white border-2 border-slate-500'}
                    `}
                    style={{ left: `${points[idx].x}%`, top: `${points[idx].y}%` }}
                >
                    {item === '?' ? <Star fill="currentColor" size={20} /> : item}
                </div>
            ))}
        </div>
    );
  };

  const RenderGears = ({ seq }: { seq: (string | number)[] }) => {
    return (
        <div className="relative w-full max-w-[320px] aspect-square mx-auto bg-amber-50 rounded-3xl overflow-hidden border-4 border-amber-200 flex items-center justify-center">
            <Settings size={280} className="absolute text-amber-100 opacity-50 animate-[spin_20s_linear_infinite]" />
            <div className="relative w-[80%] h-[80%] rounded-full border-dashed border-4 border-amber-300 animate-[spin_60s_linear_infinite] shadow-xl bg-amber-100/30 backdrop-blur-sm">
                 <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-amber-600 rounded-full -translate-x-1/2 -translate-y-1/2 border-4 border-amber-300 z-10"></div>
                 {seq.map((item, idx) => {
                     const angleDeg = (idx * (360 / seq.length)) - 90;
                     const angleRad = angleDeg * (Math.PI / 180);
                     const r = 38; 
                     const left = 50 + r * Math.cos(angleRad);
                     const top = 50 + r * Math.sin(angleRad);
                     return (
                         <div 
                            key={idx}
                            className="absolute w-12 h-12 md:w-16 md:h-16 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
                            style={{ left: `${left}%`, top: `${top}%` }}
                         >
                             <div 
                                className="w-full h-full flex items-center justify-center"
                                style={{ animation: 'spin 60s linear infinite reverse' }}
                             >
                                 <div 
                                    className={`w-full h-full flex items-center justify-center rounded-lg shadow-md transition-all
                                        ${item === '?' ? 'bg-amber-500 text-white animate-bounce' : 'bg-white text-amber-800 border-2 border-amber-400'}
                                    `}
                                 >
                                     <span className={`text-lg md:text-xl font-black border-b-2 pb-0.5 ${item === '?' ? 'border-white/50' : 'border-amber-800/30'}`}>
                                        {item}
                                     </span>
                                 </div>
                             </div>
                         </div>
                     );
                 })}
            </div>
        </div>
    );
  };

  const RenderMatrix = ({ seq }: { seq: (string | number)[] }) => {
      return (
          <div className="relative w-full max-w-[280px] md:max-w-xs mx-auto bg-black rounded-2xl p-3 md:p-4 border-2 border-green-500 shadow-[0_0_20px_rgba(0,255,0,0.2)]">
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.05)_50%)] bg-[length:100%_4px] pointer-events-none z-10"></div>
              <div className="grid grid-cols-3 gap-2 md:gap-3 relative z-0">
                  {seq.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`aspect-square flex items-center justify-center text-xl md:text-3xl font-mono font-bold rounded-sm border transition-all
                            ${item === '?' 
                                ? 'bg-green-900/50 text-green-400 border-green-400 animate-pulse shadow-[inset_0_0_10px_rgba(0,255,0,0.5)]' 
                                : 'bg-slate-900 text-green-600 border-slate-700 hover:border-green-700'}
                        `}
                      >
                          {item === '?' ? <span className="animate-ping absolute opacity-75">?</span> : null}
                          {item}
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const currentLayout = problem?.layout || 'LINEAR';
  
  const getTheme = () => {
      switch(currentLayout) {
          case 'GRID': return { 
              bg: 'bg-slate-950', 
              btnDefault: 'bg-slate-800 text-green-500 border-green-900 hover:bg-slate-700',
              btnIcon: <Cpu size={20} />
          };
          case 'CIRCLE': return { 
              bg: 'bg-orange-50', 
              btnDefault: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
              btnIcon: <Settings size={20} />
          };
          default: return { 
              bg: 'bg-slate-900', 
              btnDefault: 'bg-slate-800 text-blue-200 border-slate-600 hover:bg-slate-700',
              btnIcon: <Star size={20} />
          };
      }
  };
  
  const theme = getTheme();

  return (
    <div className={`flex flex-col items-center w-full max-w-3xl mx-auto animate-fade-in min-h-[90vh] transition-colors duration-500 p-2 md:p-0`}>
      
      {/* HUD Header */}
      <div className="w-full flex items-center justify-between mb-2 md:mb-4 bg-white/90 backdrop-blur-sm p-3 md:p-4 rounded-2xl shadow-lg border-b-4 border-slate-100 z-10 sticky top-2">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          
          <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
             <button 
                onClick={() => setDifficulty(Difficulty.EASY)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${difficulty === Difficulty.EASY ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
             >
                基础版
             </button>
             <button 
                onClick={() => setDifficulty(Difficulty.MEDIUM)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${difficulty === Difficulty.MEDIUM ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
             >
                进阶版
             </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
             <div className="flex items-center gap-1 relative">
                 {[...Array(3)].map((_, i) => (
                    <Heart 
                        key={i} 
                        size={24} 
                        className={`${i < lives ? 'text-red-500 fill-red-500 drop-shadow-sm' : 'text-slate-200 fill-slate-200'} transition-all duration-300 md:w-7 md:h-7`} 
                    />
                 ))}
                 {lives > 3 && <span className="text-red-500 font-black text-xl ml-1">+{lives-3}</span>}
                 {rewardAnim && (
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-green-500 font-black text-2xl animate-bounce whitespace-nowrap drop-shadow-md">
                         {rewardAnim}
                     </div>
                 )}
             </div>

             <div className={`flex items-center gap-1 font-mono font-bold text-lg md:text-xl ${combo > 2 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`}>
                 <Zap fill="currentColor" size={18} />
                 <span>x{combo}</span>
             </div>
        </div>
      </div>

      {/* Mobile Difficulty Selector */}
      <div className="sm:hidden w-full flex bg-white/50 backdrop-blur-sm p-1 rounded-xl mb-4">
          <button 
            onClick={() => setDifficulty(Difficulty.EASY)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${difficulty === Difficulty.EASY ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
          >
            基础版
          </button>
          <button 
            onClick={() => setDifficulty(Difficulty.MEDIUM)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${difficulty === Difficulty.MEDIUM ? 'bg-white shadow-sm text-purple-600' : 'text-slate-400'}`}
          >
            进阶版
          </button>
      </div>

      <div className={`w-full ${theme.bg} rounded-3xl shadow-2xl overflow-hidden min-h-[450px] flex flex-col relative transition-colors duration-500 border-4 border-opacity-50 border-white`}>
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin mb-4"></div>
            <p className="font-bold text-lg text-white animate-pulse">正在解码时空规律...</p>
          </div>
        )}

        {!loading && problem && (
          <div className="p-4 md:p-8 flex-1 flex flex-col items-center w-full">
            
            <div className="w-full mb-4 md:mb-8 transform transition-all hover:scale-[1.01] flex justify-center">
                {problem.layout === 'GRID' && <RenderMatrix seq={problem.sequence} />}
                {problem.layout === 'CIRCLE' && <RenderGears seq={problem.sequence} />}
                {problem.layout === 'LINEAR' && <RenderConstellation seq={problem.sequence} />}
            </div>

            {(completed || isFailed) && (
                 <div className={`w-full mb-4 md:mb-6 p-3 md:p-4 rounded-xl animate-fade-in flex flex-col items-center border-l-4 shadow-lg
                    ${completed ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}>
                    <div className={`text-lg md:text-xl font-bold ${completed ? 'text-green-700' : 'text-red-700'}`}>
                       {feedback}
                    </div>
                    {problem.explanation && (
                        <div className="mt-2 text-slate-700 text-xs md:text-sm font-medium leading-relaxed bg-white/50 p-2 md:p-3 rounded-lg w-full">
                           <span className="font-bold mr-2">💡 解析:</span>
                           {problem.explanation}
                        </div>
                    )}
                 </div>
            )}
            
            {!completed && !isFailed && feedback && (
                <div className="mb-4 text-orange-400 font-bold animate-bounce text-lg">{feedback}</div>
            )}

            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mt-auto">
              {problem.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                let btnClass = `relative h-14 md:h-20 rounded-xl text-xl md:text-3xl font-bold border-b-4 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 overflow-hidden group
                    ${theme.btnDefault}`;
                
                if (completed || isFailed) {
                    if (opt === problem.answer) {
                        btnClass = 'bg-green-500 text-white border-green-700 shadow-[0_0_15px_rgba(34,197,94,0.6)] z-10 scale-105';
                    } else if (isSelected && isFailed) {
                        btnClass = 'bg-red-500 text-white border-red-700 opacity-80';
                    } else {
                        btnClass = 'bg-slate-200 text-slate-400 border-slate-300 opacity-50 cursor-not-allowed';
                    }
                } else {
                    if (isSelected) {
                        btnClass = 'bg-red-500 text-white border-red-700 animate-shake'; 
                    }
                }

                return (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        disabled={completed || isFailed}
                        className={btnClass}
                    >
                        <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:rotate-12">
                            {problem.layout === 'GRID' ? <Hexagon size={50} /> : problem.layout === 'CIRCLE' ? <Settings size={50} /> : <Star size={50} />}
                        </div>
                        {theme.btnIcon}
                        {opt}
                    </button>
                );
              })}
            </div>

            {(completed || isFailed) && (
                <button 
                    onClick={isFailed ? handleRestart : loadProblem}
                    className={`mt-4 md:mt-6 w-full py-3 md:py-4 text-white text-lg md:text-xl font-bold rounded-xl shadow-lg hover:brightness-110 transition-all animate-fade-in flex items-center justify-center gap-2
                        ${isFailed ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                >
                    {isFailed ? <RotateCcw /> : <Zap />}
                    {isFailed ? "重新初始化" : "进入下一层"}
                </button>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PatternGame;
