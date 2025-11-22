import React, { useRef, useEffect } from 'react';
import { Entity, GamePhase, Vector } from '../types';
import { 
  WORLD_SIZE, 
  INITIAL_PLAYER_RADIUS, 
  FOOD_COUNT, 
  BOT_COUNT, 
  FOOD_COLORS, 
  COLORS,
  MIN_FOOD_RADIUS,
  MAX_FOOD_RADIUS,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  VIRUS_COUNT,
  VIRUS_RADIUS
} from '../constants';
import { getRandomPos, randomColor, checkEatingCollision, getDistance, clamp } from '../utils/math';

interface GameCanvasProps {
  playerName: string;
  onScoreUpdate: (score: number, mass: number, threats: number) => void;
  onGameOver: (finalScore: number) => void;
  gameStatePhase: GamePhase;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ playerName, onScoreUpdate, onGameOver, gameStatePhase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State held in refs to avoid re-renders during 60fps loop
  const playerRef = useRef<Entity>({
    id: 'player',
    x: WORLD_SIZE / 2,
    y: WORLD_SIZE / 2,
    radius: INITIAL_PLAYER_RADIUS,
    color: '#22d3ee', // Cyan
    name: playerName,
    speed: 0
  });

  const entitiesRef = useRef<Entity[]>([]);
  const mouseRef = useRef<Vector>({ x: 0, y: 0 });
  const cameraRef = useRef<{ x: number, y: number, scale: number }>({ 
    x: WORLD_SIZE / 2, 
    y: WORLD_SIZE / 2, 
    scale: 1 
  });

  // Initialize World
  useEffect(() => {
    if (gameStatePhase === GamePhase.PLAYING) {
      initWorld();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatePhase]);

  const initWorld = () => {
    const foods: Entity[] = Array.from({ length: FOOD_COUNT }).map((_, i) => ({
      id: `food-${i}`,
      x: getRandomPos(WORLD_SIZE),
      y: getRandomPos(WORLD_SIZE),
      radius: Math.random() * (MAX_FOOD_RADIUS - MIN_FOOD_RADIUS) + MIN_FOOD_RADIUS,
      color: randomColor(FOOD_COLORS),
      isFood: true
    }));

    const bots: Entity[] = Array.from({ length: BOT_COUNT }).map((_, i) => ({
      id: `bot-${i}`,
      x: getRandomPos(WORLD_SIZE),
      y: getRandomPos(WORLD_SIZE),
      radius: Math.random() * 30 + 20,
      color: randomColor(COLORS),
      name: `Bot ${i+1}`,
      speed: 0,
      target: { x: getRandomPos(WORLD_SIZE), y: getRandomPos(WORLD_SIZE) }
    }));

    const viruses: Entity[] = Array.from({ length: VIRUS_COUNT }).map((_, i) => ({
        id: `virus-${i}`,
        x: getRandomPos(WORLD_SIZE),
        y: getRandomPos(WORLD_SIZE),
        radius: Math.random() * 10 + (VIRUS_RADIUS * 0.8), // Slightly varied size
        color: '#33ff00', // Bright green
        isVirus: true,
    }));

    entitiesRef.current = [...foods, ...bots, ...viruses];
    
    // Reset Player
    playerRef.current = {
      id: 'player',
      x: getRandomPos(WORLD_SIZE),
      y: getRandomPos(WORLD_SIZE),
      radius: INITIAL_PLAYER_RADIUS,
      color: '#22d3ee',
      name: playerName,
    };
  };

  // Main Game Loop
  const update = () => {
    if (gameStatePhase !== GamePhase.PLAYING) return;

    const player = playerRef.current;
    const entities = entitiesRef.current;

    // --- Player Movement ---
    // Calculate target based on mouse position relative to screen center
    // Screen center is always where the player is *visually* in the viewport
    // but logic-wise we use camera
    const dx = mouseRef.current.x - window.innerWidth / 2;
    const dy = mouseRef.current.y - window.innerHeight / 2;
    
    const angle = Math.atan2(dy, dx);
    
    // Speed inversely proportional to size (mass)
    // Bigger = Slower. 
    const maxSpeed = 6 * Math.pow(player.radius / 20, -0.4); 
    
    // Move if mouse is far enough from center (deadzone)
    const distToMouse = Math.hypot(dx, dy);
    const speed = distToMouse < 20 ? 0 : maxSpeed;

    player.x += Math.cos(angle) * speed;
    player.y += Math.sin(angle) * speed;

    // Clamp to world bounds
    player.x = clamp(player.x, player.radius, WORLD_SIZE - player.radius);
    player.y = clamp(player.y, player.radius, WORLD_SIZE - player.radius);

    // --- Bot AI & Movement ---
    entities.forEach(entity => {
      if (entity.isFood || entity.isVirus) return;

      // Simple AI: Move randomly or towards food
      if (!entity.target || Math.random() < 0.02) {
         entity.target = { x: getRandomPos(WORLD_SIZE), y: getRandomPos(WORLD_SIZE) };
      }

      const bDx = entity.target.x - entity.x;
      const bDy = entity.target.y - entity.y;
      const bAngle = Math.atan2(bDy, bDx);
      const bSpeed = 6 * Math.pow(entity.radius / 20, -0.4);

      entity.x += Math.cos(bAngle) * bSpeed;
      entity.y += Math.sin(bAngle) * bSpeed;
      
      entity.x = clamp(entity.x, entity.radius, WORLD_SIZE - entity.radius);
      entity.y = clamp(entity.y, entity.radius, WORLD_SIZE - entity.radius);
    });

    // --- Collision & Eating ---
    let eatenCount = 0;
    let nearbyThreats = 0;

    // 1. Check Player vs Entities
    for (let i = entities.length - 1; i >= 0; i--) {
      const entity = entities[i];
      
      // Check if player eats entity
      // FIX: player is the eater (1st arg), entity is the food (2nd arg)
      if (checkEatingCollision(player.x, player.y, player.radius, entity.x, entity.y, entity.radius)) {
         if (entity.isVirus) {
            // Virus mechanic: Pop the player (reduce size significantly for simplicity in this demo)
            player.radius = Math.max(INITIAL_PLAYER_RADIUS, player.radius / 2);
            // Respawn virus
            entities[i] = {
                ...entity,
                x: getRandomPos(WORLD_SIZE),
                y: getRandomPos(WORLD_SIZE)
            };
         } else {
            // Gain Mass (Area based, so radius increases with square root of area added)
            // NewArea = CurrentArea + EatenArea
            // PI*Rnew^2 = PI*Rold^2 + PI*Reaten^2
            const newArea = Math.PI * player.radius * player.radius + Math.PI * entity.radius * entity.radius;
            player.radius = Math.sqrt(newArea / Math.PI);
            
            // Respawn entity
            if (entity.isFood) {
              entities[i] = {
                 ...entity,
                 x: getRandomPos(WORLD_SIZE),
                 y: getRandomPos(WORLD_SIZE)
              };
            } else {
              // Bot eaten
               entities[i] = {
                 ...entity,
                 x: getRandomPos(WORLD_SIZE),
                 y: getRandomPos(WORLD_SIZE),
                 radius: Math.random() * 30 + 20,
              };
            }
         }
         eatenCount++;
      } 
      // Check if Entity eats Player
      // FIX: entity is the eater (1st arg), player is the food (2nd arg)
      else if (!entity.isFood && !entity.isVirus && checkEatingCollision(entity.x, entity.y, entity.radius, player.x, player.y, player.radius)) {
         onGameOver(Math.floor(player.radius));
         return; // Stop update loop
      }
      
      // Count threats for AI Advisor
      if (!entity.isFood && !entity.isVirus && entity.radius > player.radius * 1.1) {
         if (getDistance(player as Vector, entity as Vector) < 500) {
            nearbyThreats++;
         }
      }
    }

    // 2. Check Bot vs Food/Bot (Simplified: Bots just eat food for now to keep perf high)
    entities.forEach((bot) => {
        if (bot.isFood || bot.isVirus) return;
        // Simple check against food for bots
        // O(N^2) is too slow, so bots only check for food they stumble upon
        // (Collision is handled in rendering logic or optimized spatial hash in real production)
        // For this demo, we skip bot-vs-bot to save CPU for smooth rendering
    });

    // --- Camera Update ---
    // Smooth lerp camera to player
    cameraRef.current.x += (player.x - cameraRef.current.x) * 0.1;
    cameraRef.current.y += (player.y - cameraRef.current.y) * 0.1;
    
    // Zoom out as player grows
    // Base scale 1.0 at radius 20. Scale 0.5 at radius 100?
    const targetScale = 20 / (player.radius + 40) + 0.3; 
    cameraRef.current.scale += (targetScale - cameraRef.current.scale) * 0.05;

    // --- Sync to React UI ---
    if (Math.random() < 0.05) { // throttling updates
       onScoreUpdate(Math.floor(player.radius), Math.floor(player.radius), nearbyThreats);
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const cam = cameraRef.current;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    
    // Center camera
    ctx.translate(width / 2, height / 2);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.x, -cam.y);

    // Draw World Bounds
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Draw Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const gridSize = 100;
    // Optimize grid drawing: only draw visible grid lines
    const startX = Math.floor((cam.x - (width/2)/cam.scale) / gridSize) * gridSize;
    const endX = Math.floor((cam.x + (width/2)/cam.scale) / gridSize) * gridSize + gridSize;
    const startY = Math.floor((cam.y - (height/2)/cam.scale) / gridSize) * gridSize;
    const endY = Math.floor((cam.y + (height/2)/cam.scale) / gridSize) * gridSize + gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      if(x < 0 || x > WORLD_SIZE) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_SIZE);
    }
    for (let y = startY; y <= endY; y += gridSize) {
      if(y < 0 || y > WORLD_SIZE) continue;
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_SIZE, y);
    }
    ctx.stroke();

    // Draw Entities (Sorted by size so small stuff is under big stuff)
    // Filter entities outside viewport for performance
    const visibleEntities = entitiesRef.current.filter(e => {
       return Math.abs(e.x - cam.x) < (width/cam.scale/2 + e.radius) &&
              Math.abs(e.y - cam.y) < (height/cam.scale/2 + e.radius);
    });

    // Add player to list to sort correctly
    const allToDraw = [...visibleEntities, playerRef.current].sort((a, b) => a.radius - b.radius);

    allToDraw.forEach(e => {
      ctx.beginPath();
      
      if (e.isVirus) {
          // Spiky circle for virus
          ctx.fillStyle = e.color;
          const spikes = 20;
          const outerRadius = e.radius;
          const innerRadius = e.radius * 0.8;
          
          for(let i=0; i<spikes*2; i++){
            const r = (i%2 === 0) ? outerRadius : innerRadius;
            const a = (Math.PI * i) / spikes;
            const x = e.x + Math.cos(a) * r;
            const y = e.y + Math.sin(a) * r;
            if(i===0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#bbf7d0';
          ctx.lineWidth = 3;
          ctx.stroke();
      } else {
          // Standard circle
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fillStyle = e.color;
          ctx.fill();
          
          if (!e.isFood) {
            // Border
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = Math.max(2, e.radius * 0.05);
            ctx.stroke();

            // Name
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(10, e.radius * 0.4)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(e.name || '', e.x, e.y);
          }
      }
    });

    ctx.restore();
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle Mouse Move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
        if(e.touches[0]) {
            mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // Start Loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  });

  return <canvas ref={canvasRef} className="block touch-none cursor-crosshair" />;
};

export default GameCanvas;