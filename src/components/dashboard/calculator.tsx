'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calculator as CalculatorIcon, X, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Calculator({ isOpen, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Initialize position to the top right area
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth - 360,
        y: 80
      });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Keep it within screen bounds roughly
      const boundedX = Math.max(0, Math.min(newX, window.innerWidth - 320));
      const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 400));
      
      setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleNumber = (num: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return num;
      return prev + num;
    });
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    
    // If user clicks operator multiple times without entering a number, swap operator
    if (display === '0' && equation.length > 0) {
      setEquation(prev => prev.trim().slice(0, -1).trim() + ' ' + op + ' ');
      return;
    }
    
    setEquation(prev => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleCalculate = () => {
    if (display === 'Error') return;
    try {
      const fullExpression = (equation + display).trim();
      if (!fullExpression) return;

      // Filter to allowed characters for safety
      const sanitized = fullExpression.replace(/[^-0-9+*/.]/g, '');
      
      // Use eval-like approach with Function for basic math
      const result = new Function(`return ${sanitized}`)();
      
      if (result === Infinity || isNaN(result)) {
        setDisplay('Error');
      } else {
        // Handle precision and convert to string
        const formattedResult = Number(Number(result).toPrecision(12)).toString();
        setDisplay(formattedResult);
      }
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={calculatorRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 1000,
      }}
      className={cn(
        "w-[320px] bg-card border rounded-lg shadow-2xl overflow-hidden select-none",
        isDragging ? "shadow-accent/40 scale-[1.02] transition-transform" : "transition-all"
      )}
    >
      {/* Drag Handle & Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between p-3 bg-muted/50 cursor-grab active:cursor-grabbing border-b"
      >
        <div className="flex items-center gap-2 font-headline text-sm font-semibold">
          <CalculatorIcon className="h-4 w-4 text-primary" />
          Calculator
        </div>
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground/30" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-muted/80 p-4 rounded-lg text-right border shadow-inner">
          <div className="text-xs text-muted-foreground h-4 overflow-x-auto whitespace-nowrap font-mono scrollbar-hide">
            {equation}
          </div>
          <div className="text-3xl font-mono font-bold truncate text-foreground">
            {display}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="outline" className="col-span-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={handleClear}>Clear</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('/')}>÷</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('*')}>×</Button>
          
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('7')}>7</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('8')}>8</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('9')}>9</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('-')}>−</Button>

          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('4')}>4</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('5')}>5</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('6')}>6</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('+')}>+</Button>

          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('1')}>1</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('2')}>2</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('3')}>3</Button>
          <Button variant="default" className="row-span-2 bg-primary text-xl font-bold" onClick={handleCalculate}>=</Button>

          <Button variant="outline" size="lg" className="col-span-2 text-lg" onClick={() => handleNumber('0')}>0</Button>
          <Button variant="outline" size="lg" className="text-lg" onClick={() => handleNumber('.')}>.</Button>
        </div>
      </div>
    </div>
  );
}
