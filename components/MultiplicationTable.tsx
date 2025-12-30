import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const MultiplicationTable: React.FC<Props> = ({ onBack }) => {
  const [highlighted, setHighlighted] = useState<{r: number, c: number} | null>(null);
  const numbers = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in">
      <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="bg-white p-3 rounded-full shadow-lg hover:bg-blue-50 text-blue-500 transition-transform hover:scale-110"
        >
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h2 className="text-3xl md:text-4xl font-bold text-blue-600">九九乘法表</h2>
        <div className="w-12"></div> {/* Spacer for centering */}
      </div>

      <div className="bg-white p-4 md:p-8 rounded-3xl shadow-xl border-4 border-blue-100 overflow-x-auto max-w-full">
        <div className="inline-block min-w-max">
          {/* Header Row */}
          <div className="flex mb-2">
            <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-bold text-slate-400">
              ×
            </div>
            {numbers.map(n => (
              <div key={`head-${n}`} className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-bold text-xl md:text-2xl text-blue-600 m-1 bg-blue-50 rounded-lg">
                {n}
              </div>
            ))}
          </div>

          {/* Rows */}
          {numbers.map(row => (
            <div key={`row-${row}`} className="flex mb-2">
              {/* Row Header */}
              <div className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center font-bold text-xl md:text-2xl text-pink-500 m-1 bg-pink-50 rounded-lg">
                {row}
              </div>
              
              {/* Cells */}
              {numbers.map(col => {
                const isHighlighted = highlighted?.r === row || highlighted?.c === col;
                const isSelected = highlighted?.r === row && highlighted?.c === col;
                
                let bgClass = "bg-slate-50";
                if (isSelected) bgClass = "bg-yellow-300 scale-110 shadow-lg z-10 ring-4 ring-yellow-200";
                else if (isHighlighted) bgClass = "bg-blue-50";

                return (
                  <button
                    key={`${row}-${col}`}
                    onMouseEnter={() => setHighlighted({ r: row, c: col })}
                    onMouseLeave={() => setHighlighted(null)}
                    className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center text-lg md:text-xl font-bold rounded-xl m-1 transition-all duration-200 ${bgClass} text-slate-700`}
                  >
                    {row * col}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Interaction Display */}
      <div className="mt-8 h-24 flex items-center justify-center w-full">
        {highlighted ? (
          <div className="bg-white border-4 border-yellow-300 px-8 py-4 rounded-full shadow-xl animate-bounce-short">
            <span className="text-4xl md:text-5xl font-bold text-pink-500">{highlighted.r}</span>
            <span className="text-3xl md:text-4xl font-bold text-slate-400 mx-3">×</span>
            <span className="text-4xl md:text-5xl font-bold text-blue-500">{highlighted.c}</span>
            <span className="text-3xl md:text-4xl font-bold text-slate-400 mx-3">=</span>
            <span className="text-5xl md:text-6xl font-bold text-purple-600">{highlighted.r * highlighted.c}</span>
          </div>
        ) : (
          <p className="text-xl text-slate-400 font-medium">点击或移动到数字上查看结果！</p>
        )}
      </div>
    </div>
  );
};

export default MultiplicationTable;