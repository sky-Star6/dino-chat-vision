'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DinosaurInfo, DinosaurMood, ChatMessage, Language } from '@/types/dinosaur';

interface UseVoiceChatProps {
  currentDino: DinosaurInfo;
  language: Language; // 현재 선택된 언어 ('ko' | 'en')
  onRoarTrigger?: () => void;
  onHappyTrigger?: () => void;
}

/**
 * 핸즈프리 음성 인식(VAD), 실시간 마이크 오디오 볼륨 레벨 측정(Web Audio API),
 * 음성 합성(TTS), 실시간 3D 턱 립싱크 및 다국어 지원 커스텀 훅입니다.
 */
export const useVoiceChat = ({
  currentDino,
  language,
  onRoarTrigger,
  onHappyTrigger
}: UseVoiceChatProps) => {
  // 상태 관리
  const [isActive, setIsActive] = useState(false);
  const [mood, setMood] = useState<DinosaurMood>('idle');
  const [audioVolume, setAudioVolume] = useState(0); // 공룡 목소리 볼륨 (3D 립싱크용)
  const [micLevel, setMicLevel] = useState(0); // 0 ~ 100 (사용자 실제 마이크 입력 레벨)
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 레퍼런스 관리 (클로저 및 이벤트 안정화용)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDinoRef = useRef(currentDino);
  const languageRef = useRef(language);
  const latestTranscriptRef = useRef('');
  const lipSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  currentDinoRef.current = currentDino;
  languageRef.current = language;
  isActiveRef.current = isActive;

  // 1. 브라우저 지원 여부 확인
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(
        language === 'ko'
          ? '현재 브라우저가 음성 인식을 지원하지 않습니다. Chrome 또는 Safari 최신 버전을 사용해 주세요.'
          : 'Your browser does not support Speech Recognition. Please use latest Chrome or Safari.'
      );
      return;
    }
  }, [language]);

  /**
   * 언어 또는 공룡 변경 시 새로운 단일 인사말 세팅
   */
  useEffect(() => {
    const greetingText = currentDino.greeting[language];
    setMessages([
      {
        id: `greeting-${currentDino.id}-${language}`,
        sender: 'dino',
        text: greetingText,
        mood: 'happy',
        timestamp: Date.now()
      }
    ]);
  }, [currentDino.id, language]);

  /**
   * 실제 마이크 오디오 입력 스트림 연결 및 실시간 볼륨 레벨(micLevel) 측정
   */
  const startMicAudioMonitoring = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          setErrorMessage(
            languageRef.current === 'ko'
              ? '태블릿/모바일에서는 보안 연결(HTTPS) 환경에서만 마이크가 지원됩니다. PC(localhost)에서 테스트하시거나 Vercel로 배포해 주세요.'
              : 'Microphone on mobile/tablet requires HTTPS. Please test on PC (localhost) or deploy via Vercel.'
          );
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const microphone = audioCtx.createMediaStreamSource(stream);
      microphone.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkMicVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));
        setMicLevel(normalizedLevel);

        if (normalizedLevel > 12 && !isSpeakingRef.current) {
          setMood('listening');
        }

        micAnimFrameRef.current = requestAnimationFrame(checkMicVolume);
      };

      checkMicVolume();
    } catch (err: unknown) {
      console.warn('마이크 오디오 모니터링 시작 실패:', err);
      const error = err as { name?: string };
      if (error?.name === 'NotAllowedError') {
        setErrorMessage(
          languageRef.current === 'ko'
            ? '마이크 권한이 차단되었습니다. 브라우저 주소창 좌측의 설정/자물쇠 아이콘을 눌러 마이크를 허용해 주세요.'
            : 'Microphone access denied. Please allow microphone permissions in your browser address bar.'
        );
      }
    }
  }, []);

  /**
   * 마이크 오디오 모니터링 정지
   */
  const stopMicAudioMonitoring = useCallback(() => {
    if (micAnimFrameRef.current) {
      cancelAnimationFrame(micAnimFrameRef.current);
      micAnimFrameRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setMicLevel(0);
  }, []);

  /**
   * 공룡 목소리 출력(TTS) 및 실시간 3D 턱 립싱크(Lip-sync) 제어
   */
  const speakDinoResponse = useCallback((text: string, responseMood?: DinosaurMood) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/\[(HAPPY|ROAR|TALKING|THINKING|CONFUSED)\]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const currentLang = languageRef.current;
    utterance.lang = currentLang === 'en' ? 'en-US' : 'ko-KR';
    utterance.pitch = currentDinoRef.current.voicePitch;
    utterance.rate = currentDinoRef.current.voiceRate;

    const voices = window.speechSynthesis.getVoices();
    if (currentLang === 'en') {
      const enVoice = voices.find((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;
    } else {
      const koVoice = voices.find((v) => v.lang.includes('ko') || v.lang.includes('KO'));
      if (koVoice) utterance.voice = koVoice;
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setMood(responseMood || 'talking');

      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      lipSyncIntervalRef.current = setInterval(() => {
        const randomVolume = 0.25 + Math.random() * 0.65;
        setAudioVolume(randomVolume);
      }, 90);
    };

    utterance.onend = () => {
      setAudioVolume(0);
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      setMood('idle');
      // 🌟 핵심: 공룡 말이 끝난 뒤 800ms 동안 마이크 입력을 무시하여 스피커 잔향(에코) 방지
      setTimeout(() => {
        isSpeakingRef.current = false;
      }, 800);
    };

    utterance.onerror = () => {
      setAudioVolume(0);
      if (lipSyncIntervalRef.current) clearInterval(lipSyncIntervalRef.current);
      setMood('idle');
      setTimeout(() => {
        isSpeakingRef.current = false;
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  /**
   * Gemini 인공지능 API를 호출하여 공룡 답변 수신
   */
  const requestDinoReply = useCallback(async (userSpeech: string) => {
    if (!userSpeech.trim()) return;

    const currentLang = languageRef.current;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userSpeech,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setTranscript('');
    latestTranscriptRef.current = '';

    setMood('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dinoId: currentDinoRef.current.id,
          language: currentLang,
          message: userSpeech,
          history: messages.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        })
      });

      const data = await response.json();
      const fallbackMsg =
        currentLang === 'en'
          ? `Roar! I didn't catch that clearly. Could you say it again in English?`
          : `크앙! 친구 목소리가 잘 안 들렸어. 다시 한 번 말해줄래?`;

      const replyText = data.reply || fallbackMsg;

      let replyMood: DinosaurMood = 'talking';
      if (replyText.includes('[ROAR]')) {
        replyMood = 'roar';
        onRoarTrigger?.();
      } else if (replyText.includes('[HAPPY]')) {
        replyMood = 'happy';
        onHappyTrigger?.();
      }

      const dinoMsg: ChatMessage = {
        id: `dino-${Date.now()}`,
        sender: 'dino',
        text: replyText.replace(/\[(HAPPY|ROAR|TALKING|THINKING|CONFUSED)\]/g, '').trim(),
        mood: replyMood,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, dinoMsg]);

      speakDinoResponse(replyText, replyMood);
    } catch (error) {
      console.error('Gemini 대화 요청 실패:', error);
      const fallbackReply =
        currentLang === 'en'
          ? `Roar! My internet connection got lost in the dinosaur forest!`
          : `크앙! 공룡 숲속에서 인터넷 연결이 잠시 끊겼어!`;
      speakDinoResponse(fallbackReply, 'idle');
    }
  }, [messages, onHappyTrigger, onRoarTrigger, speakDinoResponse]);

  const requestDinoReplyRef = useRef(requestDinoReply);
  requestDinoReplyRef.current = requestDinoReply;

  /**
   * 🌟 견고한 단일 음성 인식기(SpeechRecognition) 라이프사이클 관리
   */
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    // 언어 설정
    recognition.lang = languageRef.current === 'en' ? 'en-US' : 'ko-KR';

    recognition.onstart = () => {
      isListeningRef.current = true;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      // 🌟 공룡이 말하고 있거나 쿨다운 중일 때는 스피커 소리가 마이크로 들어오는 것을 완전히 차단!
      if (isSpeakingRef.current) {
        return;
      }

      let currentInterim = '';
      let finalSpeech = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalSpeech += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      const combinedText = (finalSpeech || currentInterim).trim();
      if (combinedText) {
        setTranscript(combinedText);
        latestTranscriptRef.current = combinedText;
        setMood('listening');

        // 핸즈프리 1.0초 침묵 타이머
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = latestTranscriptRef.current;
          if (textToSend && isActiveRef.current) {
            requestDinoReplyRef.current(textToSend);
          }
        }, 1000);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        // aborted는 정상적인 중단/재시작 과정일 수 있으므로 무시
        return;
      }
      console.warn('SpeechRecognition 에러:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage(
          languageRef.current === 'en'
            ? 'Microphone permission blocked. Please allow microphone in browser address bar.'
            : '마이크 접근 권한이 차단되었습니다. 브라우저 주소창 좌측 자물쇠/설정을 눌러 마이크를 허용해 주세요.'
        );
        setIsActive(false);
      } else if (event.error === 'audio-capture') {
        setErrorMessage(
          languageRef.current === 'en'
            ? 'No microphone found. Please check your audio input device.'
            : '마이크 장치를 찾을 수 없습니다. 오디오 입력 장치를 확인해 주세요.'
        );
      }
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      // 세션이 아직 활성화되어 있다면 브라우저 타임아웃 종료 후 200ms 뒤 안전하게 재시작
      if (isActiveRef.current) {
        setTimeout(() => {
          if (isActiveRef.current && !isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // 이미 시작 중인 경우 무시
            }
          }
        }, 200);
      }
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // 언어가 변경되었을 때만 인식 언어 속성 동적 갱신
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'en' ? 'en-US' : 'ko-KR';
    }
  }, [language]);

  /**
   * 음성 대화 세션 시작/중지 토글
   */
  const toggleVoiceSession = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isActive) {
      isActiveRef.current = false;
      setIsActive(false);
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      stopMicAudioMonitoring();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setAudioVolume(0);
      setMood('idle');
      setTranscript('');
    } else {
      try {
        setErrorMessage(null);
        isActiveRef.current = true;
        setIsActive(true);
        setMood('idle');

        recognitionRef.current.lang = languageRef.current === 'en' ? 'en-US' : 'ko-KR';
        recognitionRef.current.start();
        startMicAudioMonitoring(); // 실시간 마이크 레벨 모니터링 시작

        speakDinoResponse(currentDinoRef.current.greeting[languageRef.current], 'happy');
      } catch (err) {
        console.warn('음성 인식 시작 오류:', err);
      }
    }
  }, [isActive, speakDinoResponse, startMicAudioMonitoring, stopMicAudioMonitoring]);

  /**
   * 수동 텍스트 전송
   */
  const sendManualMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    requestDinoReply(text);
  }, [requestDinoReply]);

  return {
    isActive,
    mood,
    audioVolume,
    micLevel, // 0 ~ 100
    transcript,
    messages,
    isSupported,
    errorMessage,
    toggleVoiceSession,
    sendManualMessage,
    speakDinoResponse
  };
};
