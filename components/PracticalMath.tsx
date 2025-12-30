
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, Coins } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

type Mode = 'CLOCK' | 'MONEY';

const PracticalMath: React.FC<Props> = ({ onBack }) => {
  const [mode, setMode] = useState<Mode>('CLOCK');
  const [question, setQuestion] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | number | null>(null);

  const generateClock = () => {
    // Generate random time (5 minute intervals for simplicity/Grade 2)
    const h = Math.floor(Math.random() * 12) + 1;
    const m = Math.floor(Math.random() * 12) * 5;
    
    const correctTime = `${h}:${m.toString().padStart(2, '0')}`;
    
    // Distractors
    const opts = new Set<string>();
    opts.add(correctTime);
    
    // Common mistakes: swap hands, off by 5 mins, off by 1 hour
    opts.add(`${m === 0 ? 12 : Math.floor(m/5)}:${(h*5)%60 === 0 ? '00' : ((h*5)%60).toString().padStart(2,'0')}`); // Swapped hands approximation
    opts.add(`${h}:${((m+30)%60).toString().padStart(2,'0')}`);
    opts.add(`${h === 12 ? 1 : h+1}:${m.toString().padStart(2, '0')}`);
    
    // Fill randoms
    while(opts.size < 4) {
        const rh = Math.floor(Math.random() * 12) + 1;
        const rm = Math.floor(Math.random() * 12) * 5;
        opts.add(`${rh}:${rm.toString().padStart(2, '0')}`);
    }

    return {
      type: 'CLOCK',
      h, m,
      answer: correctTime,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    };
  };

  const generateMoney = () => {
    // Simple RMB calculation
    const type = Math.random();
    let qText = "";
    let ans = 0;
    let suffix = "";

    if (type < 0.5) {
       // Sum: 5元 + 5角 = ? 角
       const yuan = Math.floor(Math.random() * 9) + 1;
       const jiao = Math.floor(Math.random() * 9) + 1;
       qText = `${yuan}元 + ${jiao}角 = ( ? ) 角`;
       ans = yuan * 10 + jiao;
       suffix = "角";
    } else {
       // Subtraction: 10元 - 3元 = ? 元
       const start = Math.floor(Math.random() * 20) + 5;
       const cost = Math.floor(Math.random() * 5) + 1;
       qText = `我有${start}元，买铅笔花了${cost}元，还剩多少元？`;
       ans = start - cost;
       suffix = "元";
    }

    const opts = new Set<number>();
    opts.add(ans);
    while(opts.size < 4) {
       const d = ans + Math.floor(Math.random() * 10) - 5;
       if(d > 0 && d !== ans) opts.add(d);
       else opts.add(ans + Math.floor(Math.random()*10)+1);
    }

    return {
      type: 'MONEY',
      text: qText,
      answer: ans,
      suffix,
      options: Array.from(opts).sort(() => Math.random() - 0.5)
    };
  };

  const nextQuestion = useCallback(() => {
    setMessage("");
    setIsCorrect(false);
    setSelectedOption(null);
    if (mode === 'CLOCK') setQuestion(generateClock());
    else setQuestion(generateMoney());
  }, [mode]);

  useEffect(() => {
    nextQuestion();
  }, [nextQuestion]);

  const handleAnswer = (val: string | number) => {
    if (isCorrect) return;
    setSelectedOption(val);
    const isRight = val === question.answer;
    if (isRight) {
      playCorrectSound();
      setMessage("太棒了！回答正确 🎉");
      setIsCorrect(true);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setTimeout(nextQuestion, 1500);
    } else {
      playIncorrectSound();
      setMessage("不对哦，再看仔细一点 👀");
    }
  };

  // Helper to render Clock Hands
  const ClockFace = ({ h, m }: { h: number, m: number }) => {
    // Hour hand moves slightly with minutes
    const hDeg = (h % 12) * 30 + (m / 60) * 30;
    const mDeg = m * 6;

    return (
      <div className="relative w-64 h-64 bg-white rounded-full border-8 border-slate-700 shadow-xl flex items-center justify-center mx-auto my-8">
         {/* Markings */}
         {[...Array(12)].map((_, i) => (
           <div key={i} className="absolute w-1 h-3 bg-slate-300" style={{ transform: `rotate(${i * 30}deg) translateY(-110px)` }} />
         ))}
         {[...Array(4)].map((_, i) => (
           <div key={i} className="absolute w-2 h-6 bg-slate-800" style={{ transform: `rotate(${i * 90}deg) translateY(-105px)` }} />
         ))}

         {/* Hour Hand */}
         <div 
           className="absolute w-2 h-16 bg-slate-800 rounded-full origin-bottom"
           style={{ transform: `rotate(${hDeg}deg) translateY(-50%)`, bottom: '50%' }} 
         />
         {/* Minute Hand */}
         <div 
           className="absolute w-1.5 h-24 bg-blue-500 rounded-full origin-bottom"
           style={{ transform: `rotate(${mDeg}deg) translateY(-50%)`, bottom: '50%' }} 
         />
         {/* Center Dot */}
         <div className="absolute w-4 h-4 bg-pink-500 rounded-full z-10" />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto animate-fade-in">
      <div className="w-full flex items-center justify-between mb-6">
        <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg text-slate-500 hover:scale-110 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        
        <div className="flex bg-white p-1 rounded-full shadow border border-slate-100">
            <button 
              onClick={() => setMode('CLOCK')} 
              className={`px-4 py-2 rounded-full font-bold flex gap-2 items-center ${mode === 'CLOCK' ? 'bg-blue-500 text-white' : 'text-slate-400'}`}
            >
               <Clock size={18} /> 认钟表
            </button>
            <button 
              onClick={() => setMode('MONEY')} 
              className={`px-4 py-2 rounded-full font-bold flex gap-2 items-center ${mode === 'MONEY' ? 'bg-yellow-500 text-white' : 'text-slate-400'}`}
            >
               <Coins size={18} /> 人民币
            </button>
        </div>
      </div>

      <div className="w-full bg-white rounded-3xl shadow-xl border-b-8 border-slate-200 p-6 md:p-10 min-h-[400px] flex flex-col items-center">
         
         <h2 className="text-2xl font-bold text-slate-700 mb-4">
             {mode === 'CLOCK' ? "现在是几点钟？" : "算一算"}
         </h2>

         {question && mode === 'CLOCK' && (
             <ClockFace h={question.h} m={question.m} />
         )}

         {question && mode === 'MONEY' && (
             <div className="my-12 text-center">
                 <div className="bg-yellow-50 p-6 rounded-2xl border-2 border-yellow-100 inline-block">
                     <p className="text-3xl md:text-4xl font-bold text-slate-700 leading-relaxed">
                        {question.text}
                     </p>
                 </div>
             </div>
         )}

         {message && (
             <div className={`text-xl font-bold mb-6 animate-bounce ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                 {message}
             </div>
         )}

         {question && (
             <div className="grid grid-cols-2 gap-4 w-full max-w-lg mt-auto">
                {question.options.map((opt: any, i: number) => {
                   const isSelected = selectedOption === opt;
                   let btnClass = "bg-slate-50 hover:bg-blue-50 border-slate-100 hover:border-blue-200 text-slate-600";
                   
                   if (isCorrect && opt === question.answer) {
                       btnClass = "bg-green-500 text-white border-green-600 scale-105 shadow-lg";
                   } else if (isSelected && !isCorrect) {
                       btnClass = "bg-red-500 text-white border-red-600 animate-shake";
                   }

                   return (
                    <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        disabled={isCorrect}
                        className={`py-4 border-2 rounded-xl text-2xl font-bold transition-all ${btnClass}`}
                    >
                        {opt} {question.suffix || ""}
                    </button>
                   );
                })}
             </div>
         )}
      </div>
    </div>
  );
};

export default PracticalMath;
