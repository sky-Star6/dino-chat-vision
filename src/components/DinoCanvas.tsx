'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { DinosaurType, DinosaurMood } from '@/types/dinosaur';
import { DINOSAURS } from '@/data/dinosaurs';

interface DinoCanvasProps {
  dinoType: DinosaurType;
  mood: DinosaurMood;
  audioVolume: number; // 0.0 ~ 1.0 (실시간 립싱크용 음성 크기)
  onModelClick?: () => void;
}

/**
 * Three.js 기반의 귀여운 3D 공룡 캔버스 컴포넌트입니다.
 * - 마우스/터치 드래그로 360도 회전 가능
 * - 실시간 호흡(Breathing), 꼬리 흔들기, 눈 깜빡임 애니메이션
 * - 목소리 볼륨(audioVolume)에 반응하는 실시간 턱(Jaw) 립싱크
 * - 공룡 종류(T-Rex, Brachio, Tricera, Ptera)에 따른 절차적 3D 모델링
 */
export const DinoCanvas: React.FC<DinoCanvasProps> = ({
  dinoType,
  mood,
  audioVolume,
  onModelClick
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // 애니메이션 제어를 위한 레퍼런스들
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const jawRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const tailSegmentsRef = useRef<THREE.Group[]>([]);
  const wingsRef = useRef<{ left: THREE.Group; right: THREE.Group } | null>(null);
  const neckSegmentsRef = useRef<THREE.Group[]>([]);

  // 회전 인터랙션을 위한 상태 레퍼런스
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.1, y: 0 });

  // 실시간 props 전달을 위한 ref
  const moodRef = useRef(mood);
  const audioVolumeRef = useRef(audioVolume);
  moodRef.current = mood;
  audioVolumeRef.current = audioVolume;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js 기본 씬(Scene) 생성
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. 원근 투영 카메라(Perspective Camera) 설정
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 5.5);

    // 3. WebGL 렌더러 설정 (안티앨리어싱 및 부드러운 그림자)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. 조명(Lighting) 설정 - 따뜻하고 부드러운 만화풍 조명
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainDirectionalLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    mainDirectionalLight.position.set(5, 8, 5);
    mainDirectionalLight.castShadow = true;
    mainDirectionalLight.shadow.mapSize.width = 1024;
    mainDirectionalLight.shadow.mapSize.height = 1024;
    scene.add(mainDirectionalLight);

    const fillLight = new THREE.DirectionalLight(0x90e0ef, 0.8);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    // 바닥 부드러운 그림자 수신용 원형 발판
    const platformGeometry = new THREE.CylinderGeometry(2.0, 2.2, 0.15, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.8
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -1.3;
    platform.receiveShadow = true;
    scene.add(platform);

    // 발판 테두리 귀여운 링 장식
    const ringGeometry = new THREE.TorusGeometry(2.1, 0.05, 16, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      roughness: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -1.25;
    scene.add(ring);

    // 5. 공룡 캐릭터 빌드 함수 호출
    buildDinosaur(dinoType, scene);

    // 6. 윈도우/태블릿 크기 변경 리사이즈 핸들러
    const handleResize = () => {
      if (!container || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // 7. 터치 및 마우스 회전 제어 이벤트 등록
    const handlePointerDown = (event: PointerEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x = Math.max(
        -0.3,
        Math.min(0.5, targetRotationRef.current.x + deltaY * 0.005)
      );

      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 8. 애니메이션 렌더 루프 (Render Loop)
    let animationFrameId: number;
    const startTime = performance.now();
    let blinkTimer = 0;
    let isBlinking = false;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const currentMood = moodRef.current;
      const currentVolume = audioVolumeRef.current;

      const character = characterGroupRef.current;
      if (character) {
        // 부드러운 회전 보간(Slerp/Lerp)
        character.rotation.y += (targetRotationRef.current.y - character.rotation.y) * 0.08;
        character.rotation.x += (targetRotationRef.current.x - character.rotation.x) * 0.08;

        // 1) 기본 호흡 및 바운스 모션 (Idle Breathing)
        const breatheSpeed = currentMood === 'roar' ? 6.0 : currentMood === 'happy' ? 4.5 : 2.2;
        const breatheAmount = currentMood === 'happy' ? 0.12 : 0.05;
        const jumpOffset = currentMood === 'happy' ? Math.abs(Math.sin(elapsedTime * 5)) * 0.3 : 0;

        character.position.y = -0.3 + Math.sin(elapsedTime * breatheSpeed) * breatheAmount + jumpOffset;

        // 2) 꼬리 살랑거리기 (Tail wagging)
        tailSegmentsRef.current.forEach((seg, idx) => {
          const wave = Math.sin(elapsedTime * 3 - idx * 0.6);
          seg.rotation.y = wave * (0.2 + idx * 0.15);
        });

        // 3) 브라키오사우루스 긴 목 유연한 움직임
        neckSegmentsRef.current.forEach((neckSeg, idx) => {
          neckSeg.rotation.z = Math.sin(elapsedTime * 1.5 + idx * 0.4) * 0.04;
          neckSeg.rotation.x = Math.sin(elapsedTime * 2.0) * 0.03;
        });

        // 4) 프테라노돈 날갯짓 (Wings flapping)
        if (wingsRef.current) {
          const wingSpeed = currentMood === 'talking' ? 6 : 3;
          const flap = Math.sin(elapsedTime * wingSpeed) * 0.4;
          wingsRef.current.left.rotation.z = flap;
          wingsRef.current.right.rotation.z = -flap;
        }

        // 5) 아래턱(Jaw) 실시간 립싱크 (Lip-sync via Audio Volume)
        if (jawRef.current) {
          // 음성 볼륨에 비례하여 턱이 벌어짐
          const targetJawAngle = Math.min(0.55, currentVolume * 0.8 + (currentMood === 'roar' ? 0.45 : 0));
          jawRef.current.rotation.x += (targetJawAngle - jawRef.current.rotation.x) * 0.35;
        }

        // 6) 눈 깜빡임 (Eye Blinking)
        blinkTimer += 0.016;
        if (blinkTimer > 3.5) {
          isBlinking = true;
          if (blinkTimer > 3.65) {
            isBlinking = false;
            blinkTimer = 0;
          }
        }
        const eyeScaleY = isBlinking ? 0.1 : 1.0;
        if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
        if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

        // 7) 감정 상태별 모션 (Listening, Thinking, Roar)
        if (currentMood === 'listening') {
          // 고개를 살짝 갸웃하며 집중
          character.rotation.z = Math.sin(elapsedTime * 2) * 0.05 + 0.08;
        } else if (currentMood === 'thinking') {
          // 위를 쳐다보며 생각
          character.rotation.z = -0.06;
          character.rotation.x = -0.15;
        } else {
          character.rotation.z = 0;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 언마운트 시 리소스 정리 (Cleanup)
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dinoType]);

  /**
   * 선택된 공룡의 3D 절차적 메시를 생성하는 빌더 함수
   */
  const buildDinosaur = (type: DinosaurType, scene: THREE.Scene) => {
    // 기존 공룡 제거
    if (characterGroupRef.current) {
      scene.remove(characterGroupRef.current);
    }

    const dinoInfo = DINOSAURS[type];
    const characterGroup = new THREE.Group();
    characterGroupRef.current = characterGroup;

    // 공통 재질(Materials)
    const primaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dinoInfo.primaryColor),
      roughness: 0.45,
      metalness: 0.1
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dinoInfo.secondaryColor),
      roughness: 0.55
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.1 });
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dinoInfo.accentColor),
      roughness: 0.4
    });

    // 꼬리 및 관절 레퍼런스 초기화
    tailSegmentsRef.current = [];
    wingsRef.current = null;
    neckSegmentsRef.current = [];

    if (type === 'trex') {
      // ==========================================
      // 1. 티노 (T-Rex) : 큰 머리, 앙증맞은 손, 튼튼한 다리
      // ==========================================
      // 몸통 (Body)
      const bodyGeo = new THREE.SphereGeometry(0.85, 24, 24);
      bodyGeo.scale(1.0, 1.25, 1.1);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      body.position.set(0, 0.4, 0);
      body.castShadow = true;
      characterGroup.add(body);

      // 통통한 배 (Belly)
      const bellyGeo = new THREE.SphereGeometry(0.72, 20, 20);
      bellyGeo.scale(0.85, 1.1, 0.6);
      const belly = new THREE.Mesh(bellyGeo, bellyMat);
      belly.position.set(0, 0.35, 0.55);
      characterGroup.add(belly);

      // 머리 상단 (Upper Head)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.45, 0.4);

      const upperHeadGeo = new THREE.SphereGeometry(0.75, 24, 24);
      upperHeadGeo.scale(0.95, 0.9, 1.2);
      const upperHead = new THREE.Mesh(upperHeadGeo, primaryMat);
      upperHead.castShadow = true;
      headGroup.add(upperHead);

      // 콧구멍 2개
      const nostrilGeo = new THREE.SphereGeometry(0.04, 12, 12);
      const leftNostril = new THREE.Mesh(nostrilGeo, eyePupilMat);
      leftNostril.position.set(-0.2, 0.1, 0.85);
      const rightNostril = leftNostril.clone();
      rightNostril.position.x = 0.2;
      headGroup.add(leftNostril, rightNostril);

      // 아래턱 및 립싱크 (Lower Jaw)
      const jawGroup = new THREE.Group();
      jawGroup.position.set(0, -0.25, 0.1);
      const jawGeo = new THREE.BoxGeometry(0.65, 0.25, 0.85);
      const jawMesh = new THREE.Mesh(jawGeo, primaryMat);
      jawMesh.position.set(0, -0.1, 0.35);
      jawMesh.castShadow = true;
      jawGroup.add(jawMesh);

      // 귀여운 둥근 이빨들 (Teeth)
      for (let i = -2; i <= 2; i++) {
        const toothGeo = new THREE.ConeGeometry(0.04, 0.1, 8);
        toothGeo.rotateX(Math.PI);
        const tooth = new THREE.Mesh(toothGeo, toothMat);
        tooth.position.set(i * 0.12, -0.18, 0.85);
        headGroup.add(tooth);
      }
      headGroup.add(jawGroup);
      jawRef.current = jawGroup;

      // 큰 눈과 동공 (Big Cute Eyes)
      const eyeWhiteGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);

      const leftEyeGroup = new THREE.Group();
      leftEyeGroup.position.set(-0.45, 0.25, 0.45);
      const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
      const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      leftPupil.position.set(0, 0, 0.12);
      leftEyeGroup.add(leftEyeWhite, leftPupil);

      const rightEyeGroup = leftEyeGroup.clone();
      rightEyeGroup.position.x = 0.45;

      headGroup.add(leftEyeGroup, rightEyeGroup);
      characterGroup.add(headGroup);

      leftEyeRef.current = leftEyeGroup as unknown as THREE.Mesh;
      rightEyeRef.current = rightEyeGroup as unknown as THREE.Mesh;

      // 앙증맞은 앞발 (Tiny Cute Arms)
      const armGeo = new THREE.CapsuleGeometry(0.12, 0.35, 12, 12);
      const leftArm = new THREE.Mesh(armGeo, primaryMat);
      leftArm.position.set(-0.55, 0.55, 0.6);
      leftArm.rotation.set(0.6, 0.2, -0.3);
      const rightArm = leftArm.clone();
      rightArm.position.x = 0.55;
      rightArm.rotation.set(0.6, -0.2, 0.3);
      characterGroup.add(leftArm, rightArm);

      // 튼튼한 다리와 발 (Legs & Feet)
      const legGeo = new THREE.CapsuleGeometry(0.28, 0.65, 12, 12);
      const leftLeg = new THREE.Mesh(legGeo, primaryMat);
      leftLeg.position.set(-0.6, -0.35, 0);
      leftLeg.castShadow = true;
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.6;
      characterGroup.add(leftLeg, rightLeg);

      // 꼬리 마디 3개 (Tail with 3 Segments)
      let parentTail = characterGroup;
      let tailPosZ = -0.7;
      for (let i = 0; i < 3; i++) {
        const segGroup = new THREE.Group();
        segGroup.position.set(0, 0.1 - i * 0.05, tailPosZ);
        const segGeo = new THREE.ConeGeometry(0.35 - i * 0.09, 0.65, 16);
        segGeo.rotateX(-Math.PI / 2.2);
        const segMesh = new THREE.Mesh(segGeo, primaryMat);
        segMesh.castShadow = true;
        segGroup.add(segMesh);
        parentTail.add(segGroup);
        tailSegmentsRef.current.push(segGroup);
        parentTail = segGroup;
        tailPosZ = -0.45;
      }
    } else if (type === 'brachio') {
      // ==========================================
      // 2. 브라키 (Brachiosaurus) : 긴 목, 온화한 표정, 4발
      // ==========================================
      // 몸통
      const bodyGeo = new THREE.SphereGeometry(0.9, 24, 24);
      bodyGeo.scale(0.95, 1.1, 1.4);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      body.position.set(0, 0.3, 0);
      body.castShadow = true;
      characterGroup.add(body);

      // 배
      const bellyGeo = new THREE.SphereGeometry(0.75, 20, 20);
      bellyGeo.scale(0.8, 0.9, 1.2);
      const belly = new THREE.Mesh(bellyGeo, bellyMat);
      belly.position.set(0, 0.1, 0.2);
      characterGroup.add(belly);

      // 긴 목 (Neck - 3개 세그먼트 연결)
      let parentNeck = characterGroup;
      let neckPosY = 0.9;
      for (let i = 0; i < 3; i++) {
        const neckSeg = new THREE.Group();
        neckSeg.position.set(0, neckPosY, 0.5 - i * 0.05);
        const neckGeo = new THREE.CylinderGeometry(0.24 - i * 0.03, 0.29 - i * 0.03, 0.5, 16);
        const neckMesh = new THREE.Mesh(neckGeo, primaryMat);
        neckMesh.castShadow = true;
        neckSeg.add(neckMesh);
        parentNeck.add(neckSeg);
        neckSegmentsRef.current.push(neckSeg);
        parentNeck = neckSeg;
        neckPosY = 0.45;
      }

      // 머리 (Head)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.35, 0.2);
      const headGeo = new THREE.SphereGeometry(0.42, 20, 20);
      headGeo.scale(0.8, 0.9, 1.2);
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // 머리 위 귀여운 볏 돔
      const crestGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const crest = new THREE.Mesh(crestGeo, accentMat);
      crest.position.set(0, 0.32, -0.05);
      headGroup.add(crest);

      // 턱 (Jaw)
      const jawGroup = new THREE.Group();
      jawGroup.position.set(0, -0.15, 0.1);
      const jawGeo = new THREE.BoxGeometry(0.32, 0.15, 0.45);
      const jawMesh = new THREE.Mesh(jawGeo, bellyMat);
      jawMesh.position.set(0, -0.05, 0.15);
      jawGroup.add(jawMesh);
      headGroup.add(jawGroup);
      jawRef.current = jawGroup;

      // 눈
      const eyeGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const pupilGeo = new THREE.SphereGeometry(0.06, 16, 16);
      const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      leftPupil.position.set(0, 0, 0.08);
      leftEye.add(leftPupil);
      leftEye.position.set(-0.24, 0.12, 0.2);

      const rightEye = leftEye.clone();
      rightEye.position.x = 0.24;
      headGroup.add(leftEye, rightEye);

      parentNeck.add(headGroup);
      leftEyeRef.current = leftEye;
      rightEyeRef.current = rightEye;

      // 4개의 든든한 다리
      const legPositions = [
        [-0.55, -0.45, 0.6],
        [0.55, -0.45, 0.6],
        [-0.55, -0.5, -0.6],
        [0.55, -0.5, -0.6]
      ];
      legPositions.forEach(([x, y, z]) => {
        const legGeo = new THREE.CylinderGeometry(0.2, 0.22, 0.7, 16);
        const leg = new THREE.Mesh(legGeo, primaryMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        characterGroup.add(leg);
      });

      // 긴 꼬리
      let parentTail = characterGroup;
      let tailPosZ = -0.9;
      for (let i = 0; i < 3; i++) {
        const segGroup = new THREE.Group();
        segGroup.position.set(0, 0.1, tailPosZ);
        const segGeo = new THREE.ConeGeometry(0.28 - i * 0.08, 0.7, 16);
        segGeo.rotateX(-Math.PI / 2.3);
        const segMesh = new THREE.Mesh(segGeo, primaryMat);
        segGroup.add(segMesh);
        parentTail.add(segGroup);
        tailSegmentsRef.current.push(segGroup);
        parentTail = segGroup;
        tailPosZ = -0.5;
      }
    } else if (type === 'tricera') {
      // ==========================================
      // 3. 트리케 (Triceratops) : 3개의 뿔, 목 프릴(Frill), 튼튼한 체구
      // ==========================================
      // 몸통
      const bodyGeo = new THREE.SphereGeometry(0.85, 24, 24);
      bodyGeo.scale(1.1, 1.1, 1.3);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      body.position.set(0, 0.25, 0);
      body.castShadow = true;
      characterGroup.add(body);

      // 머리 그룹
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.75, 0.85);

      const headGeo = new THREE.SphereGeometry(0.65, 20, 20);
      headGeo.scale(1.0, 0.95, 1.15);
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // 목 뒤 멋진 부채꼴 프릴 (Frill)
      const frillGeo = new THREE.CylinderGeometry(0.9, 0.85, 0.15, 24, 1, false, 0, Math.PI);
      frillGeo.rotateZ(Math.PI);
      frillGeo.rotateX(-0.4);
      const frill = new THREE.Mesh(frillGeo, accentMat);
      frill.position.set(0, 0.35, -0.35);
      frill.castShadow = true;
      headGroup.add(frill);

      // 코 위의 귀여운 짧은 뿔 1개
      const noseHornGeo = new THREE.ConeGeometry(0.12, 0.35, 16);
      noseHornGeo.rotateX(0.7);
      const noseHorn = new THREE.Mesh(noseHornGeo, eyeWhiteMat);
      noseHorn.position.set(0, 0.18, 0.75);
      headGroup.add(noseHorn);

      // 양쪽 눈 위의 긴 멋진 뿔 2개
      const browHornGeo = new THREE.ConeGeometry(0.11, 0.6, 16);
      browHornGeo.rotateX(0.4);
      const leftBrowHorn = new THREE.Mesh(browHornGeo, eyeWhiteMat);
      leftBrowHorn.position.set(-0.35, 0.55, 0.25);
      leftBrowHorn.rotation.z = 0.2;

      const rightBrowHorn = leftBrowHorn.clone();
      rightBrowHorn.position.x = 0.35;
      rightBrowHorn.rotation.z = -0.2;
      headGroup.add(leftBrowHorn, rightBrowHorn);

      // 아래턱 (Jaw)
      const jawGroup = new THREE.Group();
      jawGroup.position.set(0, -0.2, 0.2);
      const jawGeo = new THREE.BoxGeometry(0.5, 0.18, 0.6);
      const jawMesh = new THREE.Mesh(jawGeo, bellyMat);
      jawMesh.position.set(0, -0.05, 0.25);
      jawGroup.add(jawMesh);
      headGroup.add(jawGroup);
      jawRef.current = jawGroup;

      // 동그란 눈
      const eyeGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16);
      const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      leftPupil.position.set(0, 0, 0.1);
      leftEye.add(leftPupil);
      leftEye.position.set(-0.38, 0.15, 0.35);

      const rightEye = leftEye.clone();
      rightEye.position.x = 0.38;
      headGroup.add(leftEye, rightEye);
      leftEyeRef.current = leftEye;
      rightEyeRef.current = rightEye;

      characterGroup.add(headGroup);

      // 4개의 튼튼한 다리
      const legGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.65, 16);
      [
        [-0.6, -0.4, 0.5],
        [0.6, -0.4, 0.5],
        [-0.6, -0.4, -0.5],
        [0.6, -0.4, -0.5]
      ].forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, primaryMat);
        leg.position.set(x, y, z);
        leg.castShadow = true;
        characterGroup.add(leg);
      });

      // 꼬리
      let parentTail = characterGroup;
      let tailPosZ = -0.8;
      for (let i = 0; i < 3; i++) {
        const segGroup = new THREE.Group();
        segGroup.position.set(0, 0.05, tailPosZ);
        const segGeo = new THREE.ConeGeometry(0.32 - i * 0.09, 0.6, 16);
        segGeo.rotateX(-Math.PI / 2.2);
        const segMesh = new THREE.Mesh(segGeo, primaryMat);
        segGroup.add(segMesh);
        parentTail.add(segGroup);
        tailSegmentsRef.current.push(segGroup);
        parentTail = segGroup;
        tailPosZ = -0.45;
      }
    } else if (type === 'ptera') {
      // ==========================================
      // 4. 프테라 (Pteranodon) : 펄럭이는 큰 날개, 머리 뒤 볏, 뾰족한 부리
      // ==========================================
      // 날렵한 몸통
      const bodyGeo = new THREE.SphereGeometry(0.6, 20, 20);
      bodyGeo.scale(0.85, 1.3, 0.9);
      const body = new THREE.Mesh(bodyGeo, primaryMat);
      body.position.set(0, 0.3, 0);
      body.castShadow = true;
      characterGroup.add(body);

      // 머리 그룹 (Head with long Crest and Beak)
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.1, 0.2);

      const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
      const headMesh = new THREE.Mesh(headGeo, primaryMat);
      headGroup.add(headMesh);

      // 머리 뒤로 길게 뻗은 멋진 볏 (Crest)
      const crestGeo = new THREE.ConeGeometry(0.18, 1.1, 16);
      crestGeo.rotateX(-Math.PI / 2.5);
      const crest = new THREE.Mesh(crestGeo, accentMat);
      crest.position.set(0, 0.3, -0.6);
      headGroup.add(crest);

      // 위쪽 뾰족한 부리 (Upper Beak)
      const beakGeo = new THREE.ConeGeometry(0.16, 0.9, 16);
      beakGeo.rotateX(Math.PI / 2.2);
      const beak = new THREE.Mesh(beakGeo, bellyMat);
      beak.position.set(0, -0.05, 0.65);
      headGroup.add(beak);

      // 아래쪽 부리 턱 (Lower Jaw)
      const jawGroup = new THREE.Group();
      jawGroup.position.set(0, -0.2, 0.2);
      const lowerBeakGeo = new THREE.ConeGeometry(0.14, 0.8, 16);
      lowerBeakGeo.rotateX(Math.PI / 2.2);
      const lowerBeak = new THREE.Mesh(lowerBeakGeo, bellyMat);
      lowerBeak.position.set(0, -0.02, 0.5);
      jawGroup.add(lowerBeak);
      headGroup.add(jawGroup);
      jawRef.current = jawGroup;

      // 눈
      const eyeGeo = new THREE.SphereGeometry(0.14, 16, 16);
      const pupilGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
      const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
      leftPupil.position.set(0, 0, 0.09);
      leftEye.add(leftPupil);
      leftEye.position.set(-0.25, 0.1, 0.15);

      const rightEye = leftEye.clone();
      rightEye.position.x = 0.25;
      headGroup.add(leftEye, rightEye);
      leftEyeRef.current = leftEye;
      rightEyeRef.current = rightEye;

      characterGroup.add(headGroup);

      // 넓고 화려한 좌우 날개 (Flapping Wings)
      const leftWingGroup = new THREE.Group();
      leftWingGroup.position.set(-0.4, 0.5, 0);

      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(-1.8, 0.4);
      wingShape.lineTo(-1.2, -0.8);
      wingShape.lineTo(0, -0.4);
      wingShape.closePath();

      const wingExtrude = new THREE.ExtrudeGeometry(wingShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02 });
      const leftWingMesh = new THREE.Mesh(wingExtrude, accentMat);
      leftWingMesh.castShadow = true;
      leftWingGroup.add(leftWingMesh);

      const rightWingGroup = new THREE.Group();
      rightWingGroup.position.set(0.4, 0.5, 0);
      const rightWingMesh = new THREE.Mesh(wingExtrude, accentMat);
      rightWingMesh.scale.x = -1;
      rightWingMesh.castShadow = true;
      rightWingGroup.add(rightWingMesh);

      characterGroup.add(leftWingGroup, rightWingGroup);
      wingsRef.current = { left: leftWingGroup, right: rightWingGroup };

      // 가벼운 두 발
      const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
      const leftLeg = new THREE.Mesh(legGeo, primaryMat);
      leftLeg.position.set(-0.25, -0.4, 0);
      const rightLeg = leftLeg.clone();
      rightLeg.position.x = 0.25;
      characterGroup.add(leftLeg, rightLeg);
    }

    // 바닥 위치 보정
    characterGroup.position.y = -0.3;
    scene.add(characterGroup);
  };

  return (
    <div
      ref={mountRef}
      onClick={onModelClick}
      className="relative w-full h-full min-h-[350px] cursor-grab active:cursor-grabbing select-none touch-none"
      title="손가락이나 마우스로 드래그하여 공룡을 360도 돌려보세요!"
    />
  );
};
