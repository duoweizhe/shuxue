
import React, { useState } from 'react';
import { AppView, WrongQuestion } from './types';
import MultiplicationTable from './components/MultiplicationTable';
import QuizMode from './components/QuizMode';
import StoryMode from './components/StoryMode';
import PictureMath from './components/PictureMath';
import UnitConversion from './components/UnitConversion';
import PracticalMath from './components/PracticalMath';
import PatternGame from './components/PatternGame';
import ConceptMode from './components/ConceptMode';
import ComparisonMode from './components/ComparisonMode';
import WrongQuestionsView from './components/WrongQuestionsView';
import Settings from './components/Settings';
import { Calculator, BrainCircuit, BookOpen, GraduationCap, Grid3X3, Scale, Clock, Lightbulb, BookOpenCheck, Settings as SettingsIcon, Diff, NotebookPen } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [retryContext, setRetryContext] = useState<WrongQuestion | null>(null);

  const handleNavigate = (newView: AppView, context: WrongQuestion | null = null) => {
    setRetryContext(context);
    setView(newView);
  };

  const renderView = () => {
    switch (view) {
      case AppView.TABLE:
        return <MultiplicationTable onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.QUIZ:
        return <QuizMode retryData={retryContext || undefined} onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.AI_STORY:
        return <StoryMode onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.PICTURE_MATH:
        return <PictureMath onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.UNIT_CONVERSION:
        return <UnitConversion onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.PRACTICAL:
        return <PracticalMath onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.PATTERNS:
        return <PatternGame onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.CONCEPT:
        return <ConceptMode onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.COMPARISON:
        return <ComparisonMode onBack={() => handleNavigate(AppView.HOME)} />;
      case AppView.WRONG_QUESTIONS:
        return <WrongQuestionsView 
          onRetry={(q) => handleNavigate(q.viewType, q)} 
          onBack={() => handleNavigate(AppView.HOME)} 
        />;
      case AppView.SETTINGS:
        return <Settings onBack={() => handleNavigate(AppView.HOME)} />;
      default:
        return <HomeMenuView onSelect={(v) => handleNavigate(v)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 p-4 md:p-8 selection:bg-pink-200">
      {renderView()}
    </div>
  );
};

const HomeMenuView: React.FC<{ onSelect: (v: AppView) => void }> = ({ onSelect }) => {
  return (
    <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[80vh] animate-fade-in py-10 relative">
      <button 
        onClick={() => onSelect(AppView.SETTINGS)}
        className="absolute top-0 right-0 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-500 hover:rotate-90 transition-all"
        title="AI 设置"
      >
        <SettingsIcon size={24} />
      </button>

      <div className="text-center mb-12 mt-8">
        <div className="inline-flex items-center justify-center bg-white p-4 rounded-3xl shadow-lg mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
          <Calculator size={48} className="text-blue-500 mr-3" />
          <GraduationCap size={48} className="text-purple-500" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-4 tracking-tight">
          小朋友 <span className="text-blue-500">数学探险</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 font-medium">快乐学习，天天进步！</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full px-4">
        <button onClick={() => onSelect(AppView.TABLE)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-emerald-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-emerald-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <BookOpen className="text-emerald-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">背诵乘法表</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">基础九九乘法表</p>
        </button>

        <button onClick={() => onSelect(AppView.QUIZ)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-blue-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-blue-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Calculator className="text-blue-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">口算特训</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">加减、乘除与混合运算</p>
        </button>

        <button onClick={() => onSelect(AppView.CONCEPT)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-pink-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-pink-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <BookOpenCheck className="text-pink-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">概念填空</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">除法意义与术语</p>
        </button>

        <button onClick={() => onSelect(AppView.COMPARISON)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-rose-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-rose-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Diff className="text-rose-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">比大小</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">数感与算式比较</p>
        </button>

        <button onClick={() => onSelect(AppView.WRONG_QUESTIONS)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-red-300 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-red-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <NotebookPen className="text-red-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">我的错题本</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">温故而知新，更上一层楼</p>
        </button>

        <button onClick={() => onSelect(AppView.PICTURE_MATH)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-sky-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-sky-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Grid3X3 className="text-sky-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">看图列式</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">培养数感与观察力</p>
        </button>

        <button onClick={() => onSelect(AppView.PATTERNS)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-teal-200 hover:-translate-y-2 overflow-hidden text-left h-full">
          <div className="absolute top-0 right-0 bg-teal-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Lightbulb className="text-teal-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">找规律</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">逻辑思维大挑战</p>
        </button>

        <button onClick={() => onSelect(AppView.AI_STORY)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-purple-200 hover:-translate-y-2 overflow-hidden text-left h-full">
           <div className="absolute top-0 right-0 bg-purple-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <BrainCircuit className="text-purple-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">趣味应用题</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">解决生活中的数学问题</p>
        </button>

        <button onClick={() => onSelect(AppView.UNIT_CONVERSION)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-orange-200 hover:-translate-y-2 overflow-hidden text-left h-full">
           <div className="absolute top-0 right-0 bg-orange-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Scale className="text-orange-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">单位换算</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">长度与重量的认识</p>
        </button>

        <button onClick={() => onSelect(AppView.PRACTICAL)} className="group relative bg-white p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 border-b-8 border-yellow-200 hover:-translate-y-2 overflow-hidden text-left h-full">
           <div className="absolute top-0 right-0 bg-yellow-100 w-20 h-20 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition-transform"></div>
          <Clock className="text-yellow-500 mb-3 relative z-10" size={36} />
          <h3 className="text-xl font-bold text-slate-800 mb-1 relative z-10">时间与金钱</h3>
          <p className="text-slate-400 text-sm font-medium relative z-10">认钟表，算人民币</p>
        </button>
      </div>

      <footer className="mt-16 text-slate-400 font-medium text-sm text-center">
        为学习数学的同学 ❤️ 精心制作
      </footer>
    </div>
  );
};

export default App;
