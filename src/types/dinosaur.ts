// 공룡 캐릭터 및 보이스챗 관련 타입 정의 파일

// 지원 언어 타입 (한국어 / 영어)
export type Language = 'ko' | 'en';

// 대화 난이도 타입 (초급 / 중급 / 고급)
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

// 공룡 캐릭터 식별자 타입
export type DinosaurType = 'trex' | 'brachio' | 'tricera' | 'ptera';

// 공룡 감정 및 동작 상태
export type DinosaurMood = 'idle' | 'listening' | 'thinking' | 'talking' | 'happy' | 'roar';

// 다국어 텍스트 인터페이스
export interface LocalizedString {
  ko: string;
  en: string;
}

// 공룡 캐릭터 정보 인터페이스
export interface DinosaurInfo {
  id: DinosaurType;
  name: LocalizedString; // 캐릭터 이름 (예: "티노", "Tino")
  species: LocalizedString; // 공룡 학명/종족 (예: "티라노사우루스", "T-Rex")
  description: LocalizedString; // 성격 소개
  greeting: LocalizedString; // 첫 시작 인사말
  primaryColor: string; // 3D 모델 메인 색상 (Hex)
  secondaryColor: string; // 3D 모델 보조/배 색상 (Hex)
  accentColor: string; // 뿔, 발톱, 볏 등 포인트 색상
  icon: string; // 대표 이모지
  voicePitch: number; // 음성 높낮이 (0.5 ~ 2.0)
  voiceRate: number; // 음성 속도 (0.5 ~ 2.0)
  systemPrompt: LocalizedString; // Gemini 인공지능 프롬프트 (한국어 / 영어)
  suggestedPrompts: Record<DifficultyLevel, LocalizedString[]>; // 난이도별 추천 질문 칩
}

// 대화 메시지 인터페이스
export interface ChatMessage {
  id: string;
  sender: 'user' | 'dino';
  text: string;
  mood?: DinosaurMood;
  timestamp: number;
}
