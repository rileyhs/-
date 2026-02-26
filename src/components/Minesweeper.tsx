import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flag, Bomb, RefreshCw, Clock, Trophy, AlertTriangle, Settings2 } from 'lucide-react';
import { Difficulty, DIFFICULTIES, Cell, GameStatus, GameConfig } from '../types';

const Minesweeper: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('Beginner');
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [mineCount, setMineCount] = useState(0);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initGrid = useCallback((config: GameConfig): Cell[][] => {
    const newGrid: Cell[][] = [];
    for (let r = 0; r < config.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < config.cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newGrid.push(row);
    }
    return newGrid;
  }, []);

  const startGame = useCallback(() => {
    const config = DIFFICULTIES[difficulty];
    setGrid(initGrid(config));
    setStatus('idle');
    setMineCount(config.mines);
    setTimer(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [difficulty, initGrid]);

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startGame]);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const placeMines = (initialGrid: Cell[][], firstRow: number, firstCol: number) => {
    const config = DIFFICULTIES[difficulty];
    const newGrid = [...initialGrid.map(row => row.map(cell => ({ ...cell })))];
    let minesPlaced = 0;

    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);

      if (
        !newGrid[r][c].isMine &&
        !(Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1)
      ) {
        newGrid[r][c].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!newGrid[r][c].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && newGrid[nr][nc].isMine) {
                count++;
              }
            }
          }
          newGrid[r][c].neighborMines = count;
        }
      }
    }
    return newGrid;
  };

  const revealCell = (r: number, c: number) => {
    if (status === 'won' || status === 'lost' || grid[r][c].isRevealed || grid[r][c].isFlagged) return;

    let currentGrid = grid;
    if (status === 'idle') {
      currentGrid = placeMines(grid, r, c);
      setStatus('playing');
      startTimer();
    }

    const newGrid = [...currentGrid.map(row => row.map(cell => ({ ...cell })))];
    
    const reveal = (row: number, col: number) => {
      if (row < 0 || row >= newGrid.length || col < 0 || col >= newGrid[0].length || newGrid[row][col].isRevealed || newGrid[row][col].isFlagged) return;

      newGrid[row][col].isRevealed = true;

      if (newGrid[row][col].isMine) {
        setStatus('lost');
        stopTimer();
        newGrid.forEach(r => r.forEach(cell => {
          if (cell.isMine) cell.isRevealed = true;
        }));
        return;
      }

      if (newGrid[row][col].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            reveal(row + dr, col + dc);
          }
        }
      }
    };

    reveal(r, c);
    setGrid(newGrid);

    if (status !== 'lost') {
      const config = DIFFICULTIES[difficulty];
      let unrevealedCount = 0;
      newGrid.forEach(row => row.forEach(cell => {
        if (!cell.isRevealed) unrevealedCount++;
      }));
      if (unrevealedCount === config.mines) {
        setStatus('won');
        stopTimer();
      }
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status === 'won' || status === 'lost' || grid[r][c].isRevealed) return;

    const newGrid = [...grid.map(row => row.map(cell => ({ ...cell })))];
    const isFlagged = !newGrid[r][c].isFlagged;
    newGrid[r][c].isFlagged = isFlagged;
    setGrid(newGrid);
    setMineCount(prev => isFlagged ? prev - 1 : prev + 1);
  };

  return (
    <div className="min-h-screen bg-rog-dark flex flex-col items-center py-12 px-4 font-sans text-white rog-grid-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl w-full bg-rog-surface rounded-none border-l-4 border-rog-red shadow-2xl rog-glow relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-rog-red/20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-rog-red/20 pointer-events-none" />
        
        {/* Header */}
        <div className="p-8 border-b border-rog-border bg-black/40 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="relative">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-8 bg-rog-red shadow-[0_0_10px_#ff0032]" />
                <h1 className="text-4xl font-black tracking-tighter italic uppercase text-white">
                  ROG <span className="text-rog-red">Minesweeper</span>
                </h1>
              </div>
              <p className="text-rog-red/60 font-bold text-xs tracking-[0.3em] uppercase ml-5">Tactical Operations Unit</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex bg-rog-dark p-1 border border-rog-border">
                {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                      difficulty === d 
                        ? 'bg-rog-red text-white shadow-[0_0_15px_rgba(255,0,50,0.4)]' 
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button 
                onClick={startGame}
                className="p-3 bg-rog-red text-white hover:bg-rog-red/80 transition-all shadow-[0_0_20px_rgba(255,0,50,0.3)] active:scale-95"
              >
                <RefreshCw size={24} className={status === 'playing' ? 'animate-spin-slow' : ''} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <StatCard label="Mines Detected" value={mineCount} icon={<Flag size={20} />} color="text-rog-red" />
            <StatCard label="Mission Time" value={`${timer}s`} icon={<Clock size={20} />} color="text-cyan-400" />
            <StatCard label="Sector" value={difficulty} icon={<Settings2 size={20} />} color="text-white" />
            <StatCard 
              label="Status" 
              value={status === 'idle' ? 'Ready' : status} 
              icon={<Trophy size={20} />} 
              color={status === 'won' ? 'text-emerald-400' : status === 'lost' ? 'text-rog-red' : 'text-white/60'} 
            />
          </div>
        </div>

        {/* Game Area */}
        <div className="p-10 bg-black/60 flex justify-center overflow-auto min-h-[400px]">
          <div 
            className="grid gap-1 p-4 bg-rog-dark border border-rog-border shadow-inner relative"
            style={{ 
              gridTemplateColumns: `repeat(${DIFFICULTIES[difficulty].cols}, minmax(0, 1fr))`,
              width: 'fit-content'
            }}
          >
            {/* Grid corner accents */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-rog-red" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-rog-red" />

            {grid.map((row, r) => (
              row.map((cell, c) => (
                <motion.button
                  key={`${r}-${c}`}
                  whileHover={{ 
                    backgroundColor: cell.isRevealed ? undefined : 'rgba(255, 0, 50, 0.15)',
                    borderColor: cell.isRevealed ? undefined : '#ff0032'
                  }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => revealCell(r, c)}
                  onContextMenu={(e) => toggleFlag(e, r, c)}
                  className={`
                    w-8 h-8 md:w-10 md:h-10 border flex items-center justify-center text-sm font-black transition-all duration-75
                    ${cell.isRevealed 
                      ? cell.isMine 
                        ? 'bg-rog-red border-rog-red text-white shadow-[0_0_15px_#ff0032]' 
                        : 'bg-white/5 border-white/10 text-white/40' 
                      : 'bg-rog-surface border-rog-border hover:shadow-[0_0_10px_rgba(255,0,50,0.2)]'
                    }
                  `}
                >
                  {cell.isRevealed ? (
                    cell.isMine ? (
                      <Bomb size={18} className="animate-pulse" />
                    ) : (
                      cell.neighborMines > 0 ? (
                        <span className={`drop-shadow-[0_0_5px_currentColor] ${getNumberColor(cell.neighborMines)}`}>
                          {cell.neighborMines}
                        </span>
                      ) : null
                    )
                  ) : (
                    cell.isFlagged ? (
                      <Flag size={16} className="text-rog-red drop-shadow-[0_0_8px_#ff0032]" />
                    ) : null
                  )}
                </motion.button>
              ))
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-rog-red/5 border-t border-rog-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-rog-red/40 text-[10px] font-black uppercase tracking-[0.2em]">
            <div className="w-1 h-1 bg-rog-red animate-ping" />
            <span>Tactical HUD Active // Right-Click to Flag Target</span>
          </div>
          <div className="text-white/20 text-[10px] font-black uppercase tracking-widest italic">
            Republic of Gamers // Minesweeper.OS
          </div>
        </div>
      </motion.div>

      {/* Win/Loss Overlays */}
      <AnimatePresence>
        {(status === 'won' || status === 'lost') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: 45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              className="bg-rog-surface p-12 border-t-4 border-rog-red shadow-[0_0_50px_rgba(255,0,50,0.3)] max-w-md w-full text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rog-red to-transparent animate-pulse" />
              
              <div className={`w-24 h-24 mx-auto flex items-center justify-center mb-8 border-2 ${
                status === 'won' ? 'border-emerald-500 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-rog-red text-rog-red shadow-[0_0_20px_rgba(255,0,50,0.3)]'
              }`}>
                {status === 'won' ? <Trophy size={48} /> : <AlertTriangle size={48} />}
              </div>
              
              <h2 className={`text-4xl font-black italic uppercase mb-4 tracking-tighter ${
                status === 'won' ? 'text-emerald-400' : 'text-rog-red'
              }`}>
                {status === 'won' ? 'Mission Success' : 'System Failure'}
              </h2>
              
              <p className="text-white/60 mb-10 font-bold uppercase tracking-widest text-xs leading-relaxed">
                {status === 'won' 
                  ? `Sector cleared in ${timer} seconds. Performance: Elite.` 
                  : 'Critical damage sustained. Tactical error detected.'}
              </p>
              
              <button
                onClick={startGame}
                className="w-full py-5 bg-rog-red text-white font-black uppercase tracking-[0.3em] italic hover:bg-rog-red/80 transition-all shadow-[0_0_25px_rgba(255,0,50,0.4)] active:scale-95"
              >
                Reboot Mission
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-black/40 p-4 border border-rog-border flex items-center gap-4 relative group overflow-hidden">
    <div className="absolute top-0 left-0 w-1 h-full bg-rog-red/20 group-hover:bg-rog-red transition-colors" />
    <div className={`p-2 bg-white/5 rounded-none ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-[9px] uppercase tracking-[0.2em] font-black text-white/40 mb-1">{label}</p>
      <p className={`text-xl font-black italic uppercase tracking-tight ${color}`}>{value}</p>
    </div>
  </div>
);

const getNumberColor = (num: number) => {
  const colors = [
    '',
    'text-cyan-400',
    'text-emerald-400',
    'text-rog-red',
    'text-indigo-400',
    'text-amber-400',
    'text-pink-400',
    'text-white',
    'text-white/50',
  ];
  return colors[num] || '';
};

export default Minesweeper;
