import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Calendar, AlertCircle, CheckCircle2, XCircle, RotateCw } from 'lucide-react';
import { WrongQuestion, AppView } from '../types';
import { getWrongQuestions, removeWrongQuestion, clearWrongQuestions } from '../services/storageService';

interface Props {
  onBack: () => void;
  onRetry: (question: WrongQuestion) => void;
}

const WrongQuestionsView: React.FC<Props> = ({ onBack, onRetry }) => {
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [filter, setFilter] = useState<AppView | 'ALL'>('ALL');

  useEffect(() => {
    setQuestions(getWrongQuestions());
  }, []);

  const handleClear = () => {
    if (window.confirm("确定要清空所有错题记录吗？这可是成长的足迹哦！")) {
      clearWrongQuestions();
      setQuestions([]);
    }
  };

  const handleDelete = (id: string) => {
    removeWrongQuestion(id);
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const filteredQuestions = filter === 'ALL' 
    ? questions 
    : questions.filter(q => q.viewType === filter);

  // Fix: Explicitly type 's' as string because Array.from might return unknown[] depending on TS version/config, resolving line 37 error
  const categories = Array.from(new Set(questions.map(q => JSON.stringify({ type: q.viewType, name: q.categoryName }))))
    .map((s: string) => JSON.parse(s)) as {type: AppView, name: string}[];

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto animate-fade-in pb-12">
      <div className="w-full flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="bg-white p-3 rounded-full shadow-lg hover:bg-red-50 text-red-500 transition-transform hover:scale-110"
        >
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
           <AlertCircle className="text-red-500" size={32} />
           错题本
        </h2>
        <button 
          onClick={handleClear}
          disabled={questions.length === 0}
          className="p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-red-600 transition-all disabled:opacity-30"
          title="清空错题"
        >
          <Trash2 size={24} />
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white p-16 rounded-[40px] shadow-xl text-center w-full border-b-8 border-green-100">
           <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={64} className="text-green-500" />
           </div>
           <h3 className="text-2xl font-bold text-slate-700 mb-2">暂时没有错题哦！</h3>
           <p className="text-slate-400">你真是太厉害了，保持下去！🌟</p>
        </div>
      ) : (
        <div className="w-full space-y-6">
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filter === 'ALL' ? 'bg-red-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
              >
                全部 ({questions.length})
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.type}
                  onClick={() => setFilter(cat.type)}
                  className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${filter === cat.type ? 'bg-red-500 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                >
                  {cat.name}
                </button>
              ))}
           </div>

           <div className="space-y-4">
              {filteredQuestions.map((q) => (
                <div key={q.id} className="bg-white rounded-[32px] p-6 shadow-md border-l-8 border-red-400 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-shadow">
                   <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                         <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-black rounded-full uppercase tracking-wider">
                           {q.categoryName}
                         </span>
                         <div className="flex items-center gap-1 text-slate-300 text-xs font-medium">
                            <Calendar size={12} />
                            {new Date(q.timestamp).toLocaleDateString()}
                         </div>
                      </div>
                      
                      <div className="text-2xl font-bold text-slate-700 mb-4 font-mono">
                         {q.questionDisplay}
                      </div>

                      <div className="flex gap-4">
                         <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-2xl border border-red-100">
                            <XCircle size={18} className="text-red-500" />
                            <span className="text-slate-400 text-sm">你的答案:</span>
                            <span className="text-red-600 font-black">{q.userAnswer}</span>
                         </div>
                         <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
                            <CheckCircle2 size={18} className="text-green-500" />
                            <span className="text-slate-400 text-sm">正确答案:</span>
                            <span className="text-green-600 font-black">{q.correctAnswer}</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2">
                     <button 
                       onClick={() => onRetry(q)}
                       className="p-4 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center group"
                       title="再做一次"
                     >
                       <RotateCw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                       <span className="ml-2 font-bold text-sm">再做一次</span>
                     </button>
                     <button 
                       onClick={() => handleDelete(q.id)}
                       className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-green-50 hover:text-green-500 transition-all flex items-center justify-center"
                       title="掌握了"
                     >
                       <CheckCircle2 size={24} />
                       <span className="ml-2 font-bold text-sm">掌握了</span>
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default WrongQuestionsView;
