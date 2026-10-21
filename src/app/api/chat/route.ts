import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DINOSAURS } from '@/data/dinosaurs';
import { DinosaurType, Language, DifficultyLevel } from '@/types/dinosaur';

/**
 * Vercel Serverless Function: 다국어(한국어/영어) 및 난이도별(초급/중급/고급) 지원 공룡 챗봇 대화 라우트
 * - POST /api/chat
 * - Gemini API 연결 실패 또는 유효하지 않은 키일 때도 다채로운 공룡 반응 생성
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dinoId, language = 'en', difficulty = 'normal', message, history } = body as {
      dinoId: DinosaurType;
      language?: Language;
      difficulty?: DifficultyLevel;
      message: string;
      history?: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }>;
    };

    if (!message || !dinoId) {
      return NextResponse.json(
        { error: '메시지와 공룡 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const currentDino = DINOSAURS[dinoId] || DINOSAURS.trex;
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const baseSystemPrompt = currentDino.systemPrompt[language];

    // 난이도별 맞춤 프롬프트 주입 (초보자: 1~2문장 단답/선택형 질문, 중급: 2~3문장, 고급: 3~4문장 고생물학 지식)
    let difficultyInstruction = '';
    if (language === 'ko') {
      if (difficulty === 'easy') {
        difficultyInstruction = `\n[대화 난이도: 초급/새싹 (초보자 및 어린이 모드)]
- 문장 길이: 반드시 1~2문장의 아주 짧고 명확한 문장만 사용하세요.
- 어휘: 가장 쉽고 기초적인 일상 단어(과일, 색깔, 동물, 음식 등)만 쓰세요.
- 질문 유도: 상대방이 쉽게 답할 수 있도록 "A가 좋아 B가 좋아?" 같은 양자택일형 또는 "응/아니" 단답형 질문으로 문장을 마무리하세요.`;
      } else if (difficulty === 'hard') {
        difficultyInstruction = `\n[대화 난이도: 고급/공룡 박사 모드]
- 문장 길이: 3~4문장의 풍부하고 상세한 문장으로 설명하세요.
- 어휘: 고생물학, 백악기/쥐라기 생태, 화석, 해부학적 특징 등 전문적이고 흥미진진한 지식 어휘를 적극 활용하세요.
- 질문 유도: 상대방의 호기심과 사고력을 자극하는 깊이 있는 질문을 던지세요.`;
      } else {
        difficultyInstruction = `\n[대화 난이도: 중급/기본 모드]
- 문장 길이: 2~3문장의 자연스럽고 친근한 일상 대화체로 대답하세요.`;
      }
    } else {
      if (difficulty === 'easy') {
        difficultyInstruction = `\n[DIFFICULTY: EASY / BEGINNER KIDS MODE]
- Length: Strictly 1 to 2 very short, simple sentences.
- Vocabulary: Use only elementary, basic words (A1 level). No complex grammar or long words.
- Question Rule: Always end with a simple choice question (e.g. "Do you like apples or bananas?") or a simple Yes/No question so beginners can easily reply.`;
      } else if (difficulty === 'hard') {
        difficultyInstruction = `\n[DIFFICULTY: HARD / EXPERT SCHOLAR MODE]
- Length: 3 to 4 vivid, detailed sentences.
- Vocabulary: Rich paleontological facts, geological periods (Cretaceous/Jurassic), anatomy, and ecological trivia.
- Question Rule: Ask thought-provoking, imaginative questions.`;
      } else {
        difficultyInstruction = `\n[DIFFICULTY: NORMAL / STANDARD EXPLORER MODE]
- Length: 2 to 3 sentences of friendly, natural conversational English.`;
      }
    }

    const effectiveSystemPrompt = `${baseSystemPrompt}\n${difficultyInstruction}`;

    let isApiKeyValid = false;
    let apiKeyErrorMessage: string | null = null;

    // 1. 실제 Gemini API 키가 존재하는 경우: Google GenAI 호출 시도
    if (apiKey && apiKey.length > 10) {
      // 최신 Gemini API 모델 후보군 (AQ. 신규 키 및 AIzaSy 레거시 키 모두 지원)
      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-1.5-flash'
      ];

      for (const modelName of candidateModels) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              ...(history || []),
              {
                role: 'user',
                parts: [{ text: message }]
              }
            ],
            config: {
              systemInstruction: effectiveSystemPrompt,
              temperature: 0.85,
              maxOutputTokens: 250
            }
          });

          const replyText = response.text;
          if (replyText) {
            isApiKeyValid = true;
            return NextResponse.json({ reply: replyText, isAi: true });
          }
        } catch (err: unknown) {
          const errorMsg = String(err);
          if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('API key not valid')) {
            apiKeyErrorMessage = 'Google AI Studio에서 발급받은 올바른 API 키(AIzaSy...)를 입력해 주세요.';
            break;
          }
        }
      }
    }

    // 2. 키가 없거나 유효하지 않을 때: 다채롭고 재미있는 스마트 시뮬레이션 응답 반환
    const simulatedReply = generateRichSmartReply(dinoId, language, message, difficulty);
    return NextResponse.json({
      reply: simulatedReply,
      isAi: isApiKeyValid,
      apiKeyWarning: apiKeyErrorMessage
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 키워드 및 대화 맥락에 반응하여 매번 다른 대답을 주는 스마트 시뮬레이터
 */
function generateRichSmartReply(
  dinoId: DinosaurType,
  language: Language,
  message: string,
  difficulty: DifficultyLevel = 'normal'
): string {
  const cleanMsg = message.toLowerCase().trim();

  // ==========================================
  // 🇺🇸 영어 모드 (English Mode)
  // ==========================================
  if (language === 'en') {
    if (difficulty === 'easy') {
      if (cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('hey')) {
        return '[HAPPY] Hello friend! Do you like red or blue?';
      }
      if (cleanMsg.includes('eat') || cleanMsg.includes('food')) {
        return '[TALKING] I eat leaves! Do you like apples or bananas?';
      }
      if (cleanMsg.includes('friend')) {
        return '[HAPPY] Yes! We are best friends! Do you want to play?';
      }
      return `[HAPPY] I hear you! Do you like dinosaurs? Yes or no?`;
    }

    if (cleanMsg.includes('hello') || cleanMsg.includes('hi') || cleanMsg.includes('hey')) {
      const greetings = [
        "[HAPPY] Hello my best friend! Are you ready for an exciting adventure today?",
        "[HAPPY] Yay, hello! Hearing your warm voice makes me so happy! How was your day?",
        "[ROAR] Hello there! What fun stories do you want to explore with me today?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    if (cleanMsg.includes('how are you') || cleanMsg.includes('what are you doing')) {
      const answers = [
        "[HAPPY] I am feeling wonderful today! I was just enjoying the sunny day in our green forest!",
        "[TALKING] I am relaxing by the warm rocks! The weather is fantastic!",
        "[ROAR] I am practicing my cheerful dinosaur run! Always happy to talk with you!"
      ];
      return answers[Math.floor(Math.random() * answers.length)];
    }

    if (cleanMsg.includes('name') || cleanMsg.includes('who are you')) {
      if (dinoId === 'trex') return "[ROAR] I am Tino, the bravest little baby T-Rex! My teeth look sharp, but I love making friends!";
      if (dinoId === 'brachio') return "[HAPPY] I am Brachy, the gentle giant with a long neck that reaches the tall trees!";
      if (dinoId === 'tricera') return "[HAPPY] I am Trike! I have three cool horns and a friendly shield!";
      return "[HAPPY] I am Ptera! With my big wings, I love gliding across the blue sky!";
    }

    if (cleanMsg.includes('eat') || cleanMsg.includes('food') || cleanMsg.includes('hungry')) {
      return "[TALKING] In our forest, we love sweet berries and fresh green leaves! What is your favorite food?";
    }

    if (cleanMsg.includes('cool') || cleanMsg.includes('great') || cleanMsg.includes('good') || cleanMsg.includes('love')) {
      return "[ROAR] Thank you so much! Hearing your kind words gives me so much energy! You are awesome!";
    }

    const randomReplies = [
      `[TALKING] Wow, you said "${message}"? That is really interesting! Tell me more!`,
      `[HAPPY] Hehe, "${message}"? I love talking with you! It is so much fun!`,
      `[THINKING] Hmm, let me think about "${message}"... That is something new for me! Tell me about it!`,
      `[ROAR] That sounds like a wonderful idea! Let's talk more about it!`
    ];
    return randomReplies[Math.floor(Math.random() * randomReplies.length)];
  }

  // ==========================================
  // 🇰🇷 한국어 모드 (Korean Mode)
  // ==========================================
  if (difficulty === 'easy') {
    if (cleanMsg.includes('안녕') || cleanMsg.includes('반가워')) {
      return '[HAPPY] 안녕 친구야! 너는 사과가 좋아, 바나나가 좋아?';
    }
    if (cleanMsg.includes('밥') || cleanMsg.includes('먹')) {
      return '[TALKING] 나는 맛있는 풀을 먹었어! 너는 고기 좋아해, 과일 좋아해?';
    }
    if (cleanMsg.includes('친구')) {
      return '[HAPPY] 응! 우리 오늘부터 제일 친한 친구야! 같이 놀래?';
    }
    return `[HAPPY] 잘 들었어! 너는 공룡 좋아해? 응 아니면 아니라고 해줘!`;
  }

  if (cleanMsg.includes('안녕') || cleanMsg.includes('반가워')) {
    const greetings = [
      '[HAPPY] 안녕 친구야! 오늘 어떤 신나는 이야기를 나눠볼까?',
      '[HAPPY] 친구 목소리를 들으니 정말 반가워! 오늘 하루 기분은 어때?',
      '[ROAR] 반가워 친구야! 오늘 재미있는 일 많이 있었어?'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (cleanMsg.includes('이름') || cleanMsg.includes('누구')) {
    if (dinoId === 'trex') return '[ROAR] 나는 용감하고 씩씩한 아기 티라노사우루스 티노야! 친구랑 노는 걸 제일 좋아해!';
    if (dinoId === 'brachio') return '[HAPPY] 나는 긴 목으로 높은 하늘을 바라보는 온순한 브라키오사우루스 브라키야!';
    if (dinoId === 'tricera') return '[HAPPY] 나는 멋진 세 개의 뿔을 가진 트리케라톱스 트리케야! 씩씩하지?';
    return '[HAPPY] 나는 커다란 날개로 하늘을 씽씽 날아다니는 익룡 프테라야!';
  }

  if (cleanMsg.includes('밥') || cleanMsg.includes('먹') || cleanMsg.includes('배고파')) {
    return '[TALKING] 우리는 숲속에서 달콤한 열매랑 싱싱한 풀잎을 먹어! 친구는 오늘 맛있는 거 먹었어?';
  }

  if (cleanMsg.includes('멋져') || cleanMsg.includes('좋아') || cleanMsg.includes('대단')) {
    return '[ROAR] 친구가 칭찬해 주니까 기분이 정말 최고야! 고마워!';
  }

  const randomKoReplies = [
    `[TALKING] 우와, "${message}"라고 했어? 정말 흥미진진하다! 그 이야기 더 자세히 들려줘!`,
    `[HAPPY] 히히, "${message}"라니! 친구랑 이야기하니까 시간이 금방 가는 것 같아!`,
    `[THINKING] 흠~ "${message}"에 대해 곰곰이 생각 중이야! 참 멋진 생각인걸?`,
    `[ROAR] 정말 재미있는 생각이야! 다음 이야기도 들려줘!`
  ];
  return randomKoReplies[Math.floor(Math.random() * randomKoReplies.length)];
}
