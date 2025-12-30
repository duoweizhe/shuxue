
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BookOpenCheck, Plus, Minus, X, Divide } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCorrectSound, playIncorrectSound } from '../services/audioService';

interface Props {
  onBack: () => void;
}

interface ConceptQuestion {
  template: string;     // The text with a placeholder like "( ? )"
  correct: string | number;
  options: (string | number)[];
  hint: string;
  type: 'ADD' | 'SUB' | 'MULT' | 'DIV';
}

const ConceptMode: React.FC<Props> = ({ onBack }) => {
  const [question, setQuestion] = useState<ConceptQuestion | null>(null);
  const [selected, setSelected] = useState<string | number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const generateQuestion = useCallback(() => {
    const ops = ['ADD', 'SUB', 'MULT', 'DIV'];
    // Give slightly more weight to DIV as it has more complex concepts, or keep equal
    const op = ops[Math.floor(Math.random() * ops.length)] as 'ADD' | 'SUB' | 'MULT' | 'DIV';

    let q: ConceptQuestion = {
      template: '',
      correct: '',
      options: [],
      hint: '',
      type: op
    };

    if (op === 'ADD') {
        // Addition: a + b = c
        const a = Math.floor(Math.random() * 50) + 1;
        const b = Math.floor(Math.random() * 50) + 1;
        const c = a + b;
        const eq = `${a} + ${b} = ${c}`;
        
        const subTypes = ['READ', 'TERM_A', 'TERM_B', 'TERM_C'];
        const subType = subTypes[Math.floor(Math.random() * subTypes.length)];

        if (subType === 'READ') {
            q.template = `${eq} 读作：( ? )`;
            q.correct = `${a}加${b}等于${c}`;
            q.options = [
                `${a}加${b}等于${c}`,
                `${a}和${b}等于${c}`,
                `${b}加${a}等于${c}`, // technically correct sum but reading order matters
                `${a}加${c}等于${b}`
            ];
            q.hint = "按从左到右的顺序读哦。";
        } else if (subType === 'TERM_A' || subType === 'TERM_B') {
            const target = subType === 'TERM_A' ? a : b;
            q.template = `在 ${eq} 中，${target} 是 ( ? )。`;
            q.correct = "加数";
            q.options = ["加数", "和", "被减数", "差"];
            q.hint = "加号两边的数都叫什么？";
        } else { // TERM_C
            q.template = `在 ${eq} 中，${c} 是 ( ? )。`;
            q.correct = "和";
            q.options = ["加数", "和", "积", "差"];
            q.hint = "加法算出来的结果叫什么？";
        }

    } else if (op === 'SUB') {
        // Subtraction: a - b = c
        const a = Math.floor(Math.random() * 80) + 20;
        const b = Math.floor(Math.random() * (a - 10)) + 5;
        const c = a - b;
        const eq = `${a} - ${b} = ${c}`;

        const subTypes = ['READ', 'TERM_A', 'TERM_B', 'TERM_C'];
        const subType = subTypes[Math.floor(Math.random() * subTypes.length)];

        if (subType === 'READ') {
            q.template = `${eq} 读作：( ? )`;
            q.correct = `${a}减${b}等于${c}`;
            q.options = [
                `${a}减${b}等于${c}`,
                `${b}减${a}等于${c}`,
                `${a}减去${c}等于${b}`,
                `${a}加${b}等于${c}`
            ];
            q.hint = "从左往右读，注意符号。";
        } else if (subType === 'TERM_A') {
            q.template = `在 ${eq} 中，${a} 是 ( ? )。`;
            q.correct = "被减数";
            q.options = ["被减数", "减数", "差", "和"];
            q.hint = "减号前面的数，表示原来的总数。";
        } else if (subType === 'TERM_B') {
            q.template = `在 ${eq} 中，${b} 是 ( ? )。`;
            q.correct = "减数";
            q.options = ["减数", "被减数", "差", "加数"];
            q.hint = "减号后面的数，表示去掉的部分。";
        } else { // TERM_C
            q.template = `在 ${eq} 中，${c} 是 ( ? )。`;
            q.correct = "差";
            q.options = ["差", "减数", "被减数", "和"];
            q.hint = "减法算出来的结果叫什么？";
        }

    } else if (op === 'MULT') {
        // Multiplication: a x b = c
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        const c = a * b;
        const eq = `${a} × ${b} = ${c}`;

        const subTypes = ['READ', 'TERM_A', 'TERM_B', 'TERM_C', 'MEANING'];
        const subType = subTypes[Math.floor(Math.random() * subTypes.length)];

        if (subType === 'READ') {
            q.template = `${eq} 读作：( ? )`;
            q.correct = `${a}乘${b}等于${c}`;
            q.options = [
                `${a}乘${b}等于${c}`,
                `${a}乘以${b}等于${c}`, // Distinction usually made in rigorous settings
                `${b}乘${a}等于${c}`,
                `${a}加${b}等于${c}`
            ];
            q.hint = "现在通常读作'乘'。";
        } else if (subType === 'TERM_A' || subType === 'TERM_B') {
            const target = subType === 'TERM_A' ? a : b;
            q.template = `在 ${eq} 中，${target} 是 ( ? )。`;
            q.correct = "乘数";
            q.options = ["乘数", "积", "加数", "被除数"];
            q.hint = "乘号两边的数叫什么？";
        } else if (subType === 'TERM_C') {
            q.template = `在 ${eq} 中，${c} 是 ( ? )。`;
            q.correct = "积";
            q.options = ["积", "乘数", "和", "商"];
            q.hint = "乘法算出来的结果叫什么？";
        } else { // MEANING
            q.template = `${a} × ${b} 表示 ( ? )。`;
            q.correct = `${a}个${b}相加`; // Or b个a, but let's simplify options
            
            // Need to be careful not to have both correct interpretations as distinct options
            // Generate clearly wrong options
            q.options = [
                `${a}个${b}相加`,
                `${a}个${b}相乘`,
                `${a}加${b}`,
                `${a}减${b}`
            ];
            q.hint = "乘法是求几个相同加数的和的简便运算。";
        }

    } else {
        // Division: a / b = c
        const b = Math.floor(Math.random() * 8) + 2;
        const c = Math.floor(Math.random() * 8) + 2;
        const a = b * c;
        const eq = `${a} ÷ ${b} = ${c}`;

        const subTypes = [
            'READ',
            'MEANING_SHARE_TOTAL', 'MEANING_SHARE_PARTS', 'MEANING_SHARE_RESULT',
            'MEANING_GROUP_TOTAL', 'MEANING_GROUP_SIZE', 'MEANING_GROUP_COUNT',
            'TERM_A', 'TERM_B', 'TERM_C'
        ];
        const subType = subTypes[Math.floor(Math.random() * subTypes.length)];

        if (subType === 'READ') {
            q.template = `${eq} 读作：( ? )`;
            q.correct = `${a}除以${b}等于${c}`;
            q.options = [
                `${a}除${b}等于${c}`,
                `${b}除以${a}等于${c}`,
                `${a}除以${b}等于${c}`,
                `${a}减${b}等于${c}`
            ];
            q.hint = "注意是'除'还是'除以'哦！";
        } else if (subType === 'MEANING_SHARE_TOTAL') {
            q.template = `${eq} 表示把 ( ? ) 平均分成 ${b} 份，每份是 ${c}。`;
            q.correct = a;
            q.options = [a, b, c, a + b];
            q.hint = "把什么总数分一分？";
        } else if (subType === 'MEANING_SHARE_PARTS') {
            q.template = `${eq} 表示把 ${a} 平均分成 ( ? ) 份，每份是 ${c}。`;
            q.correct = b;
            q.options = [a, b, c, b + 1];
            q.hint = "分成了几份？看除数。";
        } else if (subType === 'MEANING_SHARE_RESULT') {
            q.template = `${eq} 表示把 ${a} 平均分成 ${b} 份，每份是 ( ? )。`;
            q.correct = c;
            q.options = [a, b, c, 1];
            q.hint = "每份是多少？看商。";
        } else if (subType === 'MEANING_GROUP_TOTAL') {
            q.template = `${eq} 也可以表示 ( ? ) 里面有 ${c} 个 ${b}。`;
            q.correct = a;
            q.options = [a, b, c, 100];
            q.hint = "哪个数里包含着别的数？";
        } else if (subType === 'MEANING_GROUP_COUNT') {
            q.template = `${eq} 也可以表示 ${a} 里面有 ( ? ) 个 ${b}。`;
            q.correct = c;
            q.options = [a, b, c, a - b];
            q.hint = "有多少个？看商。";
        } else if (subType === 'MEANING_GROUP_SIZE') {
            q.template = `${eq} 也可以表示 ${a} 里面有 ${c} 个 ( ? )。`;
            q.correct = b;
            q.options = [a, b, c, 1];
            q.hint = "有几个几？";
        } else if (subType === 'TERM_A') {
            q.template = `在 ${eq} 中，被除数是 ( ? )。`;
            q.correct = a;
            q.options = [a, b, c, 0];
            q.hint = "被分的那个大数叫什么？";
        } else if (subType === 'TERM_B') {
            q.template = `在 ${eq} 中，除数是 ( ? )。`;
            q.correct = b;
            q.options = [a, b, c, 1];
            q.hint = "除号后面的数叫什么？";
        } else { // TERM_C
            q.template = `在 ${eq} 中，商是 ( ? )。`;
            q.correct = c;
            q.options = [a, b, c, a + b];
            q.hint = "算出来的结果叫什么？";
        }
    }

    // Clean options
    const uniqueOptions = Array.from(new Set(q.options));
    // Fill if needed (mostly for number answers)
    if (typeof q.correct === 'number') {
        while (uniqueOptions.length < 4) {
            const r = Math.floor(Math.random() * 20) + 1;
            if (!uniqueOptions.includes(r)) uniqueOptions.push(r);
        }
    }
    
    q.options = uniqueOptions.sort(() => Math.random() - 0.5);
    setQuestion(q);
    setSelected(null);
    setIsCorrect(null);
  }, []);

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  const handleSelect = (opt: string | number) => {
    if (isCorrect === true) return;
    
    setSelected(opt);
    if (opt === question?.correct) {
      playCorrectSound();
      setIsCorrect(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      playIncorrectSound();
      setIsCorrect(false);
    }
  };

  const next = () => {
    generateQuestion();
  };

  if (!question) return <div>Loading...</div>;

  const parts = question.template.split('( ? )');
  
  const getThemeColor = () => {
      switch(question.type) {
          case 'ADD': return 'text-green-600 bg-green-50 border-green-200';
          case 'SUB': return 'text-blue-600 bg-blue-50 border-blue-200';
          case 'MULT': return 'text-purple-600 bg-purple-50 border-purple-200';
          case 'DIV': return 'text-pink-600 bg-pink-50 border-pink-200';
          default: return 'text-slate-600 bg-slate-50 border-slate-200';
      }
  };

  const getIcon = () => {
      switch(question.type) {
          case 'ADD': return <Plus size={24} />;
          case 'SUB': return <Minus size={24} />;
          case 'MULT': return <X size={24} />;
          case 'DIV': return <Divide size={24} />;
          default: return <BookOpenCheck size={24} />;
      }
  };

  const getTitle = () => {
      switch(question.type) {
          case 'ADD': return '加法概念';
          case 'SUB': return '减法概念';
          case 'MULT': return '乘法概念';
          case 'DIV': return '除法概念';
          default: return '数学概念';
      }
  };

  const themeClass = getThemeColor();
  // Extract base color name for button logic
  const baseColor = question.type === 'ADD' ? 'green' : 
                    question.type === 'SUB' ? 'blue' : 
                    question.type === 'MULT' ? 'purple' : 'pink';

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto animate-fade-in">
      <div className="w-full flex items-center justify-between mb-8">
        <button onClick={onBack} className="bg-white p-3 rounded-full shadow-lg text-slate-500 hover:scale-110 transition-transform">
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
         <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-sm transition-colors duration-500 ${themeClass}`}>
            {getIcon()}
            <span>{getTitle()}</span>
         </div>
      </div>

      <div className={`w-full bg-white rounded-3xl shadow-2xl border-b-8 p-6 md:p-10 min-h-[400px] flex flex-col justify-between transition-colors duration-500 border-${baseColor}-200`}>
        
        <div className="flex-1 flex flex-col items-center justify-center mb-8">
            <div className="text-2xl md:text-3xl font-bold text-slate-700 leading-loose text-center">
              {parts[0]}
              <span className={`
                inline-flex items-center justify-center min-w-[80px] px-4 py-1 mx-2 rounded-lg border-b-4 transition-all
                ${isCorrect === true ? 'bg-green-100 text-green-600 border-green-300 scale-110' : 
                  isCorrect === false ? 'bg-red-50 text-red-500 border-red-200' : 
                  `bg-${baseColor}-50 text-${baseColor}-600 border-${baseColor}-200 animate-pulse`}
              `}>
                {isCorrect === true ? question.correct : '?'}
              </span>
              {parts[1]}
            </div>
            
            <div className="h-16 mt-6 flex items-center justify-center">
              {isCorrect === true && (
                <div className="text-green-500 font-bold text-xl flex items-center gap-2 animate-bounce">
                  <span>回答正确！</span> 
                </div>
              )}
              {isCorrect === false && (
                <div className="text-orange-500 font-bold text-lg text-center px-4">
                  {question.hint}
                </div>
              )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {question.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              disabled={isCorrect === true}
              className={`
                py-4 px-6 rounded-xl text-lg md:text-xl font-bold border-2 transition-all
                ${isCorrect === true && opt === question.correct 
                  ? 'bg-green-500 text-white border-green-600' 
                  : selected === opt && isCorrect === false
                    ? 'bg-red-50 text-red-500 border-red-200'
                    : `bg-white text-slate-600 border-slate-200 hover:border-${baseColor}-300 hover:bg-${baseColor}-50`
                }
              `}
            >
              {opt}
            </button>
          ))}
        </div>

        {isCorrect === true && (
          <button 
            onClick={next}
            className={`mt-6 w-full py-4 text-white text-xl font-bold rounded-xl shadow-lg transition-colors animate-fade-in bg-${baseColor}-500 hover:bg-${baseColor}-600`}
          >
            下一题 →
          </button>
        )}
      </div>
    </div>
  );
}

export default ConceptMode;
