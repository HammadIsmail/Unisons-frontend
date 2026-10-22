import React, { useState } from 'react';

interface FolderProps {
  color?: string;
  size?: number;
  items?: React.ReactNode[];
  className?: string;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const num = parseInt(color, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

// Fan-spread positions for N papers (CSS transform strings)
// Percentages are relative to the individual paper element's own width/height
const SPREAD_POSITIONS: Record<number, string[]> = {
  1: [
    'translate(-50%, -130%) rotate(0deg)',
  ],
  2: [
    'translate(-140%, -75%) rotate(-20deg)',
    'translate(40%,  -75%) rotate( 20deg)',
  ],
  3: [
    'translate(-120%, -70%) rotate(-15deg)',
    'translate( 10%,  -70%) rotate( 15deg)',
    'translate(-50%, -105%) rotate(  5deg)',
  ],
  4: [
    'translate(-165%, -58%) rotate(-30deg)',
    'translate( -82%, -108%) rotate(-12deg)',
    'translate( -18%, -108%) rotate( 12deg)',
    'translate(  65%, -58%) rotate( 30deg)',
  ],
  5: [
    'translate(-185%, -48%) rotate(-38deg)',
    'translate(-112%, -105%) rotate(-18deg)',
    'translate( -50%, -125%) rotate(  0deg)',
    'translate(  12%, -105%) rotate( 18deg)',
    'translate(  85%, -48%) rotate( 38deg)',
  ],
  6: [
    'translate(-200%, -42%) rotate(-44deg)',
    'translate(-135%, -100%) rotate(-25deg)',
    'translate( -68%, -120%) rotate(-10deg)',
    'translate( -32%, -120%) rotate( 10deg)',
    'translate(  35%, -100%) rotate( 25deg)',
    'translate( 100%, -42%) rotate( 44deg)',
  ],
};

// Slightly different shade of white for each paper (front paper brightest)
const PAPER_SHADES = ['#E0E0E0', '#E8E8E8', '#F0F0F0', '#F5F5F5', '#F9F9F9', '#FFFFFF'];

const Folder: React.FC<FolderProps> = ({ color = '#5227FF', size = 1, items = [], className = '' }) => {
  const count = Math.min(Math.max(items.length, 0), 6);
  // Pad or slice to exactly `count` entries
  const papers: (React.ReactNode | null)[] = items.slice(0, count);
  while (papers.length < count) papers.push(null);

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: Math.max(count, 1) }, () => ({ x: 0, y: 0 }))
  );

  const folderBackColor = darkenColor(color, 0.08);

  const handleClick = () => {
    setOpen(prev => !prev);
    if (open) {
      setPaperOffsets(Array.from({ length: Math.max(count, 1) }, () => ({ x: 0, y: 0 })));
    }
  };

  const handlePaperMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.15;
    const offsetY = (e.clientY - (rect.top  + rect.height / 2)) * 0.15;
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: offsetX, y: offsetY };
      return next;
    });
  };

  const handlePaperMouseLeave = (_e: React.MouseEvent<HTMLDivElement>, index: number) => {
    setPaperOffsets(prev => {
      const next = [...prev];
      next[index] = { x: 0, y: 0 };
      return next;
    });
  };

  const folderStyle: React.CSSProperties = {
    '--folder-color': color,
    '--folder-back-color': folderBackColor,
  } as React.CSSProperties;

  const scaleStyle: React.CSSProperties = {
    transform: `scale(${size})`,
    transformOrigin: 'top left',
  };

  const getOpenTransform = (index: number): string => {
    const positions = SPREAD_POSITIONS[count] ?? SPREAD_POSITIONS[3];
    const base = positions[index] ?? 'translate(-50%, -110%) rotate(0deg)';
    const { x, y } = paperOffsets[index] ?? { x: 0, y: 0 };
    return `${base} translate(${x}px, ${y}px)`;
  };

  return (
    <div
      className={className}
      style={{ width: `${100 * size}px`, height: `${80 * size}px` }}
    >
      <div style={scaleStyle}>
        <div
          className={`group relative transition-all duration-200 ease-in cursor-pointer ${
            !open ? 'hover:-translate-y-2' : ''
          }`}
          style={{
            ...folderStyle,
            transform: open ? 'translateY(-8px)' : undefined,
          }}
          onClick={handleClick}
        >
          <div
            className="relative w-[100px] h-[80px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]"
            style={{ backgroundColor: folderBackColor }}
          >
            {/* Folder tab */}
            <span
              className="absolute z-0 bottom-[98%] left-0 w-[30px] h-[10px] rounded-tl-[5px] rounded-tr-[5px]"
              style={{ backgroundColor: folderBackColor }}
            />

            {/* Papers */}
            {papers.map((item, i) => {
              const bg = PAPER_SHADES[i % PAPER_SHADES.length];
              return (
                <div
                  key={i}
                  onMouseMove={e => handlePaperMouseMove(e, i)}
                  onMouseLeave={e => handlePaperMouseLeave(e, i)}
                  className={`absolute bottom-[10%] left-1/2 w-[72%] h-[76%] transition-all duration-300 ease-in-out overflow-hidden flex items-center justify-center ${
                    !open
                      ? 'transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0'
                      : 'hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: bg,
                    borderRadius: '8px',
                    zIndex: 20 + i,
                    ...(!open ? {} : { transform: getOpenTransform(i) }),
                  }}
                >
                  {item}
                </div>
              );
            })}

            {/* Folder front flaps */}
            <div
              className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
                !open ? 'group-hover:[transform:skew(15deg)_scaleY(0.6)]' : ''
              }`}
              style={{
                backgroundColor: color,
                borderRadius: '5px 10px 10px 10px',
                ...(open && { transform: 'skew(15deg) scaleY(0.6)' }),
              }}
            />
            <div
              className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
                !open ? 'group-hover:[transform:skew(-15deg)_scaleY(0.6)]' : ''
              }`}
              style={{
                backgroundColor: color,
                borderRadius: '5px 10px 10px 10px',
                ...(open && { transform: 'skew(-15deg) scaleY(0.6)' }),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Folder;
