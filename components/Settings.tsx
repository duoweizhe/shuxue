
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Server, Key, Cpu, Globe, Activity, AlertTriangle, CheckCircle, Zap, ZapOff } from 'lucide-react';
import { AISettings } from '../types';
import { testOpenAIConnection } from '../services/geminiService';

interface Props {
  onBack: () => void;
}

const Settings: React.FC<Props> = ({ onBack }) => {
  const [settings, setSettings] = useState<AISettings>({
    provider: 'gemini',
    baseUrl: '',
    apiKey: '',
    model: '',
    enableAI: false
  });
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem('math_explorer_settings');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure boolean exists
      if(parsed.enableAI === undefined) parsed.enableAI = false;
      setSettings(parsed);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('math_explorer_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async () => {
    setTestStatus('TESTING');
    setTestMessage("正在连接...");
    
    const result = await testOpenAIConnection(settings);
    
    if (result.success) {
      setTestStatus('SUCCESS');
      setTestMessage("连接成功！");
    } else {
      setTestStatus('ERROR');
      setTestMessage(result.message || "连接失败");
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto animate-fade-in pb-10">
      <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={onBack}
          className="bg-white p-3 rounded-full shadow-lg hover:bg-slate-50 text-slate-500 transition-transform hover:scale-110"
        >
          <ArrowLeft size={28} strokeWidth={3} />
        </button>
        <h2 className="text-3xl font-bold text-slate-700">设置</h2>
        <div className="w-12"></div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-slate-200 w-full">
        
        {/* Main AI Toggle */}
        <div className="mb-8 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
           <div className="flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-bold text-slate-700 flex items-center gap-2">
                     {settings.enableAI ? <Zap className="text-purple-500" fill="currentColor" /> : <ZapOff className="text-slate-400" />}
                     AI 智能辅助生成
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">
                      {settings.enableAI ? "已开启：题目将由 AI 实时生成，无限创意。" : "已关闭：使用本地精选离线题库 (更快速)。"}
                  </p>
              </div>
              <button 
                onClick={() => setSettings({...settings, enableAI: !settings.enableAI})}
                className={`w-16 h-8 rounded-full p-1 transition-all duration-300 ${settings.enableAI ? 'bg-purple-500' : 'bg-slate-300'}`}
              >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${settings.enableAI ? 'translate-x-8' : 'translate-x-0'}`}></div>
              </button>
           </div>
        </div>

        {/* AI Provider Settings - Only show if AI is enabled */}
        {settings.enableAI && (
            <div className="animate-fade-in">
                <div className="mb-8">
                <label className="block text-slate-500 font-bold mb-2 text-lg">AI 提供商</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                    onClick={() => setSettings({ ...settings, provider: 'gemini' })}
                    className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${
                        settings.provider === 'gemini' 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                    >
                    <Globe size={32} />
                    Google Gemini
                    </button>
                    <button
                    onClick={() => setSettings({ ...settings, provider: 'openai' })}
                    className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${
                        settings.provider === 'openai' 
                        ? 'border-green-500 bg-green-50 text-green-600' 
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                    >
                    <Server size={32} />
                    OpenAI / 自建模型
                    </button>
                </div>
                </div>

                {settings.provider === 'openai' && (
                <div className="space-y-6 animate-fade-in mb-8">
                    <div>
                    <label className="flex items-center gap-2 text-slate-600 font-bold mb-2">
                        <Globe size={20} /> 接口地址 (Base URL)
                    </label>
                    <input
                        type="text"
                        value={settings.baseUrl}
                        onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
                        placeholder="例如: http://localhost:11434/v1"
                        className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none font-mono text-slate-600"
                    />
                    <div className="mt-2 p-3 bg-orange-50 text-orange-700 text-sm rounded-lg flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <div>
                        <strong>连接失败常见原因：</strong>
                        <ul className="list-disc ml-4 mt-1 space-y-1">
                            <li>如果使用 Ollama，请确保已设置环境变量 <code>OLLAMA_ORIGINS="*"</code> 并重启服务。</li>
                            <li>浏览器通常禁止 HTTPS 网页访问 HTTP 地址 (Mixed Content)。请尝试使用 Chrome 的 "允许不安全内容" 设置，或使用 https 代理。</li>
                        </ul>
                        </div>
                    </div>
                    </div>

                    <div>
                    <label className="flex items-center gap-2 text-slate-600 font-bold mb-2">
                        <Key size={20} /> API Key
                    </label>
                    <input
                        type="password"
                        value={settings.apiKey}
                        onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none font-mono text-slate-600"
                    />
                    </div>

                    <div>
                    <label className="flex items-center gap-2 text-slate-600 font-bold mb-2">
                        <Cpu size={20} /> 模型名称 (Model Name)
                    </label>
                    <input
                        type="text"
                        value={settings.model}
                        onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                        placeholder="例如: gpt-3.5-turbo, llama3"
                        className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-green-400 outline-none font-mono text-slate-600"
                    />
                    </div>

                    {/* Test Connection Button */}
                    <div>
                    <button
                        onClick={handleTestConnection}
                        disabled={testStatus === 'TESTING'}
                        className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold border-2 border-slate-200 hover:bg-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                        {testStatus === 'TESTING' ? <Activity className="animate-spin" size={20} /> : <Activity size={20} />}
                        测试连接
                    </button>
                    
                    {testStatus === 'ERROR' && (
                        <div className="mt-3 text-red-500 bg-red-50 p-3 rounded-lg text-sm font-bold break-all">
                        错误: {testMessage}
                        </div>
                    )}
                    {testStatus === 'SUCCESS' && (
                        <div className="mt-3 text-green-600 bg-green-50 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                        <CheckCircle size={18} />
                        {testMessage}
                        </div>
                    )}
                    </div>
                </div>
                )}
            </div>
        )}

        <button
          onClick={handleSave}
          className="w-full mt-4 bg-slate-800 text-white py-4 rounded-xl font-bold text-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-all active:scale-95"
        >
          <Save size={24} />
          {saved ? "已保存！" : "保存设置"}
        </button>

      </div>
    </div>
  );
};

export default Settings;
