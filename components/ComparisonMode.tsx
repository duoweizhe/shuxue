
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Star, Equal, ChevronLeft, ChevronRight, Zap, Clock, Trophy, Target, Flame, RotateCcw, Award, Hash, BarChart3, AlertTriangle, Heart, Settings2, Layers, Binary, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'CHALLENGE';
type ChallengeTime = 3 | 5 | 8;

interface Side {
  text: string;
  value: number;
}

interface HistoryRecord {
  score: number;
  correctCount: number;
  date: string;
  timeTier: ChallengeTime;
  internalDiff: Difficulty;
  termCount: number;
}

const ComparisonMode: React.FC<Props> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'SELECTING' | 'PLAYING' | 'RESULTS'>('SELECTING');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [challengeTime, setChallengeTime] = useState<ChallengeTime>(5);
  
  const [challengeInternalDiff, setChallengeInternalDiff] = useState<Difficulty>('MEDIUM');
  const [challengeTermCount, setChallengeTermCount] = useState<number>(2); 
  
  const [viewingTier, setViewingTier] = useState<ChallengeTime>(5);
  
  const [left, setLeft] = useState<Side | null>(null);
  const [right, setRight] = useState<Side | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3); 
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState("");
  const [isWrong, setIsWrong] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const [rankings, setRankings] = useState<Record<ChallengeTime, HistoryRecord[]>>({
    3: [], 5: [], 8: []
  });
  const [rankView, setRankView] = useState<'SCORE' | 'COUNT'>('SCORE');

  const [timeLeft, setTimeLeft] = useState<number>(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('math_comparison_v12_ranks');
    if (saved) {
      setRankings(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (finalScore: number, finalCount: number) => {
    if (difficulty !== 'CHALLENGE') return;

    const newRecord: HistoryRecord = {
      score: finalScore,
      correctCount: finalCount,
      date: new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
      timeTier: challengeTime,
      internalDiff: challengeInternalDiff,
      termCount: challengeInternalDiff === 'EASY' ? 1 : challengeTermCount
    };

    const updatedRanks = { ...rankings };
    const tierRanks = [...updatedRanks[challengeTime], newRecord];
    
    tierRanks.sort((a, b) => b.score - a.score);
    updatedRanks[challengeTime] = tierRanks.slice(0, 15);
    
    setRankings(updatedRanks);
    localStorage.setItem('math_comparison_v12_ranks', JSON.stringify(updatedRanks));
  };

  const calculatePoints = (isCorrect: boolean) => {
    if (!isCorrect) return 0;
    if (difficulty !== 'CHALLENGE') return 10;
    
    let base = 10;
    if (challengeTime === 8) base = 10;
    else if (challengeTime === 5) base = 15;
    else if (challengeTime === 3) base = 20;

    let diffMultiplier = 1.0;
    if (challengeInternalDiff === 'EASY') diffMultiplier = 0.7;
    if (challengeInternalDiff === 'HARD') diffMultiplier = 1.4;

    let termMultiplier = 1.0;
    if (challengeInternalDiff !== 'EASY') {
        if (challengeTermCount === 3) termMultiplier = 1.25;
        if (challengeTermCount === 4) termMultiplier = 1.5;
    }

    return Math.round(base * diffMultiplier * termMultiplier);
  };

  const generateExpression = (diff: Difficulty, terms: number): Side => {
    if (diff === 'EASY' || terms === 1) {
      const val = Math.floor(Math.random() * 98) + 1;
      return { text: val.toString(), value: val };
    }

    const getOp = (currentValue: number) => {
        if (diff === 'MEDIUM') {
            return (Math.random() > 0.5 || currentValue < 10) ? '+' : '-';
        }
        return Math.random() > 0.5 ? '×' : '÷';
    };

    let currentValue: number;
    let lastNumber: number; // 记录最后一个操作数，方便修正
    
    if (diff === 'HARD') {
        lastNumber = Math.floor(Math.random() * 10) + 2;
        currentValue = lastNumber;
    } else {
        lastNumber = Math.floor(Math.random() * 20) + 5;
        currentValue = lastNumber;
    }
    
    let expressionText = lastNumber.toString();
    let hasAddSub = false; // 标记算式中是否有加减法，决定是否需要括号

    for (let i = 1; i < terms; i++) {
        const op = getOp(currentValue);
        
        if (op === '+') {
            const nextVal = Math.floor(Math.random() * 20) + 1;
            currentValue += nextVal;
            expressionText = `${expressionText}+${nextVal}`;
            lastNumber = nextVal;
            hasAddSub = true;
        } else if (op === '-') {
            const nextVal = Math.floor(Math.random() * (currentValue - 1)) + 1;
            currentValue -= nextVal;
            expressionText = `${expressionText}-${nextVal}`;
            lastNumber = nextVal;
            hasAddSub = true;
        } else if (op === '×') {
            const nextVal = Math.floor(Math.random() * 5) + 2;
            currentValue *= nextVal;
            // 只有当前面有加减法时才套一层括号
            if (hasAddSub) {
                expressionText = `(${expressionText})×${nextVal}`;
                hasAddSub = false; // 乘法后，整个括号块被视为一个乘法项
            } else {
                expressionText = `${expressionText}×${nextVal}`;
            }
            lastNumber = nextVal;
        } else if (op === '÷') {
            const divisor = Math.floor(Math.random() * 5) + 2;
            
            // 修正整除逻辑：不套新括号，而是直接调整最后一个数
            const remainder = currentValue % divisor;
            if (remainder !== 0) {
                const toAdd = divisor - remainder;
                currentValue += toAdd;
                
                // 找到最后一个数字并替换它，而不是在外面套一层加法括号
                const lastNumRegex = /(\d+)$/;
                const match = expressionText.match(lastNumRegex);
                if (match) {
                    const oldLastNum = parseInt(match[0]);
                    expressionText = expressionText.replace(lastNumRegex, (oldLastNum + toAdd).toString());
                } else {
                    // 兜底方案（理论上不应该进入这里）
                    expressionText = `(${expressionText}+${toAdd})`;
                }
            }
            
            currentValue = currentValue / divisor;
            
            // 同样，只有加减法需要括号
            if (hasAddSub) {
                expressionText = `(${expressionText})÷${divisor}`;
                hasAddSub = false;
            } else {
                expressionText = `${expressionText}÷${divisor}`;
            }
        }
    }

    // 清理逻辑：移除类似 ((A)) 的双重括号
    let cleanedText = expressionText;
    while (cleanedText.includes('((')) {
        cleanedText = cleanedText.replace(/\(\((.*?)\)\)/g, '($1)');
    }

    return { text: cleanedText, value: currentValue };
  };

  const generateQuestion = useCallback(() => {
    setMessage("");
    setIsWrong(false);
    setCompleted(false);

    let currentDiff: Difficulty = difficulty;
    let currentTerms: number = 1;

    if (difficulty === 'CHALLENGE') {
        currentDiff = challengeInternalDiff;
        currentTerms = currentDiff === 'EASY' ? 1 : challengeTermCount;
    } else {
        currentDiff = difficulty;
        currentTerms = currentDiff === 'EASY' ? 1 : challengeTermCount;
    }

    let l = generateExpression(currentDiff, currentTerms);
    let r = generateExpression(currentDiff, currentTerms);

    if (Math.random() > 0.9) {
      const val = l.value;
      r = { text: val.toString(), value: val };
    }

    setLeft(l);
    setRight(r);

    if (difficulty === 'CHALLENGE') {
      setTimeLeft(challengeTime);
    }
  }, [difficulty, challengeTime, challengeInternalDiff, challengeTermCount]);

  const handleGameOver = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (difficulty === 'CHALLENGE') {
        saveToHistory(score, correctCount);
        setGameState('RESULTS');
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    } else {
        setGameState('SELECTING');
    }
  }, [score, correctCount, difficulty, challengeTime, rankings, challengeInternalDiff, challengeTermCount]);

  useEffect(() => {
    if (gameState === 'PLAYING' && difficulty === 'CHALLENGE' && !completed && !isWrong) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0.1) {
            handleGameOver();
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, difficulty, completed, isWrong, handleGameOver]);

  const handleAnswer = (sign: '<' | '=' | '>') => {
    if (!left || !right || completed || isWrong) return;

    if (timerRef.current && difficulty === 'CHALLENGE') clearInterval(timerRef.current);

    let correct = false;
    if (sign === '<') correct = left.value < right.value;
    else if (sign === '=') correct = Math.abs(left.value - right.value) < 0.001;
    else if (sign === '>') correct = left.value > right.value;

    if (correct) {
      playCorrectSound();
      const points = calculatePoints(true);
      const newStreak = streak + 1;
      setScore(s => s + points);
      setCorrectCount(c => c + 1);
      setStreak(newStreak);
      
      if (difficulty === 'CHALLENGE' && newStreak % 5 === 0) {
          setLives(l => l + 1);
          setMessage(`连胜奖励 +1❤️!`);
      } else {
          setMessage(`+${points} 棒极了!`);
      }

      setCompleted(true);
      setTimeout(generateQuestion, difficulty === 'CHALLENGE' ? 400 : 800);
    } else {
      playIncorrectSound();
      setStreak(0);
      setIsWrong(true);
      
      if (difficulty === 'CHALLENGE') {
          const newLives = lives - 1;
          setLives(newLives);
          setMessage(`扣除 1❤️!`);
          
          if (newLives <= 0) {
              setTimeout(handleGameOver, 800);
              return;
          }
      } else {
          setMessage("再算算看!");
      }

      setTimeout(() => {
          setIsWrong(false);
          setMessage("");
          generateQuestion();
      }, 1000);
    }
  };

  const startLevel = (diff: Difficulty, tier?: ChallengeTime) => {
    setDifficulty(diff);
    const time = tier || 5;
    if (diff === 'CHALLENGE') {
      setChallengeTime(time);
      setTimeLeft(time);
      setScore(0);
      setLives(3);
    } else {
      setScore(0);
    }
    setCorrectCount(0);
    setStreak(0);
    setGameState('PLAYING');
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      generateQuestion();
    }
  }, [gameState, difficulty, generateQuestion]);

  if (gameState === 'SELECTING') {
    const currentTierRanks = [...rankings[viewingTier]].sort((a, b) => 
        rankView === 'SCORE' ? b.score - a.score : b.correctCount - a.correctCount
    );

    return (
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto animate-fade-in pb-10 px-4 text-slate-800">
        <div className="w-full flex items-center justify-between mb-8">
          <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg text-slate-400 hover:text-rose-500 transition-all">
            <ArrowLeft size={28} strokeWidth={3} />
          </button>
          <h2 className="text-3xl font-black tracking-tight">数字比大小</h2>
          <div className="w-12"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button onClick={() => startLevel('EASY')} className="group bg-white p-6 rounded-[32px] shadow-xl border-b-8 border-emerald-200 hover:-translate-y-2 transition-all text-left">
                    <div className="flex flex-col gap-3">
                        <div className="p-4 w-fit bg-emerald-100 rounded-2xl text-emerald-600 transition-transform group-hover:scale-110"><Target size={32}/></div>
                        <div><h3 className="text-xl font-bold">基础练习</h3><p className="text-xs text-slate-400">纯数字比大小</p></div>
                    </div>
                </button>
                <button onClick={() => startLevel('MEDIUM')} className="group bg-white p-6 rounded-[32px] shadow-xl border-b-8 border-blue-200 hover:-translate-y-2 transition-all text-left">
                    <div className="flex flex-col gap-3">
                        <div className="p-4 w-fit bg-blue-100 rounded-2xl text-blue-600 transition-transform group-hover:scale-110"><Zap size={32}/></div>
                        <div><h3 className="text-xl font-bold">进阶特训</h3><p className="text-xs text-slate-400">{challengeTermCount}项加减运算</p></div>
                    </div>
                </button>
                <button onClick={() => startLevel('HARD')} className="group bg-white p-6 rounded-[32px] shadow-xl border-b-8 border-purple-200 hover:-translate-y-2 transition-all text-left">
                    <div className="flex flex-col gap-3">
                        <div className="p-4 w-fit bg-purple-100 rounded-2xl text-purple-600 transition-transform group-hover:scale-110"><Trophy size={32}/></div>
                        <div><h3 className="text-xl font-bold">数学高手</h3><p className="text-xs text-slate-400">{challengeTermCount}项乘除运算</p></div>
                    </div>
                </button>
            </div>

            <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl border-b-8 border-rose-500 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10 text-white transform rotate-12">
                   <Clock size={160} />
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-8 relative z-10">
                    <div className="p-5 bg-rose-500 rounded-3xl text-white animate-pulse shadow-lg shadow-rose-500/50"><Clock size={40}/></div>
                    <div>
                        <h3 className="text-3xl font-black text-white">极限生存</h3>
                        <p className="text-slate-400 font-medium text-sm">挑战你的极限。项数对全模式生效。</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-400 text-sm font-bold"><Settings2 size={16}/> 运算类型 (难度)</div>
                        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                           {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(d => (
                               <button 
                                key={d} 
                                onClick={() => setChallengeInternalDiff(d)}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${challengeInternalDiff === d ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   {d === 'EASY' ? '纯数字' : d === 'MEDIUM' ? '加减法' : '乘除法'}
                               </button>
                           ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-400 text-sm font-bold"><Layers size={16}/> 算式项数 (影响全模式)</div>
                        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                           {[2, 3, 4].map(n => (
                               <button 
                                key={n} 
                                onClick={() => setChallengeTermCount(n)}
                                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${challengeTermCount === n ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                               >
                                   {n}项
                               </button>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 relative z-10">
                    {[8, 5, 3].map(t => (
                        <button key={t} onClick={() => startLevel('CHALLENGE', t as ChallengeTime)} className="group relative bg-slate-800 hover:bg-rose-600 text-white py-6 rounded-3xl font-black transition-all border-b-4 border-slate-700 hover:border-rose-400 active:translate-y-1 active:border-b-0">
                            <span className="text-2xl">{t}</span><span className="text-sm ml-1 opacity-60">秒档</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] shadow-2xl p-8 border-2 border-slate-50 flex flex-col h-full min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-xl font-black flex items-center gap-3"><Trophy size={24} className="text-yellow-500"/> 排行榜</h4>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    <button onClick={() => setRankView('SCORE')} className={`p-2 rounded-xl transition-all ${rankView === 'SCORE' ? 'bg-white shadow-md text-rose-500' : 'text-slate-400'}`} title="最高积分"><BarChart3 size={20}/></button>
                    <button onClick={() => setRankView('COUNT')} className={`p-2 rounded-xl transition-all ${rankView === 'COUNT' ? 'bg-white shadow-md text-blue-500' : 'text-slate-400'}`} title="最高关数"><Hash size={20}/></button>
                </div>
             </div>

             <div className="flex gap-2 mb-6">
                {[8, 5, 3].map(t => (
                  <button key={t} onClick={() => setViewingTier(t as ChallengeTime)} className={`flex-1 py-2 text-xs font-black rounded-xl border-2 transition-all ${viewingTier === t ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                    {t}s 档
                  </button>
                ))}
             </div>
             
             <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {currentTierRanks.length > 0 ? currentTierRanks.map((r, i) => (
                    <div key={i} className="group flex flex-col p-4 bg-slate-50 rounded-[24px] hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-400 text-white shadow-lg shadow-yellow-200' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>{i+1}</div>
                                <span className="text-[10px] text-slate-400 font-bold">{r.date}</span>
                            </div>
                            <div className="text-lg font-black leading-none">
                                {rankView === 'SCORE' ? `${r.score}分` : `${r.correctCount}关`}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${r.internalDiff === 'HARD' ? 'bg-purple-50 text-purple-500 border-purple-100' : r.internalDiff === 'MEDIUM' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                                {r.internalDiff === 'HARD' ? '乘除法' : r.internalDiff === 'MEDIUM' ? '加减法' : '纯数字'}
                            </span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-200 text-slate-500 border border-slate-300">
                                {r.termCount}项
                            </span>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                        <Award size={64} strokeWidth={1}/><p className="text-sm font-bold text-center">该档位暂无记录<br/>快去挑战吧！</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULTS') {
      return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto animate-pop-in py-10 px-4">
            <div className="bg-white w-full rounded-[48px] shadow-2xl p-12 text-center border-b-[16px] border-slate-100">
                <div className="mb-8 inline-flex p-8 bg-yellow-50 rounded-full text-yellow-500 shadow-inner"><Award size={96}/></div>
                <h2 className="text-4xl font-black mb-8">挑战报告</h2>
                <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="bg-rose-50 p-8 rounded-[32px] border-2 border-rose-100 shadow-sm">
                        <p className="text-rose-400 text-sm font-black mb-2 uppercase tracking-widest">最终积分</p>
                        <p className="text-5xl font-black text-rose-600">{score}</p>
                    </div>
                    <div className="bg-blue-50 p-8 rounded-[32px] border-2 border-blue-100 shadow-sm">
                        <p className="text-blue-400 text-sm font-black mb-2 uppercase tracking-widest">闯关总数</p>
                        <p className="text-5xl font-black text-blue-600">{correctCount}</p>
                    </div>
                </div>
                <div className="flex flex-col gap-4">
                    <button onClick={() => { setGameState('PLAYING'); setScore(0); setLives(3); setCorrectCount(0); setStreak(0); setTimeLeft(challengeTime); }} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95"><RotateCcw size={24}/> 再应战！</button>
                    <button onClick={() => setGameState('SELECTING')} className="w-full py-5 text-slate-400 font-bold hover:text-slate-600 transition-colors">返回菜单</button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in pb-10 px-4">
      <div className="w-full flex items-center justify-between mb-6">
        <button onClick={handleGameOver} className="bg-white p-3 rounded-full shadow-lg text-rose-500 hover:scale-110 transition-transform"><ArrowLeft size={28} strokeWidth={3}/></button>
        <div className="flex items-center gap-4">
          <div className="bg-white px-5 py-3 rounded-3xl shadow-md flex items-center gap-6">
              <div className="flex items-center gap-2 text-rose-500">
                <Heart fill="currentColor" size={20} className={lives === 1 ? 'animate-pulse' : ''} />
                <span className="text-xl font-black">{difficulty === 'CHALLENGE' ? lives : '∞'}</span>
              </div>
              <div className="flex items-center gap-2 text-yellow-500">
                <Star fill="currentColor" size={20}/>
                <span className="text-xl font-black">{score}</span>
              </div>
              <div className="flex items-center gap-2 text-blue-500">
                <Hash size={20} strokeWidth={3}/>
                <span className="text-xl font-black">{correctCount}</span>
              </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-white rounded-[48px] shadow-2xl border-b-8 border-rose-100 p-8 md:p-16 min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden text-center">
        {difficulty === 'CHALLENGE' && (
          <div className="absolute top-0 left-0 w-full h-3 bg-slate-50">
            <div 
              className={`h-full transition-all duration-100 linear shadow-[0_0_15px] ${timeLeft < 1 ? 'bg-rose-500 shadow-rose-500 animate-pulse' : 'bg-emerald-500 shadow-emerald-500'}`}
              style={{ width: `${(timeLeft / challengeTime) * 100}%` }}
            ></div>
          </div>
        )}
        <div className="w-full flex flex-col md:flex-row items-center justify-around gap-12 mb-16">
            <div className={`flex-1 w-full max-w-[320px] aspect-square rounded-[48px] flex items-center justify-center text-2xl md:text-4xl font-black shadow-2xl border-4 transition-all duration-300 ${completed ? 'bg-green-50 border-green-200 text-green-600 scale-105 shadow-green-100' : 'bg-slate-50 border-slate-100 text-slate-700'} ${isWrong ? 'bg-red-50 border-red-200 text-red-400 animate-shake' : ''}`}>
                <span className="px-6">{left?.text}</span>
            </div>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black transition-colors ${isWrong ? 'text-red-500' : completed ? 'text-green-500' : 'text-slate-300'}`}>
                {completed ? (left!.value < right!.value ? '<' : Math.abs(left!.value - right!.value) < 0.001 ? '=' : '>') : 'VS'}
            </div>
            <div className={`flex-1 w-full max-w-[320px] aspect-square rounded-[48px] flex items-center justify-center text-2xl md:text-4xl font-black shadow-2xl border-4 transition-all duration-300 ${completed ? 'bg-green-50 border-green-200 text-green-600 scale-105 shadow-green-100' : 'bg-slate-50 border-slate-100 text-slate-700'} ${isWrong ? 'bg-red-50 border-red-200 text-red-400 animate-shake' : ''}`}>
                <span className="px-6">{right?.text}</span>
            </div>
        </div>
        <div className="h-12 mb-12 flex items-center justify-center">
            {message && <div className={`text-3xl font-black animate-bounce ${isWrong ? 'text-rose-500' : 'text-green-500'}`}>{message}</div>}
            {streak > 2 && !message && <div className="text-orange-500 font-black flex items-center gap-2 animate-pulse text-2xl"><Flame size={28}/> {streak} 连胜!</div>}
        </div>
        <div className="flex gap-4 md:gap-8 w-full max-w-2xl">
            <button onClick={() => handleAnswer('>')} disabled={completed || isWrong} className="group flex-1 bg-white border-b-[10px] border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 p-8 rounded-[32px] flex flex-col items-center gap-2 transition-all active:translate-y-2 active:border-b-0 disabled:opacity-50"><ChevronRight size={56} strokeWidth={4} className="group-hover:scale-125 transition-transform"/><span className="font-black text-xl">大于</span></button>
            <button onClick={() => handleAnswer('=')} disabled={completed || isWrong} className="group flex-1 bg-white border-b-[10px] border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 p-8 rounded-[32px] flex flex-col items-center gap-2 transition-all active:translate-y-2 active:border-b-0 disabled:opacity-50"><Equal size={56} strokeWidth={4} className="group-hover:scale-125 transition-transform"/><span className="font-black text-xl">等于</span></button>
            <button onClick={() => handleAnswer('<')} disabled={completed || isWrong} className="group flex-1 bg-white border-b-[10px] border-slate-200 hover:border-rose-400 hover:bg-rose-50 text-slate-600 p-8 rounded-[32px] flex flex-col items-center gap-2 transition-all active:translate-y-2 active:border-b-0 disabled:opacity-50"><ChevronLeft size={56} strokeWidth={4} className="group-hover:scale-125 transition-transform"/><span className="font-black text-xl">小于</span></button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonMode;
