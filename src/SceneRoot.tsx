import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Html, useGLTF, useTexture } from "@react-three/drei";
import { BallCollider, CuboidCollider, CylinderCollider, Physics, RigidBody, type RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { asset } from "./assets";
import { socialTargets, sculptures, type Vec3, workLayouts } from "./data";
import type { MobileInput } from "./App";

type SceneRootProps = {
  activeTargetId: string | null;
  controlsDisabled: boolean;
  isContactDialogOpen: boolean;
  labelsVisible: boolean;
  mobileInputRef: React.MutableRefObject<MobileInput>;
  onInteractTarget: (targetId: string) => void;
  onPlayerMove: (position: Vec3) => void;
  playerPosition: Vec3;
};

const CAT_START: Vec3 = [0, 0.36, 9];
const CAMERA_HEIGHT = 5.1;
const CAMERA_DISTANCE = 8.8;
const PLAZA_LIMIT_X = 19.4;
const PLAZA_LIMIT_Z = 16.8;
const FORWARD_KEYS = ["w", "keyw", "arrowup"];
const BACKWARD_KEYS = ["s", "keys", "arrowdown"];
const LEFT_KEYS = ["a", "keya", "arrowleft"];
const RIGHT_KEYS = ["d", "keyd", "arrowright"];
const MOVEMENT_KEYS = new Set([...FORWARD_KEYS, ...BACKWARD_KEYS, ...LEFT_KEYS, ...RIGHT_KEYS, " "]);

function isPressed(keys: Record<string, boolean>, candidates: string[]) {
  return candidates.some((key) => keys[key]);
}

function Model({
  highlighted = false,
  highlightColor = "#f1d0a5",
  highlightIntensity = 0.32,
  path,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1
}: {
  highlighted?: boolean;
  highlightColor?: string;
  highlightIntensity?: number;
  path: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
}) {
  const { scene } = useGLTF(path);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
      object.material = cloneMaterial(object.material);
      for (const material of asArray(object.material)) {
        if ("emissive" in material && material.emissive instanceof THREE.Color) {
          material.userData.baseEmissive = material.emissive.getHex();
          material.userData.baseEmissiveIntensity = material.emissiveIntensity;
        }
        if ("color" in material && material.color instanceof THREE.Color) {
          material.userData.baseColor = material.color.getHex();
        }
      }
    });
  }, [clone]);

  useEffect(() => {
    const glow = new THREE.Color(highlightColor);
    clone.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      for (const material of asArray(object.material)) {
        if ("emissive" in material && material.emissive instanceof THREE.Color) {
          material.emissive.setHex(highlighted ? glow.getHex() : material.userData.baseEmissive ?? 0);
          material.emissiveIntensity = highlighted ? highlightIntensity : material.userData.baseEmissiveIntensity ?? 0;
          material.needsUpdate = true;
        }
        if ("color" in material && material.color instanceof THREE.Color) {
          material.color.setHex(material.userData.baseColor ?? 0xffffff);
          material.needsUpdate = true;
        }
      }
    });
  }, [clone, highlightColor, highlightIntensity, highlighted]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

function cloneMaterial(material: THREE.Material | THREE.Material[]) {
  return Array.isArray(material) ? material.map((item) => item.clone()) : material.clone();
}

function asArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

function HighlightRing({ active, radius }: { active: boolean; radius: number }) {
  if (!active) return null;
  return (
    <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.74, radius, 48]} />
      <meshBasicMaterial color="#f3d19a" depthWrite={false} opacity={0.45} transparent />
    </mesh>
  );
}

function WorldLabel({ active, children, position = [0, 1.2, 0], className = "" }: { active: boolean; children: React.ReactNode; position?: Vec3; className?: string }) {
  return (
    <Html center distanceFactor={8} position={position} transform>
      <span className={`${active ? "world-label is-active" : "world-label"} ${className}`}>{children}</span>
    </Html>
  );
}

function Player({
  disabled,
  mobileInputRef,
  onMove,
  playerPositionRef
}: {
  disabled: boolean;
  mobileInputRef: React.MutableRefObject<MobileInput>;
  onMove: (position: Vec3) => void;
  playerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const body = useRef<RapierRigidBody | null>(null);
  const catGroup = useRef<THREE.Group | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const lastReport = useRef(0);
  const { camera, gl } = useThree();
  const scratch = useMemo(
    () => ({
      forward: new THREE.Vector3(),
      move: new THREE.Vector3(),
      cameraTarget: new THREE.Vector3(),
      cameraPosition: new THREE.Vector3(),
      lookAt: new THREE.Vector3()
    }),
    []
  );

  useEffect(() => {
    const setKey = (event: KeyboardEvent, value: boolean) => {
      const key = event.key.toLowerCase();
      const code = event.code.toLowerCase();
      keys.current[key] = value;
      keys.current[code] = value;
      if (MOVEMENT_KEYS.has(key) || MOVEMENT_KEYS.has(code)) event.preventDefault();
    };
    const down = (event: KeyboardEvent) => setKey(event, true);
    const up = (event: KeyboardEvent) => setKey(event, false);
    const reset = () => {
      keys.current = {};
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", reset);
    };
  }, []);

  useEffect(() => {
    const element = gl.domElement;
    const down = (event: PointerEvent) => {
      if (disabled || event.button !== 0 || event.target !== element) return;
      dragging.current = true;
      lastX.current = event.clientX;
      element.setPointerCapture(event.pointerId);
    };
    const move = (event: PointerEvent) => {
      if (!dragging.current || disabled) return;
      const deltaX = event.clientX - lastX.current;
      lastX.current = event.clientX;
      yaw.current = THREE.MathUtils.euclideanModulo(yaw.current + deltaX * 0.006, Math.PI * 2);
    };
    const end = (event: PointerEvent) => {
      dragging.current = false;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    };
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
    };
  }, [disabled, gl]);

  useFrame((state, delta) => {
    const rigidBody = body.current;
    if (!rigidBody) return;

    const current = rigidBody.translation();
    const position = { x: current.x, y: CAT_START[1], z: current.z };

    const forward = scratch.forward.set(Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const move = scratch.move.set(0, 0, 0);

    if (!disabled) {
      const input = mobileInputRef.current;
      const keyboardTurn = Number(isPressed(keys.current, RIGHT_KEYS)) - Number(isPressed(keys.current, LEFT_KEYS));
      const keyboardMove = Number(isPressed(keys.current, FORWARD_KEYS)) - Number(isPressed(keys.current, BACKWARD_KEYS));
      const turn = THREE.MathUtils.clamp(keyboardTurn + input.turn, -1, 1);
      const thrust = THREE.MathUtils.clamp(keyboardMove + input.move, -1, 1);
      if (turn) yaw.current = THREE.MathUtils.euclideanModulo(yaw.current + turn * delta * 2.75, Math.PI * 2);
      if (Math.abs(thrust) > 0.05) move.addScaledVector(forward, thrust);
    }

    if (move.lengthSq() > 0.001) {
      const speed = 5.25 * Math.min(1, Math.max(0.36, move.length()));
      move.normalize();
      rigidBody.setLinvel({ x: move.x * speed, y: 0, z: move.z * speed }, true);
    } else {
      rigidBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (Math.abs(current.y - CAT_START[1]) > 0.01) rigidBody.setTranslation({ x: current.x, y: CAT_START[1], z: current.z }, true);
    }

    playerPositionRef.current.set(position.x, position.y, position.z);

    if (catGroup.current) catGroup.current.rotation.y = -yaw.current;

    const target = scratch.cameraTarget.set(position.x, position.y, position.z);
    const cameraPosition = scratch.cameraPosition.copy(target).addScaledVector(forward, -CAMERA_DISTANCE).add(new THREE.Vector3(0, CAMERA_HEIGHT, 0));
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 5.4));
    camera.lookAt(scratch.lookAt.set(position.x, position.y + 1.2, position.z).addScaledVector(forward, 1.8));

    if (state.clock.elapsedTime - lastReport.current > 0.12) {
      lastReport.current = state.clock.elapsedTime;
      onMove([position.x, position.y, position.z]);
    }
  });

  return (
    <RigidBody ref={body} canSleep={false} colliders={false} enabledRotations={[false, false, false]} gravityScale={0} linearDamping={3.2} position={CAT_START}>
      <BallCollider args={[0.42]} position={[0, 0.48, 0]} />
      <group ref={catGroup} position={[0, -0.3, 0]}>
        <LittleCart />
        <Model path={asset("/assets/models/characters/cape-cat.glb")} rotation={[0, Math.PI / 2, 0]} scale={1.75} />
      </group>
    </RigidBody>
  );
}

function LittleCart() {
  return (
    <group position={[0, 0.12, 0.08]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.08, 1.35]} />
        <meshStandardMaterial color="#ddbb80" roughness={0.76} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.045, 0]}>
        <boxGeometry args={[0.78, 0.025, 1.12]} />
        <meshStandardMaterial color="#8c6a58" roughness={0.82} />
      </mesh>
      {[-0.45, 0.45].map((z) => (
        <group key={z} position={[0, -0.08, z]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.045, 0.045, 0.86, 8]} />
            <meshStandardMaterial color="#6b5c55" roughness={0.7} />
          </mesh>
          {[-0.48, 0.48].map((x) => (
            <mesh key={x} castShadow position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
              <meshStandardMaterial color="#3e3834" roughness={0.68} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Weather() {
  const { scene } = useThree();
  const rain = useRef<THREE.Points | null>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(620 * 3);
    for (let index = 0; index < 620; index += 1) {
      data[index * 3] = (Math.random() - 0.5) * 36;
      data[index * 3 + 1] = 1.5 + Math.random() * 18;
      data[index * 3 + 2] = (Math.random() - 0.5) * 36;
    }
    return data;
  }, []);

  useEffect(() => {
    scene.background = new THREE.Color("#d9ceb8");
    scene.fog = new THREE.Fog("#e5d8c0", 13, 58);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useFrame((state, delta) => {
    const points = rain.current;
    if (!points) return;
    const position = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let index = 0; index < position.array.length; index += 3) {
      position.array[index] += Math.sin(index + state.clock.elapsedTime) * delta * 0.12;
      position.array[index + 1] -= 3.6 * delta;
      if (position.array[index + 1] < 0.2) {
        position.array[index] = (Math.random() - 0.5) * 34;
        position.array[index + 1] = 12 + Math.random() * 13;
        position.array[index + 2] = (Math.random() - 0.5) * 34;
      }
    }
    position.needsUpdate = true;
  });

  return (
    <>
      <ambientLight intensity={1.18} />
      <directionalLight castShadow intensity={2.2} position={[8, 15, 7]} shadow-camera-bottom={-24} shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-mapSize-height={1024} shadow-mapSize-width={1024} />
      <points ref={rain}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f5f1e7" depthWrite={false} opacity={0.18} size={0.06} transparent />
      </points>
    </>
  );
}

function PlazaGround() {
  const ground = useTexture(asset("/assets/textures/plaza-ground.webp"));
  const ice = useTexture(asset("/assets/textures/cross-platform-ice-blue.webp"));

  useEffect(() => {
    for (const texture of [ground, ice]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
    ground.repeat.set(8, 8);
    ice.repeat.set(4.4, 4.4);
  }, [ground, ice]);

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[22.5, 0.09, 19.5]} position={[0, -0.09, 0]} />
      <CuboidCollider args={[0.5, 1.25, 19.5]} position={[-21.2, 1.1, 0]} />
      <CuboidCollider args={[0.5, 1.25, 19.5]} position={[21.2, 1.1, 0]} />
      <CuboidCollider args={[21.2, 1.25, 0.5]} position={[0, 1.1, -18.4]} />
      <CuboidCollider args={[21.2, 1.25, 0.5]} position={[0, 1.1, 18.4]} />
      <mesh receiveShadow position={[0, -0.08, 0]}>
        <cylinderGeometry args={[21, 22.2, 0.16, 8]} />
        <meshStandardMaterial color="#d8cab7" roughness={0.96} />
      </mesh>
      <mesh receiveShadow position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[20.6, 48]} />
        <meshStandardMaterial map={ground} roughness={0.92} />
      </mesh>
      <mesh receiveShadow position={[0, 0.057, -1.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8.4, 80]} />
        <meshStandardMaterial map={ice} roughness={0.9} />
      </mesh>
      <LowWall />
    </RigidBody>
  );
}

function LowWall() {
  return (
    <group>
      {[
        [-21.1, 0.34, 0, 0.78, 0.68, 38.2],
        [21.1, 0.34, 0, 0.78, 0.68, 38.2],
        [0, 0.34, -18.3, 41.8, 0.68, 0.78],
        [0, 0.34, 18.3, 41.8, 0.68, 0.78]
      ].map(([x, y, z, sx, sy, sz]) => (
        <mesh key={`${x}-${z}`} castShadow receiveShadow position={[x, y, z]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color="#b5bf91" roughness={0.94} />
        </mesh>
      ))}
      <WallHedges />
    </group>
  );
}

function WallHedges() {
  return (
    <group>
      {Array.from({ length: 18 }).map((_, index) => (
        <group key={`north-${index}`} position={[-19 + index * 2.25, 0, -17.9]}>
          <HedgeClump />
        </group>
      ))}
      {Array.from({ length: 18 }).map((_, index) => (
        <group key={`south-${index}`} position={[-19 + index * 2.25, 0, 17.9]}>
          <HedgeClump />
        </group>
      ))}
      {Array.from({ length: 15 }).map((_, index) => (
        <group key={`west-${index}`} position={[-20.7, 0, -15.6 + index * 2.25]} rotation={[0, Math.PI / 2, 0]}>
          <HedgeClump />
        </group>
      ))}
      {Array.from({ length: 15 }).map((_, index) => (
        <group key={`east-${index}`} position={[20.7, 0, -15.6 + index * 2.25]} rotation={[0, Math.PI / 2, 0]}>
          <HedgeClump />
        </group>
      ))}
    </group>
  );
}

function HedgeClump() {
  return (
    <group>
      <mesh castShadow position={[-0.34, 0.52, 0]}>
        <dodecahedronGeometry args={[0.46, 0]} />
        <meshStandardMaterial color="#8fa37a" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0.22, 0.45, 0.06]}>
        <dodecahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#9dad83" roughness={0.94} />
      </mesh>
    </group>
  );
}

function Vegetation() {
  const trees: Vec3[] = [
    [-18, 0, -14],
    [-17, 0, 13],
    [18, 0, -13],
    [17.5, 0, 13.5],
    [-13.5, 0, 15.5],
    [12.8, 0, 15.2],
    [-15.8, 0, -9.4],
    [15.6, 0, -8.8],
    [-10.6, 0, 11.8],
    [10.8, 0, 11.4],
    [-13.6, 0, 4.9],
    [14.2, 0, 4.6]
  ];
  const grass = useMemo(() => makeGrassTufts(), []);

  return (
    <group>
      {trees.map((position, index) => (
        <PineTree key={position.join("-")} position={position} scale={index % 2 ? 0.9 : 1.08} />
      ))}
      {Array.from({ length: 42 }).map((_, index) => {
        const angle = (index / 42) * Math.PI * 2;
        const radius = 27 + (index % 5) * 1.9;
        return <PineTree key={`outer-tree-${index}`} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius - 2]} scale={0.85 + (index % 4) * 0.18} />;
      })}
      {Array.from({ length: 42 }).map((_, index) => {
        const angle = (index / 42) * Math.PI * 2;
        const radius = 4 + (index % 7) * 2.65;
        return (
          <mesh key={index} receiveShadow position={[Math.cos(angle) * radius + Math.sin(index) * 0.5, 0.07, Math.sin(angle) * radius + Math.cos(index * 1.7) * 0.5]} rotation={[-Math.PI / 2, 0, angle * 0.5]}>
            <circleGeometry args={[0.9 + (index % 4) * 0.13, 5]} />
            <meshStandardMaterial color={index % 2 ? "#eadbcc" : "#dfcfbf"} roughness={0.98} />
          </mesh>
        );
      })}
      {grass.map((tuft, index) => (
        <GrassTuft key={`${tuft.position[0]}-${tuft.position[2]}-${index}`} tuft={tuft} />
      ))}
      {[
        [-10.2, 0, 12.7],
        [-8.8, 0, 13.8],
        [10.7, 0, 12.9],
        [12.1, 0, 11.8],
        [-15.5, 0, 6.7],
        [15.9, 0, 6.4],
        [-12.2, 0, -13.9],
        [12.6, 0, -13.6]
      ].map((position, index) => (
        <FlowerCluster key={position.join("-")} color={index % 2 ? "#d99aa2" : "#e6c774"} position={position as Vec3} />
      ))}
    </group>
  );
}

function PineTree({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.62, 0]}>
        <cylinderGeometry args={[0.13, 0.18, 1.25, 5]} />
        <meshStandardMaterial color="#7b6048" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <coneGeometry args={[0.78, 1.5, 6]} />
        <meshStandardMaterial color="#91a77f" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0, 2.16, 0]}>
        <coneGeometry args={[0.54, 1.05, 6]} />
        <meshStandardMaterial color="#a5b98a" roughness={0.94} />
      </mesh>
    </group>
  );
}

type GrassTuftData = {
  color: string;
  kind: "grass" | "wheat" | "flower";
  height: number;
  phase: number;
  position: Vec3;
  rotationY: number;
  scale: number;
  sway: number;
};

function seededRandom(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function isClearOfLandmarks(x: number, z: number) {
  const blocked = [
    { x: 0, z: -1.35, radius: 8.8 },
    { x: 0, z: -3.8, radius: 4.4 },
    { x: 8.4, z: 7, radius: 3.2 },
    { x: 11.35, z: 8.55, radius: 2.2 },
    { x: -4.85, z: -2.3, radius: 1.8 },
    { x: -6.2, z: 7.7, radius: 2.4 }
  ];
  return !blocked.some((item) => {
    const dx = x - item.x;
    const dz = z - item.z;
    return dx * dx + dz * dz < item.radius * item.radius;
  });
}

function makeGrassTufts() {
  const colors = ["#7f9f6b", "#9cab72", "#6f936e", "#c6ad6b"];
  const tufts: GrassTuftData[] = [];
  const addTuft = (seed: number, position: Vec3, scale: number, kind?: GrassTuftData["kind"]) => {
    const roll = seededRandom(seed + 13.7);
    tufts.push({
      color: colors[Math.floor(seededRandom(seed + 4.2) * colors.length)],
      kind: kind ?? (roll > 0.95 ? "flower" : roll > 0.86 ? "wheat" : "grass"),
      height: 0.42 + seededRandom(seed + 8.4) * 0.36,
      phase: seededRandom(seed + 9.7) * Math.PI * 2,
      position,
      rotationY: seededRandom(seed + 2.1) * Math.PI * 2,
      scale: scale * (0.76 + seededRandom(seed + 7.4) * 0.58),
      sway: 0.55 + seededRandom(seed + 2.8) * 0.75
    });
  };

  for (let index = 0; index < 104; index += 1) {
    const angle = (index / 104) * Math.PI * 2 + seededRandom(index + 0.3) * 0.07;
    const radius = 8.72 + seededRandom(index + 1.6) * 1.12;
    const x = Math.cos(angle) * radius;
    const z = -1.35 + Math.sin(angle) * radius;
    if (!isClearOfLandmarks(x, z)) continue;
    addTuft(index, [x, 0.075, z], 0.82);
  }

  for (const layout of workLayouts) {
    const [x, , z] = layout.position;
    const angle = Math.atan2(z + 1.35, x);
    const sideX = Math.cos(angle + Math.PI / 2);
    const sideZ = Math.sin(angle + Math.PI / 2);
    for (let index = 0; index < 7; index += 1) {
      const offset = -1.15 + index * 0.38 + (seededRandom(index + layout.work.id.length + 2.1) - 0.5) * 0.28;
      const side = index % 2 ? 1 : -1;
      const sideOffset = side * (0.66 + seededRandom(index + layout.work.id.length + 6.2) * 0.54);
      addTuft(layout.work.id.length * 13 + index, [x + Math.cos(angle) * offset + sideX * sideOffset, 0.07, z + Math.sin(angle) * offset + sideZ * sideOffset], 0.7);
    }
  }

  const addArc = (count: number, options: { centerX: number; centerZ: number; countOffset: number; endAngle: number; radiusX: number; radiusZ: number; salt: number; scaleBase: number; startAngle: number; width: number }) => {
    for (let index = 0; index < count; index += 1) {
      const seed = options.salt * 100 + index;
      const amount = (index + 0.5) / count;
      const angle = options.startAngle + (options.endAngle - options.startAngle) * amount + (seededRandom(seed + 0.21) - 0.5) * 0.045;
      const side = ((index % 4) - 1.5) * options.width * 0.2 + (seededRandom(seed + 0.72) - 0.5) * options.width * 0.34;
      const x = options.centerX + Math.cos(angle) * (options.radiusX + side);
      const z = options.centerZ + Math.sin(angle) * (options.radiusZ + side * 0.72);
      if (isClearOfLandmarks(x, z)) addTuft(seed + options.countOffset, [x, 0.078 + Math.sin(amount * Math.PI) * 0.012, z], options.scaleBase);
    }
  };

  addArc(124, { centerX: 0, centerZ: -1.35, countOffset: 400, endAngle: Math.PI * 0.84, radiusX: 17, radiusZ: 15.9, salt: 17.2, scaleBase: 0.54, startAngle: Math.PI * 0.16, width: 1.35 });
  addArc(54, { centerX: -6.2, centerZ: 7.7, countOffset: 600, endAngle: Math.PI * 0.96, radiusX: 4.35, radiusZ: 3.55, salt: 19.7, scaleBase: 0.5, startAngle: Math.PI * 0.2, width: 0.95 });
  addArc(54, { centerX: 9.65, centerZ: 8.15, countOffset: 700, endAngle: Math.PI * 0.84, radiusX: 4.8, radiusZ: 3.65, salt: 23.8, scaleBase: 0.49, startAngle: Math.PI * 0.12, width: 0.9 });

  for (let index = 0; index < 132; index += 1) {
    const angle = (index / 132) * Math.PI * 2 + seededRandom(index + 3.4) * 0.1;
    const radius = 21.5 + seededRandom(index + 4.8) * 7.8;
    addTuft(index + 220, [Math.cos(angle) * radius, 0.045, Math.sin(angle) * radius - 2], 0.62);
  }

  return tufts;
}

function GrassTuft({ tuft }: { tuft: GrassTuftData }) {
  const group = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.08 + tuft.phase) * 0.023 * tuft.sway;
  });

  return (
    <group ref={group} position={tuft.position} rotation={[0, tuft.rotationY, 0]} scale={tuft.scale}>
      {[0, 1, 2, 3].map((blade) => (
        <mesh key={blade} castShadow position={[(blade - 1.5) * 0.048, tuft.height / 2, blade % 2 ? 0.038 : 0]} rotation={[0, blade * 1.5, (blade - 1.5) * 0.14]}>
          <coneGeometry args={[0.04, tuft.height, 5]} />
          <meshStandardMaterial color={tuft.color} roughness={0.86} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {tuft.kind === "flower" ? (
        <mesh castShadow position={[0.02, tuft.height + 0.1, 0.02]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color={tuft.color === "#c6ad6b" ? "#e2c66d" : "#d98f86"} roughness={0.78} />
        </mesh>
      ) : null}
      {tuft.kind === "wheat"
        ? [0, 1, 2].map((index) => (
            <mesh key={`wheat-${index}`} castShadow position={[(index - 1) * 0.045, tuft.height * 0.72 + index * 0.045, 0.035]} rotation={[0.18, index * 1.7, 0.12]}>
              <cylinderGeometry args={[0.025, 0.04, 0.18, 5]} />
              <meshStandardMaterial color="#c6ad6b" roughness={0.82} />
            </mesh>
          ))
        : null}
    </group>
  );
}

function FlowerCluster({ color, position }: { color: string; position: Vec3 }) {
  return (
    <group position={position}>
      {[-0.4, 0, 0.4].map((x, index) => (
        <mesh key={x} castShadow position={[x, 0.28, Math.sin(index) * 0.2]}>
          <coneGeometry args={[0.22, 0.5, 5]} />
          <meshStandardMaterial color={index === 1 ? color : "#8fa37a"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function WorkBoards({ activeTargetId, labelsVisible, onInteractTarget }: Pick<SceneRootProps, "activeTargetId" | "labelsVisible" | "onInteractTarget">) {
  return (
    <group>
      {workLayouts.map((layout) => (
        <WorkBoard key={layout.work.id} active={activeTargetId === layout.targetId} labelsVisible={labelsVisible} layout={layout} onInteract={() => onInteractTarget(layout.targetId)} />
      ))}
    </group>
  );
}

function WorkBoard({ active, labelsVisible, layout, onInteract }: { active: boolean; labelsVisible: boolean; layout: (typeof workLayouts)[number]; onInteract: () => void }) {
  const texture = useTexture(layout.work.posterPath);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.needsUpdate = true;
  }, [texture]);

  const boardWidth = 2.25;
  const boardDepth = 0.24;
  const posterHeight = layout.height * 0.76;
  const centerY = layout.height * 0.12;
  const image = texture.image as HTMLImageElement | undefined;
  const aspect = image?.width && image.height ? image.width / image.height : 0.84 / 1;
  const maxPosterWidth = boardWidth * 0.84;
  const maxPosterHeight = posterHeight * 0.82;
  const maxAspect = maxPosterWidth / maxPosterHeight;
  const posterWidth = aspect >= maxAspect ? maxPosterWidth : maxPosterHeight * aspect;
  const fittedPosterHeight = aspect >= maxAspect ? maxPosterWidth / aspect : maxPosterHeight;

  const isPlaceholder = layout.work.id.startsWith("placeholder_");

  return (
    <RigidBody type="fixed" colliders={false} position={layout.position} rotation={[0, layout.rotationY, 0]}>
      <CuboidCollider args={[boardWidth / 2, posterHeight / 2, boardDepth / 2]} position={[0, centerY, 0]} />
      <CuboidCollider args={[0.36, 0.7, 2.2]} position={[0, 0.35, 0]} />
      <mesh castShadow receiveShadow position={[0, centerY, 0]} onPointerDown={(event) => stopAnd(event, onInteract)}>
        <boxGeometry args={[boardWidth, posterHeight, boardDepth]} />
        <meshStandardMaterial color={active ? "#e9cbbb" : "#d4c0b3"} emissive={active ? "#a8756a" : "#000000"} emissiveIntensity={active ? 0.14 : 0} roughness={0.9} />
      </mesh>
      {isPlaceholder ? (
        <mesh position={[0, centerY, boardDepth / 2 + 0.012]} onPointerDown={(event) => stopAnd(event, onInteract)}>
          <planeGeometry args={[posterWidth, fittedPosterHeight]} />
          <meshStandardMaterial color="#c8b89a" roughness={0.95} />
        </mesh>
      ) : (
        <mesh position={[0, centerY, boardDepth / 2 + 0.012]} onPointerDown={(event) => stopAnd(event, onInteract)}>
          <planeGeometry args={[posterWidth, fittedPosterHeight]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      )}
      <BoardFrame width={boardWidth} height={posterHeight} centerY={centerY} active={active} />
      <BoardLighting width={boardWidth} height={posterHeight} centerY={centerY} active={active} />
      {labelsVisible && !layout.work.videoPath && !isPlaceholder ? <TouringSign centerY={centerY} height={posterHeight} width={boardWidth} /> : null}
    </RigidBody>
  );
}

function BoardLighting({ width, height, centerY, active }: { width: number; height: number; centerY: number; active: boolean }) {
  const lampY = centerY + height / 2 + 0.32;
  const glowOpacity = active ? 0.42 : 0.18;
  const coneOpacity = active ? 0.3 : 0.11;

  return (
    <group>
      <pointLight color="#ffd2a2" distance={active ? 6.2 : 3.2} intensity={active ? 2.8 : 0.72} position={[0, lampY, 0.86]} />
      <mesh castShadow position={[0, lampY, 0.34]}>
        <boxGeometry args={[width * 0.74, 0.1, 0.14]} />
        <meshStandardMaterial color={active ? "#ffe0bd" : "#e7c9aa"} emissive="#ffc184" emissiveIntensity={active ? 0.9 : 0.36} roughness={0.55} />
      </mesh>
      <mesh position={[0, centerY + 0.02, 0.155]}>
        <planeGeometry args={[width * 0.88, height * 0.88]} />
        <meshBasicMaterial color="#ffd8a8" depthTest={false} depthWrite={false} opacity={glowOpacity} transparent />
      </mesh>
      <mesh position={[0, centerY - height * 0.02, 0.62]} rotation={[Math.PI / 2, 0, 0]} scale={[width * 0.52, height * 0.54, width * 0.52]}>
        <coneGeometry args={[1, 1, 32, 1, true]} />
        <meshBasicMaterial color="#ffd8a8" depthTest={false} depthWrite={false} opacity={coneOpacity} side={THREE.DoubleSide} transparent />
      </mesh>
    </group>
  );
}

function BoardFrame({ width, height, centerY, active }: { width: number; height: number; centerY: number; active: boolean }) {
  const color = active ? "#f1d9ce" : "#e7d1c8";
  return (
    <group>
      <mesh castShadow position={[0, centerY + height / 2 + 0.08, 0.16]}>
        <boxGeometry args={[width + 0.38, 0.18, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, centerY - height / 2 - 0.08, 0.16]}>
        <boxGeometry args={[width + 0.38, 0.18, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[-width / 2 - 0.1, width / 2 + 0.1].map((x) => (
        <mesh key={x} castShadow position={[x, centerY, 0.16]}>
          <boxGeometry args={[0.18, height + 0.36, 0.22]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function TouringSign({ centerY, height, width }: { centerY: number; height: number; width: number }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ead0b2";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#5d392c";
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.fillStyle = "#5d392c";
      ctx.font = "800 54px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("", canvas.width / 2, canvas.height / 2 + 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh castShadow position={[0, centerY + height / 2 - 0.42, 0.28]}>
      <boxGeometry args={[width * 0.74, 0.38, 0.04]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function stopAnd(event: ThreeEvent<PointerEvent>, callback: () => void) {
  event.stopPropagation();
  callback();
}

function Landmarks({ activeTargetId, isContactDialogOpen, labelsVisible, onInteractTarget, playerPosition }: Pick<SceneRootProps, "activeTargetId" | "isContactDialogOpen" | "labelsVisible" | "onInteractTarget" | "playerPosition">) {
  return (
    <group>
      <Circus active={activeTargetId === "cinema"} onInteract={() => onInteractTarget("cinema")} />
      <ContactBooth active={activeTargetId === "contact"} guideActive={activeTargetId === "guide:nika"} isDialogOpen={isContactDialogOpen} labelsVisible={labelsVisible} onGuideInteract={() => onInteractTarget("guide:nika")} onInteract={() => onInteractTarget("contact")} playerPosition={playerPosition} />
      <TinyRadio active={activeTargetId === "podcasts:radio"} onInteract={() => onInteractTarget("podcasts:radio")} />
      <Notebook active={activeTargetId === "tutorials:book"} onInteract={() => onInteractTarget("tutorials:book")} />
      <Fountain />
      <SocialSculptures activeTargetId={activeTargetId} labelsVisible={labelsVisible} onInteractTarget={onInteractTarget} />
    </group>
  );
}

function Circus({ active, onInteract }: { active: boolean; onInteract: () => void }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[0, 0, -3.8]}>
      <CylinderCollider args={[1.75, 3.55]} position={[0, 1.75, 0]} />
      <HighlightRing active={active} radius={4.2} />
      <group onPointerDown={(event) => stopAnd(event, onInteract)}>
        <Model highlighted={active} highlightIntensity={0.4} path={asset("/assets/models/landmarks/circus-tent.glb")} rotation={[0, Math.PI + Math.PI / 2, 0]} scale={7.4} />
      </group>
      <mesh castShadow position={[0, 5.95, 0]} rotation={[0, 0, -0.18]}>
        <coneGeometry args={[0.2, 0.68, 3]} />
        <meshStandardMaterial color="#b86258" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}

function ContactBooth({
  active,
  guideActive,
  isDialogOpen,
  labelsVisible,
  onGuideInteract,
  onInteract,
  playerPosition
}: {
  active: boolean;
  guideActive: boolean;
  isDialogOpen: boolean;
  labelsVisible: boolean;
  onGuideInteract: () => void;
  onInteract: () => void;
  playerPosition: Vec3;
}) {
  const guide = useRef<THREE.Group | null>(null);

  useFrame((_, delta) => {
    if (!guide.current) return;
    const target = isDialogOpen ? Math.atan2(-(playerPosition[0] - 6.9), -(playerPosition[2] - 9.2)) : Math.PI + 0.15;
    const diff = Math.atan2(Math.sin(target - guide.current.rotation.y), Math.cos(target - guide.current.rotation.y));
    guide.current.rotation.y += diff * (1 - Math.exp(-7 * delta));
  });

  return (
    <RigidBody type="fixed" colliders={false} position={[8.4, 0, 7]} rotation={[0, -0.68, 0]}>
      <CuboidCollider args={[1.24, 0.78, 1.85]} position={[0, 0.78, 0]} />
      <HighlightRing active={active} radius={2.05} />
      <group onPointerDown={(event) => stopAnd(event, onInteract)}>
        <Model highlighted={active} highlightIntensity={0.36} path={asset("/assets/models/landmarks/contact-booth.glb")} rotation={[0, Math.PI + Math.PI / 2, 0]} scale={3.9} />
      </group>
      <group ref={guide} position={[-1.3, 0.03, 2.2]} rotation={[0, Math.PI + 0.15, 0]} scale={1.75} onPointerDown={(event) => stopAnd(event, onGuideInteract)}>
        <HighlightRing active={guideActive} radius={0.82} />
        <Model highlighted={guideActive} highlightColor="#ffe0a8" highlightIntensity={0.5} path={asset("/assets/models/characters/booth-cat.glb")} rotation={[0, Math.PI / 2, 0]} />
      </group>
      {labelsVisible ? (
        <WorldLabel active={active} position={[0.2, 2.45, 0.2]}>
          COLLAB SHOP
        </WorldLabel>
      ) : null}
    </RigidBody>
  );
}

function TinyRadio({ active, onInteract }: { active: boolean; onInteract: () => void }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[11.35, 0, 8.55]} rotation={[0, -0.92, 0]}>
      <CuboidCollider args={[0.54, 0.36, 0.32]} position={[0, 0.36, 0]} />
      <HighlightRing active={active} radius={1.18} />
      <group onPointerDown={(event) => stopAnd(event, onInteract)}>
        <mesh castShadow position={[0, 0.44, 0]}>
          <boxGeometry args={[1.05, 0.64, 0.48]} />
          <meshStandardMaterial color={active ? "#eac7a7" : "#c99173"} emissive={active ? "#ad6b4e" : "#000000"} emissiveIntensity={active ? 0.18 : 0} roughness={0.78} />
        </mesh>
        <mesh castShadow position={[-0.28, 0.45, 0.255]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.035, 24]} />
          <meshStandardMaterial color="#55453d" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.24, 0.49, 0.255]}>
          <boxGeometry args={[0.32, 0.18, 0.04]} />
          <meshStandardMaterial color="#f2ddbb" emissive={active ? "#f2c87d" : "#000000"} emissiveIntensity={active ? 0.18 : 0} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function Notebook({ active, onInteract }: { active: boolean; onInteract: () => void }) {
  return (
    <RigidBody type="fixed" colliders={false} position={[-4.85, 0, -2.3]} rotation={[0, 0.58, 0]}>
      <CuboidCollider args={[0.8, 0.14, 0.52]} position={[0, 0.14, 0]} />
      <HighlightRing active={active} radius={1.2} />
      <group onPointerDown={(event) => stopAnd(event, onInteract)}>
        <mesh castShadow position={[-0.34, 0.18, 0]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[0.72, 0.08, 0.94]} />
          <meshStandardMaterial color={active ? "#f7e7c7" : "#eadbbf"} emissive={active ? "#d8ad70" : "#000000"} emissiveIntensity={active ? 0.08 : 0} roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0.34, 0.18, 0]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[0.72, 0.08, 0.94]} />
          <meshStandardMaterial color={active ? "#f5e2c3" : "#e5d0b0"} emissive={active ? "#d8ad70" : "#000000"} emissiveIntensity={active ? 0.08 : 0} roughness={0.82} />
        </mesh>
      </group>
    </RigidBody>
  );
}

function Fountain() {
  const drops = useRef<THREE.Points | null>(null);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);
  const waterDisc = useRef<THREE.Mesh | null>(null);
  const glow = useRef<THREE.Mesh | null>(null);
  const particleCount = 40960;
  const particleConfig = useMemo(() => {
    const originX = new Float32Array(particleCount);
    const originZ = new Float32Array(particleCount);
    const phase = new Float32Array(particleCount);
    const kind = new Uint8Array(particleCount);
    const life = new Float32Array(particleCount);
    const speed = new Float32Array(particleCount);
    const spread = new Float32Array(particleCount);
    const velocityX = new Float32Array(particleCount);
    const velocityY = new Float32Array(particleCount);
    const velocityZ = new Float32Array(particleCount);

    for (let index = 0; index < particleCount; index += 1) {
      const streamIndex = index % 16;
      const streamAngle = (streamIndex / 16) * Math.PI * 2;
      const jitterAngle = streamAngle + (seededRandom(index + 4.1) - 0.5) * 0.38;
      const typeRoll = seededRandom(index + 18.9);
      const particleKind = typeRoll > 0.82 ? 2 : typeRoll > 0.38 ? 1 : 0;
      const nozzleRadius = particleKind === 0 ? seededRandom(index + 9.2) * 0.045 : 0.09 + seededRandom(index + 7.4) * 0.11;
      const horizontalSpeed = particleKind === 0 ? 0.08 + seededRandom(index + 5.2) * 0.12 : particleKind === 1 ? 0.42 + seededRandom(index + 5.3) * 0.38 : 0.16 + seededRandom(index + 5.7) * 0.7;

      kind[index] = particleKind;
      originX[index] = Math.cos(streamAngle) * nozzleRadius;
      originZ[index] = Math.sin(streamAngle) * nozzleRadius;
      phase[index] = seededRandom(index + 2.2);
      speed[index] = particleKind === 2 ? 0.78 + seededRandom(index + 8.6) * 0.46 : 0.42 + seededRandom(index + 8.6) * 0.26;
      spread[index] = seededRandom(index + 12.4) * Math.PI * 2;
      velocityX[index] = Math.cos(jitterAngle) * horizontalSpeed;
      velocityY[index] = particleKind === 0 ? 1.92 + seededRandom(index + 1.4) * 0.55 : particleKind === 1 ? 1.1 + seededRandom(index + 1.4) * 0.45 : 0.26 + seededRandom(index + 1.4) * 0.38;
      velocityZ[index] = Math.sin(jitterAngle) * horizontalSpeed;
      life[index] =
        particleKind === 2
          ? 0.72
          : (velocityY[index] + Math.sqrt(velocityY[index] * velocityY[index] + 2 * 1.85 * (1.34 - 0.74))) / 1.85;
    }

    return { kind, life, originX, originZ, phase, speed, spread, velocityX, velocityY, velocityZ };
  }, []);
  const positions = useMemo(() => {
    const data = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      data[index * 3] = particleConfig.originX[index];
      data[index * 3 + 1] = particleConfig.kind[index] === 2 ? 0.88 : 1.42;
      data[index * 3 + 2] = particleConfig.originZ[index];
    }
    return data;
  }, [particleConfig]);
  const colors = useMemo(() => {
    const data = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      const mist = particleConfig.kind[index] === 2;
      data[offset] = mist ? 0.78 : 0.9;
      data[offset + 1] = mist ? 0.96 : 1;
      data[offset + 2] = 1;
    }
    return data;
  }, [particleConfig]);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    const points = drops.current;
    if (points) {
      const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
      const array = attr.array as Float32Array;
      const gravity = 1.85;
      const windX = Math.sin(elapsed * 0.37) * 0.045;
      const windZ = Math.cos(elapsed * 0.31) * 0.035;
      for (let index = 0; index < particleCount; index += 1) {
        const offset = index * 3;
        const particleKind = particleConfig.kind[index];
        const life = particleConfig.life[index];
        const age = (elapsed * particleConfig.speed[index] + particleConfig.phase[index]) % 1;
        const t = age * life;
        const splashCycle = particleKind === 2 ? Math.sin(age * Math.PI) : 0;
        const turbulence = Math.sin(elapsed * 2.4 + particleConfig.spread[index]) * (particleKind === 0 ? 0.012 : 0.028);
        const y = particleKind === 2 ? 0.78 + splashCycle * 0.42 : 1.34 + particleConfig.velocityY[index] * t - 0.5 * gravity * t * t;

        array[offset] = particleConfig.originX[index] + particleConfig.velocityX[index] * t + windX * t + turbulence;
        array[offset + 1] = y;
        array[offset + 2] = particleConfig.originZ[index] + particleConfig.velocityZ[index] * t + windZ * t - turbulence * 0.45;
      }
      attr.needsUpdate = true;
    }
    ripples.current.forEach((mesh, index) => {
      if (!mesh) return;
      const cycle = (elapsed * 0.48 + index * 0.2) % 1;
      mesh.scale.setScalar(0.5 + cycle * 1.9);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = (1 - cycle) * 0.26;
    });
    if (waterDisc.current) {
      waterDisc.current.rotation.z = elapsed * 0.06;
      const material = waterDisc.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.26 + Math.sin(elapsed * 1.6) * 0.045;
    }
    if (glow.current) {
      glow.current.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.08);
      const material = glow.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.14 + Math.sin(elapsed * 1.3) * 0.04;
    }
  });

  return (
    <RigidBody type="fixed" colliders={false} position={[-6.2, 0, 7.7]}>
      <CylinderCollider args={[0.52, 1.5]} position={[0, 0.52, 0]} />
      <Model path={asset("/assets/models/landmarks/fountain.glb")} scale={3.5} />
      <mesh ref={waterDisc} position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.82, 48]} />
        <meshBasicMaterial color="#bfeee9" depthWrite={false} opacity={0.28} transparent />
      </mesh>
      <mesh ref={glow} position={[0, 0.735, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 48]} />
        <meshBasicMaterial color="#f5fff5" blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.16} transparent />
      </mesh>
      <mesh position={[0, 2.08, 0]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshStandardMaterial color="#e5fbf6" emissive="#8fd4ca" emissiveIntensity={0.7} roughness={0.35} />
      </mesh>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={`stream-${index}`} position={[0, 1.47, 0]} rotation={[0.68, (index / 4) * Math.PI * 2, 0]}>
          <cylinderGeometry args={[0.012, 0.026, 1.08, 8]} />
          <meshBasicMaterial color="#dff8f4" depthWrite={false} opacity={0.28} transparent />
        </mesh>
      ))}
      <points ref={drops} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial depthWrite={false} opacity={0.34} size={0.016} transparent vertexColors />
      </points>
      {[0, 1, 2, 3, 4].map((index) => (
        <mesh key={index} ref={(node) => (ripples.current[index] = node)} position={[0, 0.66 + index * 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.36, 0.405, 56]} />
          <meshBasicMaterial color="#d9fff8" depthWrite={false} opacity={0.2} transparent />
        </mesh>
      ))}
    </RigidBody>
  );
}

function SocialSculptures({ activeTargetId, labelsVisible, onInteractTarget }: Pick<SceneRootProps, "activeTargetId" | "labelsVisible" | "onInteractTarget">) {
  const modelPaths: Record<string, string> = {
    "social:github": asset("/assets/models/landmarks/statue-即刻.glb")
  };

  return (
    <group>
      {socialTargets.map((target) => {
        const active = activeTargetId === target.id;
        return (
          <RigidBody key={target.id} type="fixed" colliders={false} position={target.position}>
            <CuboidCollider args={[0.58, 0.76, 0.52]} position={[0, 0.76, 0]} />
            <HighlightRing active={active} radius={1.25} />
            <group onPointerDown={(event) => stopAnd(event, () => onInteractTarget(target.id))}>
              <Model highlighted={active} highlightIntensity={0.42} path={modelPaths[target.id]} position={[0, 0.02, 0]} rotation={[0, Math.PI + Math.PI / 2, 0]} scale={1.35} />
            </group>
            {labelsVisible ? (
              <WorldLabel active={active} className="social" position={[0, 1.28, 0]}>
                {target.label}
              </WorldLabel>
            ) : null}
          </RigidBody>
        );
      })}
    </group>
  );
}

function MemorySculptures({ activeTargetId, onInteractTarget }: Pick<SceneRootProps, "activeTargetId" | "onInteractTarget">) {
  const colors = ["#b98f75", "#9aa88c", "#c7a96e", "#a68fba", "#86a9ad", "#c9909a"];
  return (
    <group>
      {sculptures.map((item, index) => {
        const active = activeTargetId === item.targetId;
        return (
          <RigidBody key={item.targetId} type="fixed" colliders={false} position={item.position} rotation={[0, item.rotationY, 0]}>
            <CylinderCollider args={[0.46, 0.62]} position={[0, 0.46, 0]} />
            <group onPointerDown={(event) => stopAnd(event, () => onInteractTarget(item.targetId))}>
              <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
                <cylinderGeometry args={[0.66, 0.74, 0.24, 8]} />
                <meshStandardMaterial color={active ? "#ead2bd" : "#d8c1ad"} roughness={0.9} />
              </mesh>
              <mesh castShadow position={[0, 0.42, 0]} rotation={[0.1, index * 0.35, -0.08]}>
                <dodecahedronGeometry args={[0.34, 0]} />
                <meshStandardMaterial color={colors[index % colors.length]} emissive={active ? colors[index % colors.length] : "#000000"} emissiveIntensity={active ? 0.22 : 0} roughness={0.88} />
              </mesh>
              <mesh castShadow position={[0, 0.8, 0]} rotation={[0, index * 0.5, 0]}>
                <coneGeometry args={[0.28, 0.5, 5]} />
                <meshStandardMaterial color={active ? "#f0d79c" : "#cfa96c"} emissive={active ? "#d6a85d" : "#000000"} emissiveIntensity={active ? 0.18 : 0} roughness={0.82} />
              </mesh>
              <LetterPlate code={item.code} active={active} />
            </group>
          </RigidBody>
        );
      })}
    </group>
  );
}

function LetterPlate({ active, code }: { active: boolean; code: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 168;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      roundedRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 26);
      ctx.fillStyle = active ? "#fff1d0" : "#efe1ca";
      ctx.fill();
      ctx.strokeStyle = active ? "#9b5d58" : "#775f50";
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = "#45382f";
      ctx.font = "900 92px Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(code, canvas.width / 2, canvas.height / 2 + 3);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [active, code]);

  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <mesh position={[0, 0.36, 0.66]} rotation={[-0.22, 0, 0]}>
      <planeGeometry args={[0.52, 0.34]} />
      <meshBasicMaterial depthTest map={texture} toneMapped={false} transparent />
    </mesh>
  );
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function SkyBackdrop() {
  const mountain = useTexture(asset("/assets/models/environment/mountain.png"));
  const cloudPaths = [1, 2, 3, 4, 5, 6].map((index) => asset(`/assets/models/environment/cloud${index}.png`));
  const clouds = useTexture(cloudPaths);
  const cloudGroup = useRef<THREE.Group | null>(null);

  useEffect(() => {
    for (const texture of [mountain, ...asArray(clouds)]) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    }
  }, [clouds, mountain]);

  useFrame((state) => {
    if (cloudGroup.current) cloudGroup.current.position.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.7;
  });

  const mountains = [
    [-23, 4.8, -43, 0, 7],
    [18, 5.2, -45, 0, 7.6],
    [-18, 4.9, 43, Math.PI, 7.2],
    [24, 5.1, 45, Math.PI, 7.4],
    [-43, 5, -18, Math.PI / 2, 7.2],
    [43, 4.9, -22, -Math.PI / 2, 7.1]
  ];

  return (
    <group>
      <mesh receiveShadow position={[0, -0.1, -20]} rotation={[-Math.PI / 2, 0, -0.06]}>
        <circleGeometry args={[13, 14]} />
        <meshStandardMaterial color="#8bc4cd" roughness={0.35} metalness={0.02} />
      </mesh>
      {mountains.map(([x, y, z, rotationY, height]) => (
        <mesh key={`${x}-${z}`} position={[x, y, z]} rotation={[0, rotationY, 0]} scale={[height * 5.299, height, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial alphaTest={0.08} depthWrite={false} map={mountain} side={THREE.DoubleSide} toneMapped={false} transparent />
        </mesh>
      ))}
      <group ref={cloudGroup}>
        {[
          [-20, 11.4, -31, 0, 8.6, 3.2, 0],
          [8, 13.2, -36, 0, 7.4, 2.8, 1],
          [27, 12.4, -33, 0, 8.1, 3, 2],
          [-18, 13.4, 33, Math.PI, 7.8, 2.9, 3],
          [16, 14.2, 36, Math.PI, 8.4, 3.1, 4],
          [31, 12.4, 25, -Math.PI / 2, 7.8, 2.95, 5]
        ].map(([x, y, z, rotationY, width, height, textureIndex]) => (
          <mesh key={`${x}-${z}`} position={[x, y, z]} rotation={[0, rotationY, 0]} scale={[width, height, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial alphaTest={0.04} depthWrite={false} map={asArray(clouds)[textureIndex]} opacity={0.88} side={THREE.DoubleSide} toneMapped={false} transparent />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function SceneContents(props: SceneRootProps) {
  const playerPositionRef = useRef(new THREE.Vector3(...props.playerPosition));

  useEffect(() => {
    playerPositionRef.current.set(...props.playerPosition);
  }, [props.playerPosition]);

  return (
    <>
      <Weather />
      <Physics colliders={false} gravity={[0, -18, 0]} timeStep="vary">
        <Player disabled={props.controlsDisabled} mobileInputRef={props.mobileInputRef} onMove={props.onPlayerMove} playerPositionRef={playerPositionRef} />
        <PlazaGround />
        <Vegetation />
        <Landmarks activeTargetId={props.activeTargetId} isContactDialogOpen={props.isContactDialogOpen} labelsVisible={props.labelsVisible} onInteractTarget={props.onInteractTarget} playerPosition={props.playerPosition} />
        <WorkBoards activeTargetId={props.activeTargetId} labelsVisible={props.labelsVisible} onInteractTarget={props.onInteractTarget} />
        <MemorySculptures activeTargetId={props.activeTargetId} onInteractTarget={props.onInteractTarget} />
        <SkyBackdrop />
      </Physics>
    </>
  );
}

export default function SceneRoot(props: SceneRootProps) {
  return (
    <Canvas camera={{ position: [0, 6.5, 14], fov: 45, near: 0.1, far: 95 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: "high-performance" }} shadows>
      <Suspense fallback={null}>
        <SceneContents {...props} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(asset("/assets/models/landmarks/circus-tent.glb"));
useGLTF.preload(asset("/assets/models/landmarks/contact-booth.glb"));
useGLTF.preload(asset("/assets/models/landmarks/fountain.glb"));
useGLTF.preload(asset("/assets/models/landmarks/statue-即刻.glb"));
useGLTF.preload(asset("/assets/models/characters/cape-cat.glb"));
useGLTF.preload(asset("/assets/models/characters/booth-cat.glb"));
