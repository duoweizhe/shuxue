
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star, X, Plus, Calculator, AlignVerticalJustifyCenter, AlignJustify, Delete, Check } from 'lucide-react';
import { Question, Difficulty, AppView, WrongQuestion } from '../types';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';
import { saveWrongQuestion, removeWrongQuestion } from '../services/storageService';

interface Props {
  onBack: () => void;
  retryData?: WrongQuestion;
}

const difficultyLabels: Record<Difficulty, string> = {
  [Difficulty.EASY]: "基础",
  [Difficulty.MEDIUM]: "进阶",
  [Difficulty.HARD]: "挑战"
};

type OperationMode = 'ADDSUB' | 'MULTDIV' | 'MIXED';
type VisualMode = 'HORIZONTAL' | 'VERTICAL';

const QuizMode: React.FC<Props> = ({ onBack, retryData }) => {
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [mode, setMode] = useState<OperationMode>('MULTDIV');
  const [visualMode, setVisualMode] = useState<VisualMode>('HORIZONTAL');
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [isWrong, setIsWrong] = useState(false);
  
  // 标记是否正在进行重做
  const [isRetrying, setIsRetrying] = useState<string | null>(retryData?.id || null);

  const [userInput, setUserInput] = useState<string>("");

  useEffect(() => {
    setUserInput("");
    setMessage("");
    setIsWrong(false);
  }, [currentQuestion]);

  const generateQuestion = useCallback(() => {
    // 如果存在重做数据且尚未完成，则加载重做题目
    if (isRetrying && retryData?.rawQuestion) {
      setCurrentQuestion(retryData.rawQuestion as Question);
      return;
    }

    const q: Partial<Question> = { options: [], type: 'SIMPLE' };
    
    if (mode === 'ADDSUB') {
      const isAdd = Math.random() > 0.5;
      q.operator1 = isAdd ? '+' : '-';
      if (isAdd) {
        const target = Math.floor(Math.random() * 99) + 2; 
        const n1 = Math.floor(Math.random() * (target - 1)) + 1;
        const n2 = target - n1;
        q.num1 = n1; q.num2 = n2; q.answer = target;
      } else {
        const n1 = Math.floor(Math.random() * 99) + 2; 
        const n2 = Math.floor(Math.random() * n1);
        q.num1 = n1; q.num2 = n2; q.answer = n1 - n2;
      }
    } 
    else if (mode === 'MULTDIV') {
      const isMult = Math.random() > 0.5;
      q.operator1 = isMult ? '×' : '÷';
      let min = 2, max = 9; 
      if (difficulty === Difficulty.EASY) max = 5;
      if (difficulty === Difficulty.HARD) { min = 3; max = 12; } 
      const n1 = Math.floor(Math.random() * (max - min + 1)) + min;
      const n2 = Math.floor(Math.random() * (max - min + 1)) + min;
      const product = n1 * n2;
      if (isMult) { q.num1 = n1; q.num2 = n2; q.answer = product; } 
      else { q.num1 = product; q.num2 = n1; q.answer = n2; }
    }
    else if (mode === 'MIXED') {
      q.type = 'MIXED';
      const n1 = Math.floor(Math.random() * 8) + 2;
      const n2 = Math.floor(Math.random() * 8) + 2;
      const product = n1 * n2;
      const isAdd = Math.random() > 0.5;
      const n3 = Math.floor(Math.random() * 20) + 1; 
      q.num1 = n1; q.num2 = n2; q.num3 = n3; q.operator1 = '×';
      q.operator2 = isAdd ? '+' : '-';
      if (isAdd) { q.answer = product + n3; } 
      else {
        if (product < n3) { q.operator2 = '+'; q.answer = product + n3; } 
        else { q.answer = product - n3; }
      }
    }

    const ans = q.answer!;
    const opts = new Set<number>();
    opts.add(ans);
    while (opts.size < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const d = ans + offset;
      if (d >= 0 && d !== ans) opts.add(d);
      if (opts.size < 4) opts.add(Math.floor(Math.random() * (ans + 20)) + 1);
    }
    q.options = Array.from(opts).sort(() => Math.random() - 0.5);
    setCurrentQuestion(q as Question);
  }, [difficulty, mode, isRetrying, retryData]);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const handleChoiceAnswer = (val: number) => {
    if (!currentQuestion) return;
    if (val === currentQuestion.answer) {
      handleCorrect();
    } else {
      handleWrong(val);
    }
  };

  const handleKeypadSubmit = () => {
    if (!currentQuestion) return;
    const val = parseInt(userInput);
    if (isNaN(val)) return;
    if (val === currentQuestion.answer) {
      handleCorrect();
    } else {
      handleWrong(val);
      setUserInput(""); 
    }
  };

  const handleCorrect = () => {
    playCorrectSound();
    setScore(s => s + 10);
    setStreak(s => s + 1);
    setMessage(isRetrying ? "克服难关！真棒！🔥" : "回答正确！🎉");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // 如果是重做题目且答对了，将其从错题本中移除
    if (isRetrying) {
      removeWrongQuestion(isRetrying);
      setIsRetrying(null);
    }

    setTimeout(generateQuestion, 1000);
  };

  const handleWrong = (userVal: number) => {
    playIncorrectSound();
    setStreak(0);
    setIsWrong(true);
    setMessage("再试一次！💪");

    if (currentQuestion) {
      const qText = currentQuestion.type === 'MIXED' 
        ? `${currentQuestion.num1} ${currentQuestion.operator1} ${currentQuestion.num2} ${currentQuestion.operator2} ${currentQuestion.num3}`
        : `${currentQuestion.num1} ${currentQuestion.operator1} ${currentQuestion.num2}`;
      
      saveWrongQuestion({
        viewType: AppView.QUIZ,
        categoryName: mode === 'ADDSUB' ? '口算加减' : mode === 'MIXED' ? '混合运算' : '口算乘除',
        questionDisplay: qText,
        correctAnswer: currentQuestion.answer,
        userAnswer: userVal,
        rawQuestion: currentQuestion // 保存完整题目对象以便重做
      });
    }
  };

  const onKeypadPress = (key: string) => {
    if (key === 'DEL') setUserInput(prev => prev.slice(0, -1));
    else if (key === 'OK') handleKeypadSubmit();
    else if (userInput.length < 4) setUserInput(prev => prev + key);
  };

  useEffect(() => {
    if (visualMode !== 'VERTICAL') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); onKeypadPress(e.key); } 
      else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); onKeypadPress('DEL'); } 
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); onKeypadPress('OK'); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visualMode, userInput, currentQuestion]);

  const renderVertical = () => {
    if (!currentQuestion) return null;
    if (currentQuestion.operator1 === '÷') {
      return (
        <div className="flex items-end justify-center font-mono font-bold text-6xl text-slate-700 py-6">
          <div className="pb-2 mr-3">{currentQuestion.num2}</div>
          <div className="flex flex-col items-stretch min-w-[1.5em]">
            <div className="flex items-end justify-end border-b-4 border-slate-700 mb-1 text-blue-600 min-h-[1.2em] px-1 tracking-widest">
               {userInput}<span className="animate-pulse text-slate-300 ml-1 text-4xl mb-2">|</span>
            </div>
            <div className="relative">
               <div className="absolute left-[-14px] top-[-4px] bottom-0 w-6 border-r-4 border-slate-700 rounded-tr-3xl"></div>
               <div className="pl-2 pr-1 text-right tracking-widest">{currentQuestion.num1}</div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-end w-max mx-auto text-5xl md:text-6xl font-mono font-bold text-slate-700">
        <div className="w-full text-right pr-4 tracking-widest">{currentQuestion.num1}</div>
        <div className="flex items-center justify-between w-full border-b-4 border-slate-700 pr-4 pb-2 mt-2">
            <span className="mr-4 text-4xl text-slate-400">{currentQuestion.operator1}</span>
            <span className="tracking-widest">{currentQuestion.num2}</span>
        </div>
        <div className="mt-4 w-full flex justify-end">
           <div className="w-32 h-16 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center justify-center text-blue-600 shadow-inner font-mono text-3xl">
             {userInput}<span className="animate-pulse text-slate-300 ml-1">|</span>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in pb-10">
       <div className="w-full flex flex-col lg:flex-row items-center justify-between mb-6 gap-4">
        <div className="flex items-center w-full lg:w-auto">
          <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg hover:bg-blue-50 text-blue-500 transition-transform hover:scale-110 mr-4">
            <ArrowLeft size={28} strokeWidth={3} />
          </button>
          <h2 className="text-2xl font-bold text-slate-700 hidden lg:block">
             {isRetrying ? "重做挑战" : (mode === 'ADDSUB' ? '加减法特训' : mode === 'MIXED' ? '混合运算' : '乘除法挑战')}
          </h2>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
            {!isRetrying && (
              <div className="flex gap-1 bg-white p-1 rounded-full shadow-sm border border-blue-100">
                {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map((d) => (
                  <button key={d} onClick={() => setDifficulty(Difficulty[d])} className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${difficulty === Difficulty[d] ? 'bg-blue-500 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                    {difficultyLabels[Difficulty[d]]}
                  </button>
                ))}
              </div>
            )}
             <div className="flex gap-1 bg-white p-1 rounded-full shadow-sm border border-purple-100 ml-2">
                <button onClick={() => setVisualMode('HORIZONTAL')} className={`p-2 rounded-full transition-colors ${visualMode === 'HORIZONTAL' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:bg-slate-100'}`} title="横式">
                    <AlignJustify size={18} />
                </button>
                <button onClick={() => { setVisualMode('VERTICAL'); if(mode==='MIXED') setMode('ADDSUB'); }} className={`p-2 rounded-full transition-colors ${visualMode === 'VERTICAL' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:bg-slate-100'}`} title="竖式" disabled={mode === 'MIXED'}>
                    <AlignVerticalJustifyCenter size={18} />
                </button>
            </div>
        </div>
      </div>

      {!isRetrying && (
        <div className="flex bg-white p-1 rounded-xl shadow-md border border-indigo-100 mb-6 w-full lg:w-auto overflow-x-auto">
          <button onClick={() => setMode('ADDSUB')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${mode === 'ADDSUB' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Plus size={16} strokeWidth={3} /> 100以内加减
          </button>
          <button onClick={() => setMode('MULTDIV')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${mode === 'MULTDIV' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
              <X size={16} strokeWidth={3} /> 表内乘除
          </button>
          <button onClick={() => { setMode('MIXED'); setVisualMode('HORIZONTAL'); }} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${mode === 'MIXED' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Calculator size={16} strokeWidth={3} /> 混合运算
          </button>
        </div>
      )}

      <div className="w-full flex justify-between items-center bg-white rounded-2xl p-4 shadow-md border-2 border-indigo-50 mb-6 max-w-2xl">
        <div className="flex items-center gap-2 text-yellow-500">
          <Star fill="currentColor" size={24} />
          <span className="text-2xl font-bold">{score}</span>
        </div>
        <div className="text-slate-400 font-bold">
           连胜: <span className="text-orange-500">{streak} 🔥</span>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border-b-8 border-blue-200 p-8 md:p-10 text-center relative overflow-hidden min-h-[400px] flex flex-col justify-between">
        <div className={`absolute top-0 left-0 w-full h-4 ${isRetrying ? 'bg-blue-400' : (mode === 'ADDSUB' ? 'bg-green-200' : mode === 'MIXED' ? 'bg-purple-200' : 'bg-indigo-200')}`}></div>
        
        <div className="flex-1 flex flex-col justify-center items-center mb-8">
            {isRetrying && (
              <div className="mb-4 px-4 py-1 bg-blue-50 text-blue-500 rounded-full text-xs font-black animate-pulse">
                正在攻克错题...
              </div>
            )}
            {visualMode === 'VERTICAL' ? renderVertical() : (
                <div className="flex justify-center items-center flex-wrap gap-2 md:gap-4 text-4xl md:text-6xl font-bold text-slate-700">
                {currentQuestion && currentQuestion.type === 'SIMPLE' ? (
                    <><span className="text-slate-700">{currentQuestion.num1}</span><span className="text-slate-400">{currentQuestion.operator1}</span><span className="text-slate-700">{currentQuestion.num2}</span></>
                ) : (
                    <><span className="text-slate-700">{currentQuestion?.num1}</span><span className="text-slate-400">{currentQuestion?.operator1}</span><span className="text-slate-700">{currentQuestion?.num2}</span><span className="text-slate-400">{currentQuestion?.operator2}</span><span className="text-slate-700">{currentQuestion?.num3}</span></>
                )}
                <span className="text-slate-400">=</span><span className="text-blue-500">?</span>
                </div>
            )}
        </div>

        <div className="h-8 mb-4">
            {message && <div className={`text-xl font-bold animate-bounce ${isWrong ? 'text-red-500' : 'text-green-500'}`}>{message}</div>}
        </div>

        {visualMode === 'HORIZONTAL' ? (
            <div className="grid grid-cols-2 gap-4">
                {currentQuestion?.options.map((opt, idx) => (
                    <button key={idx} onClick={() => handleChoiceAnswer(opt)} disabled={!!message && !isWrong} className={`py-5 rounded-xl text-2xl md:text-3xl font-bold shadow-md border-b-4 transition-all transform active:scale-95 ${isWrong ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'}`}>{opt}</button>
                ))}
            </div>
        ) : (
            <div className="w-full max-w-xs mx-auto">
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button key={num} onClick={() => onKeypadPress(num.toString())} className="bg-slate-50 border-2 border-slate-200 rounded-lg py-3 text-2xl font-bold text-slate-600 hover:bg-blue-50 active:bg-blue-100">{num}</button>
                    ))}
                    <button onClick={() => onKeypadPress('DEL')} className="bg-red-50 border-2 border-red-200 rounded-lg py-3 text-red-500 font-bold flex items-center justify-center hover:bg-red-100"><Delete size={24} /></button>
                    <button onClick={() => onKeypadPress('0')} className="bg-slate-50 border-2 border-slate-200 rounded-lg py-3 text-2xl font-bold text-slate-600 hover:bg-blue-50">0</button>
                    <button onClick={() => onKeypadPress('OK')} className="bg-green-500 border-b-4 border-green-700 rounded-lg py-3 text-white font-bold flex items-center justify-center hover:bg-green-600 active:translate-y-0.5 active:border-b-0"><Check size={28} strokeWidth={4} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;
