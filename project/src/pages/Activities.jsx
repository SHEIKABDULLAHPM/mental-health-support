/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Heart } from 'lucide-react';
import { gamesAPI } from '../services/api';

const Activities = () => {
  const [activeActivity, setActiveActivity] = useState(null);

  const activities = [
    {
      id: 'breathing',
      title: 'Breathing Exercises',
      description: 'Guided breathing techniques for relaxation and focus',
      icon: '🫁',
      color: 'from-blue-400 to-cyan-500',
      component: 'BreathingExercise'
    },
    {
      id: 'coloring',
      title: 'Mindful Coloring',
      description: 'Digital coloring pages for stress relief and creativity',
      icon: '🎨',
      color: 'from-purple-400 to-pink-500',
      component: 'ColoringActivity'
    },
    {
      id: 'meditation',
      title: 'Mini Meditations',
      description: '3-5 minute guided meditation sessions',
      icon: '🧘‍♀️',
      color: 'from-green-400 to-emerald-500',
      component: 'MeditationActivity'
    },
    {
      id: 'games',
      title: 'Calming Games',
      description: 'Simple, relaxing mini-games for mental wellness',
      icon: '🎮',
      color: 'from-yellow-400 to-orange-500',
      component: 'MiniGames'
    }
  ];

  const ActivityComponent = ({ activity }) => {
    switch (activity.component) {
      case 'BreathingExercise':
        return <BreathingExercise />;
      case 'ColoringActivity':
        return <ColoringActivity />;
      case 'MeditationActivity':
        return <MeditationActivity />;
      case 'MiniGames':
        return <MiniGames />;
      default:
        return <div>Activity not found</div>;
    }
  };

  if (activeActivity) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveActivity(null)}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span>← Back to Activities</span>
          </button>
        </div>
        <ActivityComponent activity={activeActivity} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mindful Activities 🧘‍♀️
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Interactive exercises to help you relax, focus, and find inner peace
        </p>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activities.map((activity) => (
          <div
            key={activity.id}
            onClick={() => setActiveActivity(activity)}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
          >
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${activity.color} flex items-center justify-center text-3xl mb-6 mx-auto`}>
              {activity.icon}
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {activity.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {activity.description}
              </p>
              <div className={`inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${activity.color} text-white rounded-xl font-medium hover:scale-105 transition-transform duration-300`}>
                <Play className="w-4 h-4" />
                <span>Start Activity</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily Challenge */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            ⭐
          </div>
          <h3 className="text-2xl font-bold mb-3">Today&apos;s Mindfulness Challenge</h3>
          <p className="text-indigo-100 mb-6 text-lg">
            Take 5 deep breaths and notice 3 things you can see, 2 things you can hear, and 1 thing you can feel
          </p>
          <button className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors">
            Accept Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

// Breathing Exercise Component
const BreathingExercise = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('inhale'); // inhale, hold, exhale
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);

  const exercises = [
    {
      name: '4-7-8 Breathing',
      inhale: 4,
      hold: 7,
      exhale: 8,
      hold2: 0,
      description: 'Calming technique for stress relief'
    },
    {
      name: 'Box Breathing (4-4-4-4)',
      inhale: 4,
      hold: 4,
      exhale: 4,
      hold2: 4,
      description: 'Equal inhale, hold, exhale, and hold for balance and focus'
    },
    {
      name: 'Simple Deep Breathing',
      inhale: 6,
      hold: 0,
      exhale: 6,
      hold2: 0,
      description: 'Basic relaxation technique'
    }
  ];

  const [selectedExercise, setSelectedExercise] = useState(exercises[0]);

  // Timer logic for breathing phases
  useEffect(() => {
    if (!isActive) return;

    const id = setInterval(() => {
      setCount((c) => {
        if (c > 1) return c - 1;

        // Transition to next phase
        if (phase === 'inhale') {
          if (selectedExercise.hold > 0) {
            setPhase('hold');
            return selectedExercise.hold;
          } else {
            setPhase('exhale');
            return selectedExercise.exhale;
          }
        } else if (phase === 'hold') {
          setPhase('exhale');
          return selectedExercise.exhale;
        } else if (phase === 'exhale') {
          // For box breathing, add a post-exhale hold (hold2)
          if (selectedExercise.hold2 && selectedExercise.hold2 > 0) {
            setPhase('hold2');
            return selectedExercise.hold2;
          }
          // Completed one cycle
          setCycle((cy) => {
            const next = cy + 1;
            if (next >= 10) {
              // stop after 10 cycles
              setIsActive(false);
            }
            return next;
          });
          setPhase('inhale');
          return selectedExercise.inhale;
        } else if (phase === 'hold2') {
          // Completed one full box cycle
          setCycle((cy) => {
            const next = cy + 1;
            if (next >= 10) {
              setIsActive(false);
            }
            return next;
          });
          setPhase('inhale');
          return selectedExercise.inhale;
        }
        return c;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isActive, phase, selectedExercise]);

  // Reset counts when switching exercise
  useEffect(() => {
    setIsActive(false);
    setPhase('inhale');
    setCount(selectedExercise.inhale);
    setCycle(0);
  }, [selectedExercise]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Breathing Exercises
      </h2>

      {/* Exercise Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Your Exercise</h3>
        <div className="grid gap-4">
          {exercises.map((exercise, index) => (
            <button
              key={index}
              onClick={() => setSelectedExercise(exercise)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                selectedExercise.name === exercise.name
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white">{exercise.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{exercise.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Breathing Circle */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center transition-all duration-1000 ${
            isActive && phase === 'inhale' ? 'scale-125' : isActive && phase === 'exhale' ? 'scale-75' : 'scale-100'
          }`}>
            <div className="text-white text-center">
              <div className="text-3xl font-bold mb-2">{count}</div>
              <div className="text-lg capitalize">{(phase === 'hold' || phase === 'hold2') ? 'Hold' : phase}</div>
            </div>
          </div>
        </div>
        <div className="mt-4 text-gray-600 dark:text-gray-300">
          Cycle: {cycle}/10
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
            isActive
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{isActive ? 'Pause' : 'Start'}</span>
        </button>
        <button
          onClick={() => {
            setIsActive(false);
            setPhase('inhale');
            setCount(selectedExercise.inhale);
            setCycle(0);
          }}
          className="flex items-center space-x-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

// Coloring Activity Component
const ColoringActivity = () => {
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [cells, setCells] = useState(() => Array.from({ length: 16 * 12 }, () => '#ffffff'));
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [brushSize, setBrushSize] = useState(1); // 1, 2, 3
  const [isEraser, setIsEraser] = useState(false);
  const [mode, setMode] = useState('illustration'); // 'illustration' | 'pixel'
  const [regionColors, setRegionColors] = useState({}); // { [regionId]: color }
  const [hoveredId, setHoveredId] = useState(null);

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Paint with brush size (centered square around target cell)
  const paint = (idx) => {
    const cols = 16;
    const total = 16 * 12;
    const rows = Math.floor(total / cols);
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const size = Math.max(1, Math.min(3, brushSize));
    // Compute start so that odd sizes center on the cell, even sizes paint an exact SxS block around it
    const startRow = row - Math.floor((size - 1) / 2);
    const startCol = col - Math.floor((size - 1) / 2);
    const paintColor = isEraser ? '#ffffff' : selectedColor;

    setCells((prev) => {
      const next = [...prev];
      for (let r = startRow; r < startRow + size; r++) {
        for (let c2 = startCol; c2 < startCol + size; c2++) {
          if (r < 0 || c2 < 0) continue;
          if (r >= rows || c2 >= cols) continue;
          const i = r * cols + c2;
          next[i] = paintColor;
        }
      }
      return next;
    });
  };

  const clearCanvas = () => setCells(Array.from({ length: 16 * 12 }, () => '#ffffff'));
  const clearIllustration = () => setRegionColors({});

  const paintRegion = (id, color) => {
    setRegionColors((prev) => ({ ...prev, [id]: color }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Mindful Coloring
      </h2>

      {/* Mode Toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setMode('illustration')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            mode === 'illustration'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600'
          }`}
        >
          Illustration
        </button>
        <button
          onClick={() => setMode('pixel')}
          className={`px-4 py-2 rounded-lg text-sm font-medium border ${
            mode === 'pixel'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600'
          }`}
        >
          Pixel Grid
        </button>
      </div>

      {/* Color Palette */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Choose Your Color</h3>
        <div className="flex flex-wrap gap-3 items-center">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => { setSelectedColor(color); setIsEraser(false); }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', color);
                // Provide a small drag image by cloning
                const dragEl = document.createElement('div');
                dragEl.style.width = '16px';
                dragEl.style.height = '16px';
                dragEl.style.borderRadius = '9999px';
                dragEl.style.background = color;
                document.body.appendChild(dragEl);
                e.dataTransfer.setDragImage(dragEl, 8, 8);
                setTimeout(() => document.body.removeChild(dragEl), 0);
              }}
              className={`w-10 h-10 rounded-full border-4 transition-all duration-300 ${
                selectedColor === color && !isEraser ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              title={`${color} (drag me)`}
            />
          ))}

          {/* Eraser */}
          <button
            onClick={() => setIsEraser((v) => !v)}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', '#ffffff')}
            className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
              isEraser ? 'border-gray-900 dark:border-white scale-110' : 'border-gray-300 dark:border-gray-600'
            }`}
            style={{ backgroundColor: '#ffffff' }}
            title="Eraser (drag or click to toggle)"
          >
            🧽
          </button>

          {/* Brush size (pixel mode only) */}
          {mode === 'pixel' && (
            <div className="ml-4 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <span>Brush:</span>
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                    brushSize === s ? 'bg-gray-200 dark:bg-gray-700 border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={`Brush size ${s}`}
                >
                  {s}x{s}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={clearCanvas}
            className="ml-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Clear
          </button>
          {mode === 'illustration' && (
            <button
              onClick={clearIllustration}
              className="ml-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset Illustration
            </button>
          )}
        </div>
      </div>

      {/* Coloring Canvas */}
      {mode === 'pixel' ? (
        <div
          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6 select-none overflow-x-auto"
          onMouseLeave={() => setIsMouseDown(false)}
          onMouseUp={() => setIsMouseDown(false)}
          onDragOver={(e) => e.preventDefault()}
        >
          <div
            className="grid gap-1 w-fit mx-auto justify-items-center items-center"
            style={{ gridTemplateColumns: 'repeat(16, 1.5rem)', gridAutoRows: '1.5rem' }}
          >
            {cells.map((c, idx) => (
              <button
                key={idx}
                onMouseDown={(e) => { e.preventDefault(); setIsMouseDown(true); paint(idx); }}
                onMouseEnter={() => { if (isMouseDown) paint(idx); }}
                onClick={() => paint(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const droppedColor = e.dataTransfer.getData('text/plain') || selectedColor;
                  const colorToUse = droppedColor || selectedColor;
                  // Temporarily paint using dropped color ignoring eraser
                  const prevBrush = brushSize;
                  const prevEraser = isEraser;
                  setIsEraser(false);
                  // Paint with a one-off color by bypassing selectedColor
                  const cols = 16;
                  const total = 16 * 12;
                  const rows = Math.floor(total / cols);
                  const row = Math.floor(idx / cols);
                  const col = idx % cols;
                  const size = Math.max(1, Math.min(3, prevBrush));
                  const startRow = row - Math.floor((size - 1) / 2);
                  const startCol = col - Math.floor((size - 1) / 2);
                  setCells((p) => {
                    const next = [...p];
                    for (let r = startRow; r < startRow + size; r++) {
                      for (let c2 = startCol; c2 < startCol + size; c2++) {
                        if (r < 0 || c2 < 0) continue;
                        if (r >= rows || c2 >= cols) continue;
                        const i = r * cols + c2;
                        next[i] = colorToUse;
                      }
                    }
                    return next;
                  });
                  // restore eraser state
                  setIsEraser(prevEraser);
                }}
                className="w-6 h-6 rounded-sm border border-gray-200 dark:border-gray-600 box-border"
                style={{ backgroundColor: c }}
                aria-label={`cell ${idx}`}
              />)
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6 overflow-hidden">
          <div className="w-full flex justify-center">
            <svg
              viewBox="0 0 400 300"
              role="img"
              aria-label="Whimsical garden illustration to color"
              className="w-full max-w-3xl h-auto cursor-crosshair"
              onDragOver={(e) => e.preventDefault()}
            >
              {/* Grass */}
              <rect
                x="0" y="240" width="400" height="60"
                fill={regionColors.grass || '#ffffff'}
                stroke={hoveredId === 'grass' ? '#6366F1' : '#94a3b8'}
                strokeWidth={hoveredId === 'grass' ? 2.5 : 1}
                onMouseEnter={() => setHoveredId('grass')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('grass', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('grass', c); }}
              />

              {/* Sun */}
              <circle
                cx="340" cy="50" r="25"
                fill={regionColors.sun || '#ffffff'}
                stroke={hoveredId === 'sun' ? '#f59e0b' : '#94a3b8'}
                strokeWidth={hoveredId === 'sun' ? 3 : 1}
                onMouseEnter={() => setHoveredId('sun')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('sun', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('sun', c); }}
                style={{ transition: 'fill .2s ease' }}
              />

              {/* Clouds */}
              <g
                onMouseEnter={() => setHoveredId('cloud1')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('cloud1', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('cloud1', c); }}
              >
                <ellipse cx="80" cy="60" rx="28" ry="18" fill={regionColors.cloud1 || '#ffffff'} stroke={hoveredId === 'cloud1' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'cloud1' ? 2 : 1} />
                <ellipse cx="105" cy="55" rx="24" ry="16" fill={regionColors.cloud1 || '#ffffff'} stroke="none" />
                <ellipse cx="60" cy="55" rx="22" ry="14" fill={regionColors.cloud1 || '#ffffff'} stroke="none" />
              </g>

              <g
                onMouseEnter={() => setHoveredId('cloud2')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('cloud2', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('cloud2', c); }}
              >
                <ellipse cx="200" cy="45" rx="26" ry="16" fill={regionColors.cloud2 || '#ffffff'} stroke={hoveredId === 'cloud2' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'cloud2' ? 2 : 1} />
                <ellipse cx="220" cy="50" rx="20" ry="12" fill={regionColors.cloud2 || '#ffffff'} stroke="none" />
                <ellipse cx="182" cy="50" rx="18" ry="12" fill={regionColors.cloud2 || '#ffffff'} stroke="none" />
              </g>

              {/* House body */}
              <rect
                x="70" y="140" width="140" height="90" rx="4"
                fill={regionColors.house || '#ffffff'}
                stroke={hoveredId === 'house' ? '#6366F1' : '#94a3b8'}
                strokeWidth={hoveredId === 'house' ? 2.5 : 1}
                onMouseEnter={() => setHoveredId('house')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('house', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('house', c); }}
                style={{ transition: 'fill .2s ease' }}
              />
              {/* Roof */}
              <polygon
                points="60,140 140,100 220,140"
                fill={regionColors.roof || '#ffffff'}
                stroke={hoveredId === 'roof' ? '#dc2626' : '#94a3b8'}
                strokeWidth={hoveredId === 'roof' ? 2.5 : 1}
                onMouseEnter={() => setHoveredId('roof')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('roof', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('roof', c); }}
              />
              {/* Door */}
              <rect
                x="125" y="180" width="30" height="50" rx="3"
                fill={regionColors.door || '#ffffff'}
                stroke={hoveredId === 'door' ? '#22c55e' : '#94a3b8'}
                strokeWidth={hoveredId === 'door' ? 2 : 1}
                onMouseEnter={() => setHoveredId('door')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('door', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('door', c); }}
              />
              {/* Windows */}
              <g
                onMouseEnter={() => setHoveredId('windowL')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('windowL', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('windowL', c); }}
              >
                <rect x="85" y="165" width="25" height="25" fill={regionColors.windowL || '#ffffff'} stroke={hoveredId === 'windowL' ? '#6366F1' : '#94a3b8'} strokeWidth={hoveredId === 'windowL' ? 2 : 1} />
                <line x1="97.5" y1="165" x2="97.5" y2="190" stroke="#94a3b8" strokeWidth="1" />
                <line x1="85" y1="177.5" x2="110" y2="177.5" stroke="#94a3b8" strokeWidth="1" />
              </g>
              <g
                onMouseEnter={() => setHoveredId('windowR')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('windowR', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('windowR', c); }}
              >
                <rect x="170" y="165" width="25" height="25" fill={regionColors.windowR || '#ffffff'} stroke={hoveredId === 'windowR' ? '#6366F1' : '#94a3b8'} strokeWidth={hoveredId === 'windowR' ? 2 : 1} />
                <line x1="182.5" y1="165" x2="182.5" y2="190" stroke="#94a3b8" strokeWidth="1" />
                <line x1="170" y1="177.5" x2="195" y2="177.5" stroke="#94a3b8" strokeWidth="1" />
              </g>

              {/* Path */}
              <path
                d="M140 230 C 160 240, 220 240, 240 300 L 100 300 C 110 265, 120 245, 140 230 Z"
                fill={regionColors.path || '#ffffff'}
                stroke={hoveredId === 'path' ? '#a16207' : '#94a3b8'}
                strokeWidth={hoveredId === 'path' ? 2.5 : 1}
                onMouseEnter={() => setHoveredId('path')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('path', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('path', c); }}
              />

              {/* Tree */}
              <rect x="300" y="170" width="16" height="60" fill={regionColors.trunk || '#ffffff'} stroke={hoveredId === 'trunk' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'trunk' ? 2 : 1}
                onMouseEnter={() => setHoveredId('trunk')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('trunk', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('trunk', c); }}
              />
              <circle cx="308" cy="160" r="20" fill={regionColors.canopy1 || '#ffffff'} stroke={hoveredId === 'canopy1' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'canopy1' ? 2 : 1}
                onMouseEnter={() => setHoveredId('canopy1')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('canopy1', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('canopy1', c); }}
              />
              <circle cx="290" cy="175" r="18" fill={regionColors.canopy2 || '#ffffff'} stroke={hoveredId === 'canopy2' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'canopy2' ? 2 : 1}
                onMouseEnter={() => setHoveredId('canopy2')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('canopy2', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('canopy2', c); }}
              />
              <circle cx="326" cy="175" r="18" fill={regionColors.canopy3 || '#ffffff'} stroke={hoveredId === 'canopy3' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'canopy3' ? 2 : 1}
                onMouseEnter={() => setHoveredId('canopy3')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('canopy3', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('canopy3', c); }}
              />

              {/* Flowers */}
              {/* Flower 1 */}
              <line x1="40" y1="240" x2="40" y2="210" stroke={regionColors.stem1 || '#94a3b8'} strokeWidth="3"
                onMouseEnter={() => setHoveredId('stem1')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('stem1', isEraser ? '#94a3b8' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('stem1', c); }}
              />
              <circle cx="40" cy="205" r="5" fill={regionColors.center1 || '#ffffff'} stroke={hoveredId === 'center1' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'center1' ? 2 : 1}
                onMouseEnter={() => setHoveredId('center1')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('center1', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('center1', c); }}
              />
              {['p1','p2','p3','p4','p5'].map((p,i)=>{
                const angles=[0,72,144,216,288];
                const a=angles[i]*Math.PI/180; const x=40+Math.cos(a)*12; const y=205+Math.sin(a)*12;
                return (
                  <circle key={`f1_${p}`} cx={x} cy={y} r="6"
                    fill={regionColors[`petal1_${p}`] || '#ffffff'}
                    stroke={hoveredId === `petal1_${p}` ? '#f472b6' : '#94a3b8'} strokeWidth={hoveredId === `petal1_${p}` ? 2 : 1}
                    onMouseEnter={() => setHoveredId(`petal1_${p}`)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => paintRegion(`petal1_${p}`, isEraser ? '#ffffff' : selectedColor)}
                    onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion(`petal1_${p}`, c); }}
                  />
                )
              })}

              {/* Flower 2 */}
              <line x1="85" y1="240" x2="85" y2="215" stroke={regionColors.stem2 || '#94a3b8'} strokeWidth="3"
                onMouseEnter={() => setHoveredId('stem2')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('stem2', isEraser ? '#94a3b8' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('stem2', c); }}
              />
              <rect x="79" y="208" width="12" height="12" rx="2" fill={regionColors.center2 || '#ffffff'} stroke={hoveredId === 'center2' ? '#22c55e' : '#94a3b8'} strokeWidth={hoveredId === 'center2' ? 2 : 1}
                onMouseEnter={() => setHoveredId('center2')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('center2', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('center2', c); }}
              />
              {[0,1,2,3].map((i)=>{
                const dx=[-10, 10, -10, 10][i];
                const dy=[-10,-10, 10, 10][i];
                return (
                  <rect key={`f2_${i}`} x={79+dx} y={208+dy} width="12" height="12" rx="2"
                    fill={regionColors[`petal2_${i}`] || '#ffffff'}
                    stroke={hoveredId === `petal2_${i}` ? '#f472b6' : '#94a3b8'} strokeWidth={hoveredId === `petal2_${i}` ? 2 : 1}
                    onMouseEnter={() => setHoveredId(`petal2_${i}`)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => paintRegion(`petal2_${i}`, isEraser ? '#ffffff' : selectedColor)}
                    onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion(`petal2_${i}`, c); }}
                  />
                )
              })}

              {/* Butterfly */}
              <rect x="250" y="120" width="4" height="16" fill={regionColors.bfly_body || '#94a3b8'} stroke="#94a3b8" strokeWidth="1" />
              <ellipse cx="246" cy="128" rx="10" ry="7" fill={regionColors.bfly_wingL || '#ffffff'} stroke={hoveredId === 'bfly_wingL' ? '#6366F1' : '#94a3b8'} strokeWidth={hoveredId === 'bfly_wingL' ? 2 : 1}
                onMouseEnter={() => setHoveredId('bfly_wingL')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('bfly_wingL', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('bfly_wingL', c); }}
              />
              <ellipse cx="258" cy="128" rx="10" ry="7" fill={regionColors.bfly_wingR || '#ffffff'} stroke={hoveredId === 'bfly_wingR' ? '#6366F1' : '#94a3b8'} strokeWidth={hoveredId === 'bfly_wingR' ? 2 : 1}
                onMouseEnter={() => setHoveredId('bfly_wingR')}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => paintRegion('bfly_wingR', isEraser ? '#ffffff' : selectedColor)}
                onDrop={(e) => { const c = e.dataTransfer.getData('text/plain') || selectedColor; paintRegion('bfly_wingR', c); }}
              />
            </svg>
          </div>
          <div className="text-center text-xs text-gray-600 dark:text-gray-300 mt-2">Tip: Click or drop a color onto any shape to fill it. Hover highlights the region.</div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Color Mindfully:</h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Illustration mode: Click or drag a color onto any part of the drawing to fill it</li>
          <li>• Pixel mode: Click and drag across squares to paint continuously</li>
          <li>• Use the eraser to fix mistakes or add highlights; try different color combinations</li>
          <li>• Hovering a shape subtly highlights it for precise coloring</li>
          <li>• Take deep breaths, focus on the present, and enjoy — there&apos;s no right or wrong way</li>
        </ul>
      </div>
    </div>
  );
};

// Meditation Activity Component
const MeditationActivity = () => {
  // Three meditation types with guided on-screen prompts
  const meditationTypes = [
    {
      id: 'body',
      name: 'Body Scan Meditation',
      description: 'Guide attention slowly from head to toe to release tension and increase awareness.',
      prompts: [
        'Settle into a comfortable posture and soften your gaze.',
        'Notice the natural rhythm of your breath.',
        'Bring attention to the top of your head and scalp.',
        'Relax your forehead and eyebrows.',
        'Soften your eyes and cheeks.',
        'Unclench your jaw and relax your tongue.',
        'Bring awareness to your neck and shoulders—let them drop.',
        'Feel the weight of your arms and hands.',
        'Notice your chest and the gentle rise and fall.',
        'Bring attention to your abdomen and lower back.',
        'Relax your hips and pelvis.',
        'Down through your thighs and knees.',
        'Relax your calves and ankles.',
        'Soften the soles of your feet and toes.',
        'Sense the whole body, breathing as one.'
      ]
    },
    {
      id: 'kindness',
      name: 'Loving-Kindness Meditation',
      description: 'Cultivate feelings of warmth, compassion, and kindness for yourself and others.',
      prompts: [
        'Sit comfortably and bring someone you care about to mind—or yourself.',
        'Gently repeat: “May I be safe.”',
        '“May I be happy.”',
        '“May I be healthy.”',
        '“May I live with ease.”',
        'Bring to mind someone neutral and repeat the phrases.',
        'Extend to someone difficult, as you are able, with care.',
        'Extend to all beings: “May all be safe.”',
        '“May all be happy.”',
        '“May all be healthy.”',
        '“May all live with ease.”',
        'Rest in the feeling of warmth and connection.'
      ]
    },
    {
      id: 'breath',
      name: 'Breath Awareness Meditation',
      description: 'Anchor attention on the breath to build calm and clarity.',
      prompts: [
        'Sit tall but relaxed; rest hands gently in your lap.',
        'Feel the coolness of the inhale at the nose.',
        'Feel the warmth of the exhale leaving the body.',
        'Follow the rise and fall at your chest or belly.',
        'Silently count each exhale from 1 to 5, then begin again.',
        'If the mind wanders, kindly return to the next breath.',
        'Relax your shoulders; soften the muscles of the face.',
        'Notice small pauses between breaths.',
        'Rest in the simple rhythm of breathing.'
      ]
    }
  ];

  const [selectedType, setSelectedType] = useState(meditationTypes[0]);
  const [durationMin, setDurationMin] = useState(3); // 1–5 minutes
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationMin * 60); // seconds
  const [guidedVoice, setGuidedVoice] = useState(false);

  const lastSpokenIndexRef = useRef(-1);

  // Reset timing when the type or duration changes
  useEffect(() => {
    setIsActive(false);
    setTimeLeft(durationMin * 60);
    lastSpokenIndexRef.current = -1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [selectedType, durationMin]);

  // Core timer
  useEffect(() => {
    if (!isActive) return;
    if (timeLeft <= 0) return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [isActive, timeLeft]);

  const totalSeconds = Math.max(1, durationMin * 60);
  const elapsed = Math.max(0, totalSeconds - timeLeft);
  const cadence = Math.max(5, Math.floor(totalSeconds / selectedType.prompts.length)); // min 5s per prompt
  const currentPromptIndex = Math.min(
    selectedType.prompts.length - 1,
    Math.floor(elapsed / cadence)
  );
  const currentPrompt = selectedType.prompts[currentPromptIndex];

  // Optional voice guidance using Web Speech API
  useEffect(() => {
    if (!isActive) return;
    if (!guidedVoice) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (currentPromptIndex === lastSpokenIndexRef.current) return;
    lastSpokenIndexRef.current = currentPromptIndex;
    try {
      const utter = new SpeechSynthesisUtterance(currentPrompt);
      utter.rate = 0.95;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      window.speechSynthesis.cancel(); // avoid overlap
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // no-op
    }
  }, [currentPromptIndex, guidedVoice, isActive, currentPrompt]);

  // Session end handling
  useEffect(() => {
    if (!isActive) return;
    if (timeLeft > 0) return;
    setIsActive(false);
    if (guidedVoice && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance('Session complete. Take a gentle breath and notice how you feel.');
      u.rate = 0.95;
      try { window.speechSynthesis.speak(u); } catch (e) { /* ignore speech errors */ }
    }
  }, [timeLeft, isActive, guidedVoice]);

  // Cleanup any pending speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const format = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Progress ring math
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = elapsed / totalSeconds;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Mini Meditations
      </h2>

      {/* Meditation type selector */}
      <div className="grid gap-4 mb-8">
        {meditationTypes.map((t) => {
          const active = selectedType.id === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedType(t)}
              className={`p-6 rounded-xl border transition-all text-left ${
                active
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{t.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-md ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                  {active ? 'Selected' : 'Tap to select'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        {/* Duration selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Duration: {durationMin} {durationMin === 1 ? 'minute' : 'minutes'}</label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={durationMin}
            onChange={(e) => setDurationMin(parseInt(e.target.value))}
            className="w-full accent-indigo-600"
          />
        </div>
        {/* Voice guidance toggle */}
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            className="accent-indigo-600"
            checked={guidedVoice}
            onChange={(e) => {
              const v = e.target.checked;
              setGuidedVoice(v);
              if (!v && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
          />
          Voice guidance
        </label>
        {/* Start/Pause/Reset */}
        <div className="flex items-center gap-3">
          <button
            className={`px-6 py-3 rounded-xl font-semibold text-white ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            onClick={() => {
              if (!isActive) {
                // restarting fresh if timeLeft is 0 or changed
                setTimeLeft(durationMin * 60);
                lastSpokenIndexRef.current = -1;
              }
              setIsActive((v) => !v);
            }}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button
            className="px-6 py-3 rounded-xl font-semibold bg-gray-500 hover:bg-gray-600 text-white"
            onClick={() => {
              setIsActive(false);
              setTimeLeft(durationMin * 60);
              lastSpokenIndexRef.current = -1;
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Visuals + Prompt */}
      <div key={selectedType.id} className="grid md:grid-cols-2 gap-6 items-center transition-all duration-500">
        {/* Progress Ring + Emoji */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="150" height="150" viewBox="0 0 150 150" className="block">
              <circle cx="75" cy="75" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="75"
                cy="75"
                r={radius}
                fill="none"
                stroke="url(#grad)"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-3xl ${isActive ? 'animate-pulse' : ''}`} aria-hidden>
              🧘‍♀️
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xl font-bold text-gray-900 dark:text-white">
              {format(timeLeft)}
            </div>
          </div>
        </div>

        {/* Prompt panel */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
          <div className="text-sm uppercase tracking-wide text-indigo-700 dark:text-indigo-300 mb-2">Guidance</div>
          <div className="text-lg text-indigo-900 dark:text-indigo-100 leading-relaxed min-h-[64px] transition-opacity duration-500">
            {currentPrompt}
          </div>
          <div className="mt-4 h-2 bg-indigo-200/60 dark:bg-indigo-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-1000"
              style={{ width: `${Math.min(100, ((elapsed % cadence) / cadence) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-indigo-700/70 dark:text-indigo-300/80">Next prompt in ~{Math.max(0, cadence - (elapsed % cadence))}s</div>
        </div>
      </div>
    </div>
  );
};

// Mini Games Component
const MiniGames = () => {
  // Selection and settings
  const games = [
    { id: 'bubble', name: 'Bubble Pop', emoji: '🫧' },
    { id: 'shapes', name: 'Shape Sorting', emoji: '🧩' },
    { id: 'zen', name: 'Zen Garden', emoji: '🌾' },
    { id: 'leaves', name: 'Floating Leaves', emoji: '🍃' },
  ];
  const [activeGame, setActiveGame] = useState(games[0].id);
  const [difficulty, setDifficulty] = useState('normal'); // easy | normal | hard
  const [theme, setTheme] = useState('sky'); // sky | sunset | forest | night
  const [sfx, setSfx] = useState(true);
  const [userId] = useState(() => gamesAPI.ensureDeviceId());
  const [sessionId, setSessionId] = useState(null);
  const [bubbleHigh, setBubbleHigh] = useState(null);

  // Start/stop a session when switching games (non-bubble starts immediately)
  useEffect(() => {
    let mounted = true;
    (async () => {
      // stop previous
      if (sessionId) {
        try { await gamesAPI.stopSession(sessionId); } catch (e) { /* ignore */ }
        if (mounted) setSessionId(null);
      }
      // start for non-bubble games immediately
      if (activeGame !== 'bubble') {
        try {
          const sid = await gamesAPI.startSession(userId, activeGame);
          if (mounted) setSessionId(sid);
        } catch (e) { /* ignore */ }
      }
      // fetch state
      try {
        const st = await gamesAPI.getState(userId, activeGame);
        if (mounted && st) {
          if (activeGame === 'bubble' && typeof st.highScore === 'number') setBubbleHigh(st.highScore);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGame]);

  // Persist preferences when changed
  useEffect(() => {
    const prefs = { difficulty, theme, sfx };
    const t = setTimeout(() => { gamesAPI.setPreferences(userId, activeGame, prefs).catch(()=>{}); }, 200);
    return () => clearTimeout(t);
  }, [difficulty, theme, sfx, activeGame, userId]);

  // Session tracking
  const [sessionSeconds, setSessionSeconds] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Simple WebAudio chime for feedback
  const audioCtxRef = useRef(null);
  const playChime = (freq = 660, dur = 0.07, type = 'sine') => {
    if (!sfx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = audioCtxRef.current || new Ctx();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = 0.001; // start near silent to avoid click
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      g.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.start(now);
      o.stop(now + dur + 0.02);
    } catch (e) { /* ignore */ }
  };

  const themeClasses = {
    sky: 'from-sky-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800',
    sunset: 'from-rose-50 to-amber-50 dark:from-rose-900/20 dark:to-amber-900/20',
    forest: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-900/20',
    night: 'from-slate-800 to-indigo-900 dark:from-slate-900 dark:to-black',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Calming Games
      </h2>

      {/* Game selection menu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {games.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveGame(g.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeGame === g.id
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{g.emoji}</span>
              <span className="font-medium text-gray-900 dark:text-white">{g.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Settings */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-200">Difficulty</span>
          {['easy', 'normal', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                difficulty === d ? 'bg-gray-200 dark:bg-gray-700 border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-200">Theme</span>
          {['sky', 'sunset', 'forest', 'night'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-lg text-sm border ${
                theme === t ? 'bg-gray-200 dark:bg-gray-700 border-gray-600' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input type="checkbox" className="accent-indigo-600" checked={sfx} onChange={(e) => setSfx(e.target.checked)} />
          Sound effects
        </label>
        <div className="ml-auto text-sm text-gray-600 dark:text-gray-300">
          Time today: <span className="font-semibold">{Math.floor(sessionSeconds / 60)}m {sessionSeconds % 60}s</span>
        </div>
      </div>

      {/* Active game */}
      {activeGame === 'bubble' && (
        <BubblePopGame
          difficulty={difficulty}
          themeClass={themeClasses[theme]}
          highScore={bubbleHigh}
          onStart={async () => {
            try { const sid = await gamesAPI.startSession(userId, 'bubble'); setSessionId(sid); } catch (e) { /* ignore */ }
          }}
          onStop={async (finalScore) => {
            try { if (sessionId) await gamesAPI.stopSession(sessionId); } catch (e) { /* ignore */ }
            try { const res = await gamesAPI.bubbleScore(userId, finalScore); if (res?.highScore) setBubbleHigh(res.highScore); } catch (e) { /* ignore */ }
          }}
          onPop={async () => {
            playChime(740);
            if (sessionId) gamesAPI.logEvent({ sessionId, game: 'bubble', type: 'bubble_pop', payload: {} }).catch(()=>{});
          }}
        />
      )}
      {activeGame === 'shapes' && (
        <ShapeSortingGame
          difficulty={difficulty}
          themeClass={themeClasses[theme]}
          onPlace={async () => {
            playChime(520);
            if (sessionId) gamesAPI.logEvent({ sessionId, game: 'shapes', type: 'shape_place', payload: {} }).catch(()=>{});
          }}
        />
      )}
      {activeGame === 'zen' && (
        <ZenGardenGame
          themeClass={themeClasses[theme]}
          onStroke={async () => {
            playChime(420, 0.04, 'triangle');
            if (sessionId) gamesAPI.logEvent({ sessionId, game: 'zen', type: 'stroke', payload: {} }).catch(()=>{});
          }}
          onSave={async (imageData, opts) => {
            try { await gamesAPI.zenSave(userId, imageData, opts?.theme, opts?.rakeWidth); } catch (e) { /* ignore */ }
          }}
        />
      )}
      {activeGame === 'leaves' && (
        <FloatingLeavesGame
          difficulty={difficulty}
          themeClass={themeClasses[theme]}
          onTap={() => playChime(600, 0.05, 'sine')}
          onEvent={async (payload) => {
            if (sessionId) gamesAPI.logEvent({ sessionId, game: 'leaves', type: 'drag', payload }).catch(()=>{});
          }}
        />
      )}

      {/* Gentle tips */}
      <div className="mt-8 text-center">
        <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-6">
          <Heart className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">Mindful Gaming Tips</h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Move slowly, breathe deeply, and enjoy the visuals and sounds. It&apos;s about relaxation, not competition.
          </p>
        </div>
      </div>
    </div>
  );
};

// Bubble Pop Game
const BubblePopGame = ({ difficulty, themeClass, onPop, onStart, onStop, highScore }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const containerRef = useRef(null);
  const [bubblePos, setBubblePos] = useState({ top: 50, left: 50 });

  const bubbleSize = 56;
  const moveEvery = difficulty === 'hard' ? 700 : difficulty === 'easy' ? 1400 : 1000;
  const gameSeconds = difficulty === 'hard' ? 25 : difficulty === 'easy' ? 35 : 30;

  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) {
      setIsPlaying(false);
      onStop?.(score);
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => randomizeBubble(), moveEvery);
    return () => clearInterval(id);
  }, [isPlaying, moveEvery]);

  const randomizeBubble = () => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxLeft = Math.max(0, rect.width - bubbleSize);
    const maxTop = Math.max(0, rect.height - bubbleSize);
    setBubblePos({
      top: Math.floor(Math.random() * maxTop),
      left: Math.floor(Math.random() * maxLeft),
    });
  };

  const handleStart = () => {
    setScore(0);
    setTimeLeft(gameSeconds);
    setIsPlaying(true);
    setTimeout(randomizeBubble, 0);
    onStart?.();
  };

  const handlePop = () => {
    if (!isPlaying) return;
    setScore((s) => s + 1);
    onPop?.();
    randomizeBubble();
  };

  const milestone = score >= 50 ? 'Zen Pop Master' : score >= 25 ? 'Bubble Bliss' : score >= 10 ? 'Gentle Popper' : '';

  return (
    <div>
      {/* Stats and Controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-gray-700 dark:text-gray-200">Time: <span className="font-semibold">{timeLeft}s</span></div>
        <div className="text-gray-700 dark:text-gray-200">Score: <span className="font-semibold">{score}</span></div>
        {typeof highScore === 'number' && <div className="text-gray-700 dark:text-gray-200">Best: <span className="font-semibold">{highScore}</span></div>}
        {milestone && <span className="text-xs bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-2 py-1 rounded">{milestone}</span>}
        <button
          className={`px-6 py-2 rounded-xl text-white ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={() => (isPlaying ? setIsPlaying(false) : handleStart())}
        >
          {isPlaying ? 'Pause' : 'Start'}
        </button>
      </div>

      {/* Game Area */}
      <div
        ref={containerRef}
        className={`relative w-full max-w-2xl h-64 mx-auto bg-gradient-to-br ${themeClass} rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden`}
      >
        {isPlaying && (
          <button
            onClick={handlePop}
            className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg hover:scale-110 active:scale-95 transition-transform duration-150"
            style={{ top: bubblePos.top, left: bubblePos.left }}
            aria-label="bubble"
          >
            ✨
          </button>
        )}
      </div>
    </div>
  );
};

// Shape Sorting Game
const ShapeSortingGame = ({ difficulty, themeClass, onPlace }) => {
  const [targets, setTargets] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [placedCount, setPlacedCount] = useState(0);
  const containerRef = useRef(null);

  const shapeTypes = ['circle', 'square', 'triangle'];
  const count = difficulty === 'hard' ? 6 : difficulty === 'easy' ? 3 : 4;

  useEffect(() => {
    // create target slots and pieces
    const t = Array.from({ length: count }, (_, i) => ({ id: `t${i}`, type: shapeTypes[i % shapeTypes.length] }));
    const p = t.map((slot, i) => ({ id: `p${i}`, type: slot.type }));
    // shuffle pieces
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    setTargets(t);
    setPieces(p);
    setPlacedCount(0);
  }, [difficulty]);

  const onDropPiece = (target, e) => {
    const pid = e.dataTransfer.getData('text/plain');
    const piece = pieces.find((x) => x.id === pid);
    if (!piece) return;
    if (piece.type === target.type) {
      // place
      setPieces((prev) => prev.filter((x) => x.id !== pid));
      setTargets((prev) => prev.map((x) => (x.id === target.id ? { ...x, filled: true } : x)));
      setPlacedCount((c) => c + 1);
      onPlace?.();
    }
  };

  const allPlaced = placedCount >= count;

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="text-gray-700 dark:text-gray-200">Placed: <span className="font-semibold">{placedCount}/{count}</span></div>
        {allPlaced && <span className="text-xs bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200 px-2 py-1 rounded">Centered Mind</span>}
      </div>
      <div className={`grid md:grid-cols-2 gap-4`}>
        {/* Target board */}
        <div className={`relative w-full h-64 bg-gradient-to-br ${themeClass} rounded-xl border border-gray-200 dark:border-gray-600 p-4`}
             ref={containerRef}>
          <div className="grid grid-cols-3 gap-3 h-full">
            {targets.map((t) => (
              <div
                key={t.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDropPiece(t, e)}
                className={`flex items-center justify-center rounded-lg border-2 ${t.filled ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-900/20' : 'border-gray-300 dark:border-gray-600'} transition-colors`}
              >
                <Shape type={t.type} outline={!t.filled} size={48} />
              </div>
            ))}
          </div>
        </div>

        {/* Pieces tray */}
        <div className="w-full h-64 rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-white/60 dark:bg-gray-900/30">
          <div className="flex flex-wrap gap-3 items-center justify-center h-full">
            {pieces.map((p) => (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                className="cursor-grab active:cursor-grabbing"
              >
                <Shape type={p.type} size={56} />
              </div>
            ))}
            {pieces.length === 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-300">All shapes placed — great focus!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Shape = ({ type, outline = false, size = 48 }) => {
  const stroke = outline ? '#6366F1' : 'none';
  const fill = outline ? 'none' : '#6366F1';
  const sw = 3;
  if (type === 'circle') return <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={size/2 - sw} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
  if (type === 'square') return <svg width={size} height={size}><rect x={sw} y={sw} width={size-2*sw} height={size-2*sw} rx={8} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
  // triangle
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={`${size/2},${sw} ${size-sw},${size-sw} ${sw},${size-sw}`} fill={fill} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
};

// Zen Garden Game
const ZenGardenGame = ({ themeClass, onStroke, onSave }) => {
  const canvasRef = useRef(null);
  const [rakeWidth, setRakeWidth] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // init sand
    ctx.fillStyle = '#f3e8d7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => { setIsDrawing(true); draw(e); };
  const end = () => setIsDrawing(false);
  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e);
    ctx.fillStyle = '#d6c6b8';
    ctx.beginPath();
    ctx.ellipse(x, y, rakeWidth, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    onStroke?.();
  };

  const reset = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3e8d7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      onSave?.(dataUrl, { rakeWidth });
    } catch (e) { /* ignore */ }
  };

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-3">
        <label className="text-sm text-gray-700 dark:text-gray-200">Rake width</label>
        <input type="range" min={4} max={18} step={1} value={rakeWidth} onChange={(e) => setRakeWidth(parseInt(e.target.value))} className="w-48" />
        <button className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white" onClick={reset}>Smooth Sand</button>
        <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white" onClick={saveImage}>Save Garden</button>
      </div>
      <div className={`relative w-full max-w-3xl h-72 mx-auto bg-gradient-to-br ${themeClass} rounded-xl border border-gray-200 dark:border-gray-600 grid place-items-center p-3`}>
        <canvas
          ref={canvasRef}
          width={800}
          height={300}
          onMouseDown={start}
          onMouseUp={end}
          onMouseLeave={end}
          onMouseMove={draw}
          onTouchStart={start}
          onTouchEnd={end}
          onTouchMove={draw}
          className="w-full h-full rounded-lg shadow-inner cursor-crosshair bg-[#f3e8d7]"
        />
      </div>
    </div>
  );
};

// Floating Leaves Game
const FloatingLeavesGame = ({ difficulty, themeClass, onTap, onEvent }) => {
  const containerRef = useRef(null);
  const leafCount = difficulty === 'hard' ? 10 : difficulty === 'easy' ? 5 : 7;
  const [leaves, setLeaves] = useState(() => Array.from({ length: leafCount }, (_, i) => ({ id: i, top: 30 + Math.random()*120, left: 30 + Math.random()*240, angle: Math.random() * 360 })));

  useEffect(() => {
    // gentle floating
    const id = setInterval(() => {
      setLeaves((prev) => prev.map((l) => ({
        ...l,
        top: l.top + Math.sin((Date.now()/1000 + l.id) % (2*Math.PI)) * 0.6,
        left: l.left + Math.cos((Date.now()/1200 + l.id) % (2*Math.PI)) * 0.5,
        angle: (l.angle + 0.5) % 360,
      })));
    }, 60);
    return () => clearInterval(id);
  }, []);

  const handleDrag = (id, e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    setLeaves((prev) => prev.map((l) => (l.id === id ? { ...l, left: x-12, top: y-8 } : l)));
    onTap?.();
    onEvent?.({ x, y, id });
  };

  const colors = ['#22c55e', '#84cc16', '#16a34a', '#65a30d'];

  return (
    <div>
      <div ref={containerRef} className={`relative w-full max-w-3xl h-72 mx-auto bg-gradient-to-br ${themeClass} rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden`}> 
        {leaves.map((l) => (
          <div
            key={l.id}
            onMouseDown={() => {
              const move = (ev) => handleDrag(l.id, ev);
              const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
              window.addEventListener('mousemove', move);
              window.addEventListener('mouseup', up);
            }}
            onTouchStart={() => {
              const move = (ev) => handleDrag(l.id, ev);
              const up = () => { window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); };
              window.addEventListener('touchmove', move);
              window.addEventListener('touchend', up);
            }}
            className="absolute w-6 h-3 rounded-full shadow-sm cursor-grab active:cursor-grabbing"
            style={{ top: l.top, left: l.left, background: colors[l.id % colors.length], transform: `rotate(${l.angle}deg)` }}
          />
        ))}
      </div>
      <div className="text-center text-sm text-gray-600 dark:text-gray-300 mt-2">Drag the leaves gently; watch them float and drift.</div>
    </div>
  );
};

export default Activities;