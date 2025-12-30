
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Star, Heart, Apple, Smile, Hexagon, Cloud, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

const ICONS = [Star, Heart, Apple, Smile, Hexagon, Cloud, Zap];
const COLORS = ['text-yellow-400', 'text-red-400', 'text-green-500', 'text-blue-400', 'text-purple-400', 'text-sky-400', 'text-orange-400'];

const PictureMath: React.FC<Props> = ({ onBack }) => {
  const [groups, setGroups] = useState(2);
  const [perGroup, setPerGroup] = useState(3);
  const [IconComponent, setIconComponent] = useState<any>(Star);
  const [colorClass, setColorClass] = useState('text-yellow-400');
  const [options, setOptions] = useState<string[]>([]);
  const [correctOption, setCorrectOption] = useState<string>("");
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const generateLevel = useCallback(() => {
    // Random 2-5 groups, 2-6 items per group
    const g = Math.floor(Math.random() * 4) + 2;
    const p = Math.floor(Math.random() * 5) + 2;
    const total = g * p;
    
    setGroups(g);
    setPerGroup(p);
    
    // Random icon and color
    const iconIdx = Math.floor(Math.random() * ICONS.length);
    setIconComponent(() => ICONS[iconIdx]);
    setColorClass(COLORS[iconIdx]);

    const correctEq = `${g} × ${p} = ${total}`;
    setCorrectOption(correctEq);

    // Generate distractors
    const dists = new Set<string>();
    dists.add(correctEq);
    
    // Distractor 1: Addition
    dists.add(`${g} + ${p} = ${g+p}`);
    
    // Distractor 2: Swapped wrong math
    dists.add(`${g} × ${p} = ${total + Math.floor(Math.random()*5)+1}`);

    // Distractor 3: Random logic
    const wrongG = g + 1;
    dists.add(`${wrongG} × ${p} = ${wrongG * p}`);

    // Fill if duplicate
    while(dists.size < 4) {
        dists.add(`${Math.floor(Math.random()*5)+2} × ${Math.floor(Math.random()*5)+2} = ${Math.floor(Math.random()*20)+4}`);
    }

    setOptions(Array.from(dists).sort(() => Math.random() - 0.5));
    setCompleted(false);
    setSelectedOption(null);
    setIsWrong(false);
    setFeedback(null);
  }, []);

  useEffect(() => {
    generateLevel();
  }, [generateLevel]);

  const handleSelect = (opt: string) => {
    if (completed) return;
    setSelectedOption(opt);
    if (opt === correctOption) {
        playCorrectSound();
        setCompleted(true);
        setIsWrong(false);
        setFeedback("回答正确！太棒了！🎉");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.7 } });
        setTimeout(generateLevel, 2000);
    } else {
        playIncorrectSound();
        setIsWrong(true);
        setFeedback("不对哦，再数一数！👀");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in">
       <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="bg-white p-3 rounded-full shadow-lg hover:bg-blue-50 text-blue-500 transition-transform hover:scale-110"
        >
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h2 className="text-3xl font-bold text-slate-700">看图列算式</h2>
        <div className="w-12"></div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-b-8 border-emerald-200 w-full mb-8">
         <p className="text-center text-slate-500 text-lg mb-6 font-medium">数一数，选出正确的算式！</p>
         
         <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
            {Array.from({length: groups}).map((_, gIdx) => (
                <div key={gIdx} className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 md:p-4 grid grid-cols-2 or grid-cols-3 gap-2 animate-pop-in" style={{animationDelay: `${gIdx * 100}ms`}}>
                    {Array.from({length: perGroup}).map((_, pIdx) => (
                        <IconComponent key={`${gIdx}-${pIdx}`} size={32} className={`${colorClass} drop-shadow-sm`} strokeWidth={2.5} />
                    ))}
                </div>
            ))}
         </div>

         {feedback && (
            <div className={`text-center text-xl font-bold mb-6 animate-bounce ${completed ? 'text-green-500' : 'text-red-500'}`}>
                {feedback}
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                let btnClass = "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md";
                
                if (completed && opt === correctOption) {
                    btnClass = "bg-green-500 text-white border-green-600 scale-105 shadow-lg";
                } else if (isSelected && isWrong) {
                    btnClass = "bg-red-500 text-white border-red-600 animate-shake shadow-lg";
                } else if (completed && opt !== correctOption) {
                    btnClass = "bg-slate-100 text-slate-300 border-slate-100";
                }

                return (
                    <button
                        key={i}
                        onClick={() => handleSelect(opt)}
                        disabled={completed}
                        className={`
                            py-4 rounded-xl text-2xl md:text-3xl font-bold border-2 transition-all
                            ${btnClass}
                        `}
                    >
                        {opt}
                    </button>
                );
            })}
         </div>
      </div>
    </div>
  );
};

export default PictureMath;
