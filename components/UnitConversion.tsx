
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Scale, Timer, Ruler, Coins } from 'lucide-react';
import { UnitProblem } from '../types';
import { generateUnitProblem, getEncouragement } from '../services/geminiService';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

const UnitConversion: React.FC<Props> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [problem, setProblem] = useState<UnitProblem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isWrong, setIsWrong] = useState(false);

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    setCompleted(false);
    setProblem(null);
    setSelectedOption(null);
    setIsWrong(false);
    
    const data = await generateUnitProblem();
    setProblem(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProblem();
  }, [loadProblem]);

  const handleOptionClick = async (selected: number) => {
    if (!problem || completed) return;

    setSelectedOption(selected);

    if (Math.abs(selected - problem.answer) < 0.0001) {
      playCorrectSound();
      setCompleted(true);
      setIsWrong(false);
      confetti({ particleCount: 100, spread: 80 });
      const msg = await getEncouragement(true);
      setFeedback(msg);
    } else {
      playIncorrectSound();
      setIsWrong(true);
      const msg = await getEncouragement(false);
      setFeedback(msg);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto animate-fade-in">
      <div className="w-full flex items-center justify-between mb-6">
        <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg text-orange-500 hover:scale-110 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
         <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
            <Scale size={24} />
            <span className="font-bold">单位换算挑战</span>
         </div>
      </div>

      {/* Main Card */}
      <div className="w-full bg-white rounded-3xl shadow-2xl border-4 border-orange-100 overflow-hidden min-h-[400px] flex flex-col relative">
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-20">
            <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-4"></div>
            <p className="text-orange-500 font-bold text-lg animate-pulse">正在生成题目...</p>
          </div>
        )}

        {!loading && problem && (
          <div className="p-6 md:p-10 flex-1 flex flex-col">
            
            {/* Scenario Graphic Area */}
            <div className="w-full flex justify-center mb-6">
                 <div className={`p-4 rounded-full transition-all duration-300 ${isWrong ? 'bg-red-100 animate-shake' : 'bg-orange-50'}`}>
                     {problem.unit.includes('米') || problem.unit.includes('m') ? <Ruler size={48} className={isWrong ? "text-red-400" : "text-orange-400"} /> : 
                      problem.unit.includes('克') || problem.unit.includes('g') ? <Scale size={48} className={isWrong ? "text-red-400" : "text-orange-400"} /> :
                      problem.unit.includes('分') || problem.unit.includes('秒') ? <Timer size={48} className={isWrong ? "text-red-400" : "text-orange-400"} /> :
                      <Coins size={48} className={isWrong ? "text-red-400" : "text-orange-400"} /> }
                 </div>
            </div>

            <div className="text-center mb-8">
                <p className="text-xl text-slate-500 mb-2 font-medium">{problem.scenario}</p>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800">{problem.question}</h3>
            </div>

            {feedback && (
                <div className={`text-center text-xl font-bold mb-6 p-3 rounded-xl animate-fade-in ${completed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {feedback}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
              {problem.options.map((opt, i) => {
                const isSelected = selectedOption === opt;
                const isCorrect = completed && Math.abs(opt - problem.answer) < 0.001;
                
                let btnClass = "bg-slate-50 text-slate-600 border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600";
                if (isCorrect) {
                    btnClass = "bg-green-500 text-white border-green-700 scale-105 shadow-lg";
                } else if (isSelected && isWrong) {
                    btnClass = "bg-red-500 text-white border-red-700 animate-shake shadow-lg";
                }

                return (
                    <button
                    key={i}
                    onClick={() => handleOptionClick(opt)}
                    disabled={completed}
                    className={`
                        py-4 px-6 rounded-xl text-xl font-bold border-b-4 transition-all flex justify-between items-center
                        ${btnClass}
                    `}
                    >
                    <span>{opt}</span>
                    <span className={`text-sm ml-2 ${isCorrect || (isSelected && isWrong) ? 'text-white opacity-90' : 'opacity-60'}`}>{problem.unit}</span>
                    </button>
                );
              })}
            </div>

            {completed && (
                <button 
                    onClick={loadProblem}
                    className="mt-6 w-full py-4 bg-orange-500 text-white text-xl font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors animate-fade-in"
                >
                    下一题 →
                </button>
            )}
          </div>
        )}

        {!loading && !problem && (
            <div className="flex flex-col items-center justify-center h-full p-10">
                <p className="text-slate-400 mb-4">生成失败，请重试。</p>
                <button onClick={loadProblem} className="text-orange-500 underline">重试</button>
            </div>
        )}
      </div>
    </div>
  );
};

export default UnitConversion;
