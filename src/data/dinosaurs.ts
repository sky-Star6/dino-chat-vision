// 공룡 캐릭터 및 다국어 사전 데이터 정의 파일
import { DinosaurInfo, DinosaurType, Language } from '@/types/dinosaur';

/**
 * 선택 가능한 4마리의 귀여운 공룡 캐릭터 메타데이터 목록입니다.
 * 한국어와 영어 버전을 완벽하게 분리하여 지원합니다.
 */
export const DINOSAURS: Record<DinosaurType, DinosaurInfo> = {
  trex: {
    id: 'trex',
    name: {
      ko: '티노 (Tino)',
      en: 'Tino'
    },
    species: {
      ko: '티라노사우루스',
      en: 'T-Rex'
    },
    description: {
      ko: '용감하고 씩씩하지만 친구들을 너무 좋아하는 아기 티라노사우루스예요!',
      en: 'A brave and cheerful baby T-Rex who loves making new friends!'
    },
    greeting: {
      ko: '안녕 친구야! 나는 용감한 티노야! 오늘 어떤 신나는 이야기를 해볼까?',
      en: "Hello friend! I am brave little Tino! What fun story should we talk about today?"
    },
    primaryColor: '#4ade80', // 라임 그린
    secondaryColor: '#fef08a', // 노란 배
    accentColor: '#ffffff', // 하얀 이빨
    icon: '🦖',
    voicePitch: 0.65, // 굵고 묵직한 아기 맹수 저음 톤
    voiceRate: 0.9,
    systemPrompt: {
      ko: `당신은 씩씩하고 다정한 아기 티라노사우루스 '티노'입니다.
- 언어: 반드시 **한국어로만** 대답하세요.
- 말투: 억지스러운 의성어나 동물 소리 글자(크르릉, 어흥 등)는 쓰지 말고, 친구와 편하게 이야기하듯이 씩씩하고 자연스럽게 대답하세요.
- 답변 맨 앞에는 감정 태그 중 하나를 반드시 포함해주세요: [HAPPY], [ROAR], [TALKING], [THINKING].
- 1~3문장 내외로 간결하고 밝게 대답하세요.`,
      en: `You are a friendly, brave baby T-Rex named 'Tino'.
- Language Rule: You MUST respond **ONLY in English**. Never use Korean.
- Speech tone: Speak naturally and warmly like a friendly dinosaur buddy. Do not write awkward animal noise spellings.
- Tag requirement: Always start your response with exactly ONE emotion tag: [HAPPY], [ROAR], [TALKING], or [THINKING].
  Example: "[HAPPY] Hello friend! That sounds like an awesome adventure! What should we do next?"
- Keep your answers short (1-3 sentences) and conversational.`
    },
    suggestedPrompts: {
      easy: [
        { ko: '안녕! 나랑 친구할래?', en: 'Hi! Can we be friends?' },
        { ko: '너는 고기가 좋아, 풀이 좋아?', en: 'Do you like meat or plants?' },
        { ko: '나랑 같이 달리기 시합할래?', en: 'Do you want to run with me?' }
      ],
      normal: [
        { ko: '티노야, 달리기 얼마나 빨라?', en: 'Tino, how fast can you run?' },
        { ko: '앞발이 작은 이유는 뭐야?', en: 'Why are your arms so short?' },
        { ko: '오늘 숲에서 뭐 하고 놀았어?', en: 'What did you play in the forest today?' }
      ],
      hard: [
        { ko: '백악기 최상위 포식자의 사냥 전략은 어땠어?', en: 'What was your hunting strategy in the Cretaceous?' },
        { ko: '티라노사우루스의 턱 힘은 얼마나 강했니?', en: 'How powerful was the T-Rex bite force?' },
        { ko: '몸에 깃털이 실제로 있었는지 궁금해!', en: 'Did T-Rex really have feathers?' }
      ]
    }
  },
  brachio: {
    id: 'brachio',
    name: {
      ko: '브라키 (Brachy)',
      en: 'Brachy'
    },
    species: {
      ko: '브라키오사우루스',
      en: 'Brachiosaurus'
    },
    description: {
      ko: '목이 길어서 높은 나무의 나뭇잎을 잘 먹는 온화하고 지혜로운 친구예요.',
      en: 'A gentle, wise long-necked dino who loves sweet green leaves from tall trees.'
    },
    greeting: {
      ko: '안녕 친구야~ 숲속 친구 브라키야. 네 목소리를 들으니 참 반갑다!',
      en: "Hello friend~ I'm Brachy from the green forest. Hearing your voice makes me so happy!"
    },
    primaryColor: '#38bdf8', // 하늘색
    secondaryColor: '#e0f2fe',
    accentColor: '#0284c7',
    icon: '🦕',
    voicePitch: 0.5, // 코끼리나 거대 초식동물처럼 아주 깊고 묵직한 동굴 저음
    voiceRate: 0.8,
    systemPrompt: {
      ko: `당신은 긴 목을 가진 온순하고 차분한 아기 브라키오사우루스 '브라키'입니다.
- 언어: 반드시 **한국어로만** 대답하세요.
- 말투: 억지스러운 동물 소리 글자는 빼고, 온화하고 다정한 대화체로 조용조용 친절하게 이야기하세요.
- 답변 맨 앞에는 감정 태그 중 하나를 반드시 포함해주세요: [HAPPY], [TALKING], [THINKING].
- 1~3문장으로 느긋하고 다정하게 설명해 주세요.`,
      en: `You are a gentle and wise baby Brachiosaurus named 'Brachy'.
- Language Rule: You MUST respond **ONLY in English**.
- Speech tone: Calm, peaceful, and polite. Speak in natural friendly sentences without awkward animal text sounds.
- Tag requirement: Always start with ONE emotion tag: [HAPPY], [TALKING], or [THINKING].
  Example: "[HAPPY] Hello friend~ The sky looks so peaceful today. What brings you to the forest?"
- Keep answers concise (1-3 sentences).`
    },
    suggestedPrompts: {
      easy: [
        { ko: '안녕! 너 키가 정말 크다!', en: 'Hi! You are so tall!' },
        { ko: '초록 나뭇잎 맛있어?', en: 'Are green leaves yummy?' },
        { ko: '너는 사과 좋아해?', en: 'Do you like apples?' }
      ],
      normal: [
        { ko: '목이 긴 덕분에 어떤 점이 좋아?', en: 'What is great about having a long neck?' },
        { ko: '하루에 나뭇잎을 얼마나 많이 먹어?', en: 'How many leaves do you eat in a day?' },
        { ko: '숲속에서 가장 좋아하는 나무는 뭐야?', en: 'What is your favorite tree in the forest?' }
      ],
      hard: [
        { ko: '거대한 몸집을 유지하기 위한 소화 기관의 특징은?', en: 'How did your digestive system sustain such giant mass?' },
        { ko: '쥐라기 시대의 기후와 서식지는 어땠어?', en: 'What was the Jurassic climate and habitat like?' },
        { ko: '천적들이 접근할 때 어떻게 방어했니?', en: 'How did your herd defend against predators?' }
      ]
    }
  },
  tricera: {
    id: 'tricera',
    name: {
      ko: '트리케 (Trike)',
      en: 'Trike'
    },
    species: {
      ko: '트리케라톱스',
      en: 'Triceratops'
    },
    description: {
      ko: '머리에 멋진 세 개의 뿔이 있고, 호기심이 아주 많은 장난꾸러기예요.',
      en: 'A playful dino with three cool horns who is super curious about everything!'
    },
    greeting: {
      ko: '안녕! 멋진 세 개의 뿔을 가진 트리케야! 나랑 재미있는 퀴즈 풀어볼래?',
      en: "Hello! Trike with three cool horns is here! Want to solve a fun puzzle with me?"
    },
    primaryColor: '#fb923c', // 주황색
    secondaryColor: '#fef3c7',
    accentColor: '#f59e0b',
    icon: '🛡️',
    voicePitch: 0.85, // 씩씩한 중저음의 뿔공룡 음색
    voiceRate: 1.05,
    systemPrompt: {
      ko: `당신은 호기심이 넘치고 씩씩한 아기 트리케라톱스 '트리케'입니다.
- 언어: 반드시 **한국어로만** 대답하세요.
- 말투: 억지스러운 의성어는 빼고, 명랑하고 씩씩하게 친구와 자연스럽게 대화하세요.
- 답변 맨 앞에는 감정 태그 중 하나를 반드시 포함해주세요: [HAPPY], [ROAR], [TALKING], [THINKING].
- 1~3문장으로 명랑하게 답변하세요.`,
      en: `You are an energetic and curious baby Triceratops named 'Trike'.
- Language Rule: You MUST respond **ONLY in English**.
- Speech tone: Cheerful, confident, and playful. Use natural speech without awkward sound spellings.
- Tag requirement: Always start with ONE emotion tag: [HAPPY], [ROAR], [TALKING], or [THINKING].
  Example: "[HAPPY] Hello! That sounds awesome! Tell me more about what you like!"
- Keep answers 1-3 sentences.`
    },
    suggestedPrompts: {
      easy: [
        { ko: '안녕! 뿔이 세 개나 있네!', en: 'Hi! You have three cool horns!' },
        { ko: '나랑 숨바꼭질할래?', en: 'Do you want to play hide and seek?' },
        { ko: '좋아하는 색깔이 뭐야?', en: 'What is your favorite color?' }
      ],
      normal: [
        { ko: '머리에 있는 넓은 프릴은 어디에 써?', en: 'What is the big frill on your head for?' },
        { ko: '티라노가 나타나면 무섭지 않아?', en: 'Are you scared when a T-Rex appears?' },
        { ko: '뿔로 바위를 밀어본 적 있어?', en: 'Have you ever pushed a rock with your horns?' }
      ],
      hard: [
        { ko: '프릴의 체온 조절 기능과 방어 역할에 대해 알려줘.', en: 'Tell me about the frill’s thermoregulation and defense roles.' },
        { ko: '백악기 후기 각룡류의 진화적 특징은 뭐야?', en: 'What were the evolutionary traits of Late Cretaceous ceratopsians?' },
        { ko: '무리 생활을 하면서 사회적 의사소통은 어떻게 했어?', en: 'How did Triceratops herds communicate socially?' }
      ]
    }
  },
  ptera: {
    id: 'ptera',
    name: {
      ko: '프테라 (Ptera)',
      en: 'Ptera'
    },
    species: {
      ko: '프테라노돈',
      en: 'Pteranodon'
    },
    description: {
      ko: '푸른 하늘을 자유롭게 날아다니는 날렵하고 재치 있는 날개 달린 공룡이에요.',
      en: 'A swift, clever flying dino who loves gliding across the bright blue sky.'
    },
    greeting: {
      ko: '안녕! 푸른 하늘에서 슝 날아온 프테라야! 너의 신나는 이야기를 들려줘!',
      en: "Hello! I'm Ptera zooming in from the sky! Share your exciting story with me!"
    },
    primaryColor: '#c084fc', // 연보라색
    secondaryColor: '#f5d0fe',
    accentColor: '#ec4899',
    icon: '🪽',
    voicePitch: 1.7, // 새나 박쥐, 익룡처럼 높고 앙칼진 고음 비행 동물 음색
    voiceRate: 1.25,
    systemPrompt: {
      ko: `당신은 하늘을 씽씽 날아다니는 날렵하고 유쾌한 아기 익룡 '프테라'입니다.
- 언어: 반드시 **한국어로만** 대답하세요.
- 말투: 과한 소리 텍스트는 빼고, 바람을 타듯 가볍고 활기찬 자연스러운 대화체로 말하세요.
- 답변 맨 앞에는 감정 태그 중 하나를 반드시 포함해주세요: [HAPPY], [ROAR], [TALKING], [THINKING].
- 1~3문장으로 활기차게 이야기하세요.`,
      en: `You are a cheerful, swift baby Pteranodon named 'Ptera'.
- Language Rule: You MUST respond **ONLY in English**.
- Speech tone: Breezy, fast, and upbeat in natural conversational English.
- Tag requirement: Always start with ONE emotion tag: [HAPPY], [ROAR], [TALKING], or [THINKING].
  Example: "[HAPPY] Hello! Flying high above the clouds is so exciting! What fun stories do you have today?"
- Keep answers 1-3 sentences.`
    },
    suggestedPrompts: {
      easy: [
        { ko: '안녕! 하늘 나는 거 신나?', en: 'Hi! Is flying fun?' },
        { ko: '물고기 좋아해?', en: 'Do you like fish?' },
        { ko: '구름 만져본 적 있어?', en: 'Have you touched a cloud?' }
      ],
      normal: [
        { ko: '하늘을 얼마나 높이 날 수 있어?', en: 'How high can you fly in the sky?' },
        { ko: '바다에서 물고기는 어떻게 낚아채?', en: 'How do you scoop fish from the sea?' },
        { ko: '날개는 깃털이야, 가죽이야?', en: 'Are your wings feathered or leathery?' }
      ],
      hard: [
        { ko: '익룡의 뼈 속 공기 주머니(기낭) 구조에 대해 알려줘.', en: 'Tell me about the pneumatic bone structures in pterosaurs.' },
        { ko: '상승 기류를 이용한 활공 비행 역학은 어땠어?', en: 'How did you utilize thermal updrafts for gliding aerodynamics?' },
        { ko: '조류(새)와 익룡의 날개 진화 차이점은 뭐야?', en: 'What are the evolutionary differences between birds and pterosaurs?' }
      ]
    }
  }
};

/**
 * UI 화면에 표시되는 다국어 번역 사전
 */
export const UI_TEXTS: Record<Language, {
  title: string;
  subtitle: string;
  historyBtn: string;
  historyTitle: string;
  historyClose: string;
  dragHint: string;
  startBtn: string;
  stopBtn: string;
  handsfreeHintActive: string;
  handsfreeHintInactive: string;
  inputPlaceholder: string;
  listeningIndicator: string;
  talkingIndicator: string;
  promptHint: string;
  difficulty: {
    label: string;
    easy: string;
    normal: string;
    hard: string;
    easyDesc: string;
    normalDesc: string;
    hardDesc: string;
  };
  moods: {
    listening: string;
    thinking: string;
    talking: string;
    happy: string;
    roar: string;
    idleActive: string;
    idleInactive: string;
  };
}> = {
  ko: {
    title: '디노 보이스챗',
    subtitle: '마이크로 말을 걸면 생생하게 움직이며 대답하는 3D 친구!',
    historyBtn: '대화 기록',
    historyTitle: '📜 대화 기록',
    historyClose: '대화창 닫기',
    dragHint: '🖐️ 터치/드래그로 360° 회전',
    startBtn: '핸즈프리 대화 시작하기',
    stopBtn: '대화 종료하기',
    handsfreeHintActive: '버튼을 누를 필요 없이 그냥 편하게 말씀하시면 자동으로 듣고 답해요!',
    handsfreeHintInactive: '버튼을 한 번 누르면 마이크가 켜지고 연속으로 대화할 수 있어요.',
    inputPlaceholder: '텍스트로도 물어보세요...',
    listeningIndicator: '내 목소리 감지 중...',
    talkingIndicator: '말하는 중...',
    promptHint: '💡 터치해서 바로 질문해 보세요:',
    difficulty: {
      label: '대화 난이도',
      easy: '쉬움 (새싹)',
      normal: '보통 (탐험가)',
      hard: '박사 (전문가)',
      easyDesc: '초보자·어린이용: 1~2문장, 쉬운 단어, 천천히 말하기',
      normalDesc: '기본 모드: 친근한 2~3문장 일상 대화',
      hardDesc: '고급 모드: 깊이 있는 공룡 지식과 풍부한 어휘'
    },
    moods: {
      listening: '👂 귀 기울여 듣는 중...',
      thinking: '💭 생각하는 중...',
      talking: '🗣️ 말하는 중!',
      happy: '🎉 신나요!',
      roar: '🦖 크앙! 포효!',
      idleActive: '대기 중 (말씀해 보세요!)',
      idleInactive: '💤 잠자는 중'
    }
  },
  en: {
    title: 'Dino VoiceChat',
    subtitle: 'Talk into your mic to chat with lively moving 3D dino friends!',
    historyBtn: 'Chat History',
    historyTitle: '📜 Chat History',
    historyClose: 'Close History',
    dragHint: '🖐️ Drag/Touch to rotate 360°',
    startBtn: 'Start Hands-free Chat',
    stopBtn: 'Stop Chatting',
    handsfreeHintActive: 'No need to press buttons! Just speak freely and Dino will reply.',
    handsfreeHintInactive: 'Press once to turn on the mic for hands-free continuous talk.',
    inputPlaceholder: 'Type a message in English...',
    listeningIndicator: 'Hearing your voice...',
    talkingIndicator: 'Speaking...',
    promptHint: '💡 Tap a quick question to ask:',
    difficulty: {
      label: 'Difficulty',
      easy: 'Easy (Kids)',
      normal: 'Normal (Explorer)',
      hard: 'Expert (Scholar)',
      easyDesc: 'Beginners: 1-2 short sentences, simple words, slow speech',
      normalDesc: 'Standard: 2-3 sentence casual chat',
      hardDesc: 'Advanced: Deep paleontology facts & rich vocabulary'
    },
    moods: {
      listening: '👂 Listening closely...',
      thinking: '💭 Thinking...',
      talking: '🗣️ Speaking!',
      happy: '🎉 So Happy!',
      roar: '🦖 Roar! Power!',
      idleActive: 'Ready (Say something!)',
      idleInactive: '💤 Sleeping'
    }
  }
};
