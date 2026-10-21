'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Mic, MicOff, Sparkles, Send, Volume2, Info, Globe } from 'lucide-react';
import { DinoCanvas } from '@/components/DinoCanvas';
import { DINOSAURS, UI_TEXTS } from '@/data/dinosaurs';
import { DinosaurType, Language, DifficultyLevel } from '@/types/dinosaur';
import { useVoiceChat } from '@/hooks/useVoiceChat';

export default function DinoChatPage() {
  // 현재 선택된 언어 (기본값: 영어 'en')
  const [language, setLanguage] = useState<Language>('en');
  // 대화 난이도 (기본값: 초보자/어린이를 위한 'easy')
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const t = UI_TEXTS[language]; // 현재 언어의 UI 텍스트 맵

  // 현재 선택된 공룡
  const [selectedDinoId, setSelectedDinoId] = useState<DinosaurType>('trex');
  const currentDino = DINOSAURS[selectedDinoId];

  // 수동 텍스트 입력 및 모달 상태
  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 폭죽 파티클 효과 함수 (Happy 모드 또는 공룡 터치 시)
  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // 포효(Roar) 효과
  const triggerRoarEffect = () => {
    confetti({
      particleCount: 90,
      spread: 100,
      colors: ['#ef4444', '#f97316', '#eab308'],
      origin: { y: 0.5 }
    });
  };

  // 핸즈프리 보이스챗 커스텀 훅 연결 (언어 및 난이도 prop 전달)
  const {
    isActive,
    mood,
    audioVolume,
    micLevel,
    transcript,
    messages,
    isSupported,
    errorMessage,
    toggleVoiceSession,
    sendManualMessage
  } = useVoiceChat({
    currentDino,
    language,
    difficulty,
    onHappyTrigger: triggerConfetti,
    onRoarTrigger: triggerRoarEffect
  });

  // 공룡 3D 모델 클릭 시 점프 반응
  const handleModelClick = () => {
    triggerConfetti();
  };

  // 수동 메시지 전송
  const handleSendInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendManualMessage(inputText);
    setInputText('');
  };

  // 최근 공룡 답변과 사용자 질문
  const lastDinoMsg = [...messages].reverse().find((m) => m.sender === 'dino');

  // 감정 배지 라벨 헬퍼
  const getMoodBadgeText = () => {
    if (mood === 'listening') return t.moods.listening;
    if (mood === 'thinking') return t.moods.thinking;
    if (mood === 'talking') return t.moods.talking;
    if (mood === 'happy') return t.moods.happy;
    if (mood === 'roar') return t.moods.roar;
    return isActive ? t.moods.idleActive : t.moods.idleInactive;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-100 flex flex-col justify-between text-slate-800 font-sans selection:bg-amber-200">
      {/* 1. 상단 헤더 및 언어 선택 스위치 */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl animate-bounce">🦖</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                {t.title}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                  3D Live
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 🌟 한국어 / 영어 언어 전환 버튼 */}
            <div className="flex items-center bg-white/90 p-1 rounded-full shadow-sm border border-slate-200 backdrop-blur">
              <button
                onClick={() => setLanguage('ko')}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                  language === 'ko'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="한국어 모드 (한국어로만 대화)"
              >
                <span>🇰🇷</span>
                <span>한국어</span>
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold transition-all ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="English Mode (English conversation only)"
              >
                <span>🇺🇸</span>
                <span>English</span>
              </button>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 text-xs bg-white/80 hover:bg-white text-slate-600 px-3 py-1.5 rounded-full shadow-sm border border-slate-200 backdrop-blur transition"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.historyBtn}</span>
              <span className="sm:hidden">({messages.length})</span>
            </button>
          </div>
        </div>

        {/* 4가지 공룡 선택 캐러셀/탭 (선택 언어에 맞춰 이름과 종족 표시) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-white/70 p-1.5 rounded-2xl shadow-sm border border-white/80 backdrop-blur">
          {Object.values(DINOSAURS).map((dino) => {
            const isSelected = dino.id === selectedDinoId;
            return (
              <button
                key={dino.id}
                onClick={() => setSelectedDinoId(dino.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 px-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-white shadow-md font-bold text-slate-900 scale-102 border border-slate-200'
                    : 'text-slate-600 hover:bg-white/50 opacity-80 hover:opacity-100'
                }`}
              >
                <span className="text-2xl sm:text-xl">{dino.icon}</span>
                <div className="text-center sm:text-left">
                  <div className="text-xs sm:text-sm leading-tight">
                    {dino.name[language].split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 hidden sm:block leading-tight">
                    {dino.species[language]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 🌟 3단계 대화 난이도 선택 바 (초급 / 중급 / 고급) */}
        <div className="mt-2.5 flex items-center justify-between bg-white/75 px-3 py-1.5 rounded-xl border border-white/80 backdrop-blur shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] sm:text-xs">{t.difficulty.label}:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setDifficulty('easy')}
              className={`flex items-center gap-1 text-[11px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                difficulty === 'easy'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.difficulty.easyDesc}
            >
              <span>🟢</span>
              <span>{t.difficulty.easy}</span>
            </button>
            <button
              onClick={() => setDifficulty('normal')}
              className={`flex items-center gap-1 text-[11px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                difficulty === 'normal'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.difficulty.normalDesc}
            >
              <span>🟡</span>
              <span>{t.difficulty.normal}</span>
            </button>
            <button
              onClick={() => setDifficulty('hard')}
              className={`flex items-center gap-1 text-[11px] sm:text-xs px-2.5 py-1 rounded-md font-bold transition-all ${
                difficulty === 'hard'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={t.difficulty.hardDesc}
            >
              <span>🟣</span>
              <span>{t.difficulty.hard}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. 중앙 3D 스테이지 및 공룡 렌더링 영역 */}
      <section className="relative flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center min-h-[360px] sm:min-h-[440px]">
        {/* 공룡 감정 및 상태 배지 */}
        <div className="absolute top-2 left-6 z-10 flex items-center gap-2 bg-white/85 px-3 py-1.5 rounded-full shadow-sm border border-slate-200/80 backdrop-blur">
          <span className="relative flex h-2.5 w-2.5">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isActive ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            ></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {getMoodBadgeText()}
          </span>
        </div>

        {/* 3D 회전 제어 안내 */}
        <div className="absolute top-2 right-6 z-10 text-[11px] text-slate-400 bg-white/70 px-2.5 py-1 rounded-full border border-slate-200/60 backdrop-blur pointer-events-none">
          {t.dragHint}
        </div>

        {/* Three.js 3D 공룡 캔버스 */}
        <div className="w-full h-full max-w-lg aspect-square relative flex items-center justify-center">
          <DinoCanvas
            dinoType={selectedDinoId}
            mood={mood}
            audioVolume={audioVolume}
            onModelClick={handleModelClick}
          />
        </div>

        {/* 실시간 음성 자막 말풍선 */}
        <div className="w-full max-w-xl -mt-4 z-10 space-y-2">
          {/* 사용자의 실시간 음성 텍스트 */}
          {transcript && (
            <div className="bg-emerald-500/90 text-white text-sm px-4 py-2 rounded-2xl rounded-tr-none shadow-md border border-emerald-400/50 backdrop-blur max-w-md ml-auto animate-fade-in">
              <div className="text-[10px] text-emerald-100 font-semibold mb-0.5">
                {t.listeningIndicator}
              </div>
              &quot;{transcript}&quot;
            </div>
          )}

          {/* 공룡의 최근 답변 말풍선 */}
          {lastDinoMsg && (
            <div className="bg-white/95 text-slate-800 text-sm sm:text-base px-5 py-3.5 rounded-3xl rounded-tl-none shadow-lg border border-amber-200/80 backdrop-blur max-w-lg mr-auto relative">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
                <span>{currentDino.icon}</span>
                <span>{currentDino.name[language]}</span>
                {mood === 'talking' && (
                  <span className="flex gap-0.5 items-center ml-2 text-emerald-500 text-[10px]">
                    <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                    {t.talkingIndicator}
                  </span>
                )}
              </div>
              <p className="font-medium leading-relaxed">&quot;{lastDinoMsg.text}&quot;</p>
            </div>
          )}
        </div>
      </section>

      {/* 3. 하단 핸즈프리 컨트롤러 및 입력 바 */}
      <footer className="w-full max-w-2xl mx-auto px-4 pb-6 pt-2">
        {/* 오류 메시지 배너 */}
        {errorMessage && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center">
            {errorMessage}
          </div>
        )}

        {/* 💡 추천 질문 말풍선 칩 (탭하여 질문 바로 시작) */}
        <div className="w-full max-w-xl mx-auto mb-3 px-1 animate-fade-in">
          <div className="text-[11px] text-slate-500 font-semibold mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold text-slate-700">
              <span>💡</span>
              <span>{t.promptHint}</span>
            </span>
            <span className="text-[10px] text-slate-500 bg-white/70 px-2 py-0.5 rounded-full border border-slate-200">
              {difficulty === 'easy'
                ? t.difficulty.easyDesc
                : difficulty === 'normal'
                ? t.difficulty.normalDesc
                : t.difficulty.hardDesc}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {currentDino.suggestedPrompts[difficulty].map((item, idx) => (
              <button
                key={idx}
                onClick={() => sendManualMessage(item[language])}
                className="text-xs sm:text-sm bg-white/95 hover:bg-white active:scale-95 text-slate-700 hover:text-emerald-700 px-3 py-1.5 rounded-full shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow transition-all backdrop-blur flex items-center gap-1.5 cursor-pointer"
                title={language === 'en' ? 'Tap to ask this question!' : '터치하여 이 질문하기!'}
              >
                <span>💬</span>
                <span className="font-medium">{item[language]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 핸즈프리 대화 시작 버튼 */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={toggleVoiceSession}
            disabled={!isSupported}
            className={`relative group flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base sm:text-lg font-bold shadow-xl transition-all transform active:scale-95 ${
              isActive
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white ring-4 ring-rose-200 animate-pulse'
                : language === 'en'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-200 hover:shadow-2xl hover:scale-102'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-200 hover:shadow-2xl hover:scale-102'
            }`}
          >
            {isActive ? (
              <>
                <MicOff className="w-6 h-6" />
                <span>{t.stopBtn}</span>
              </>
            ) : (
              <>
                <Mic className="w-6 h-6 animate-bounce" />
                <span>{t.startBtn}</span>
              </>
            )}
          </button>

          {/* 🌟 실시간 마이크 입력 레벨 게이지 (오디오 감지 시각화) */}
          {isActive && (
            <div className="w-full max-w-xs flex flex-col items-center gap-1.5 animate-fade-in bg-white/70 p-2.5 rounded-2xl border border-slate-200/80 backdrop-blur shadow-sm">
              <div className="flex items-center justify-between w-full text-[11px] text-slate-600 font-medium px-1">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${micLevel > 10 ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
                  {language === 'en' ? 'Mic Input Volume' : '마이크 소리 감지'}
                </span>
                <span className="font-mono text-emerald-600 font-bold">{micLevel}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/50 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(4, micLevel)}%` }}
                />
              </div>
              {micLevel < 5 && (
                <p className="text-[10px] text-amber-600 animate-pulse text-center">
                  {language === 'en'
                    ? '💡 If 0%, please speak closer to your mic or allow mic in browser.'
                    : '💡 소리가 0%라면 마이크 권한 또는 마이크 입력 볼륨을 확인해 주세요.'}
                </p>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 text-center flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {isActive ? t.handsfreeHintActive : t.handsfreeHintInactive}
          </p>
        </div>

        {/* 키보드 수동 입력 폼 */}
        <form onSubmit={handleSendInput} className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${currentDino.name[language]}: ${t.inputPlaceholder}`}
            className="flex-1 bg-white/90 border border-slate-300 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-sm backdrop-blur"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-2xl shadow-sm transition"
            title="메시지 전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* 4. 대화 기록 사이드 모달 */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full p-5 shadow-2xl flex flex-col justify-between animate-slide-left">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <span>{t.historyTitle}</span>
                  <span className="text-xs text-slate-400 font-normal">({messages.length})</span>
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh] pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5">
                      {m.sender === 'user'
                        ? language === 'en' ? '👤 You' : '👤 나'
                        : `${currentDino.icon} ${currentDino.name[language]}`}
                    </span>
                    <div
                      className={`text-xs sm:text-sm px-3.5 py-2 rounded-2xl max-w-[85%] ${
                        m.sender === 'user'
                          ? 'bg-emerald-500 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowHistory(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {t.historyClose}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
