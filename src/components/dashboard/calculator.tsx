'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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

  // Use refs to keep track of state for the event listener without re-binding
  const displayRef = useRef(display);
  const equationRef = useRef(equation);

  useEffect(() => {
    displayRef.current = display;
    equationRef.current = equation;
  }, [display, equation]);

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

  const handleNumber = useCallback((num: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return num;
      if (num === '.' && prev.includes('.')) return prev;
      return prev + num;
    });
  }, []);

  const handleOperator = useCallback((op: string) => {
    const currentDisplay = displayRef.current;
    const currentEquation = equationRef.current;

    if (currentDisplay === 'Error') return;
    
    let newEq = '';
    if (currentDisplay === '0' && currentEquation.length > 0) {
      // If user clicks operator multiple times without entering a number, swap operator
      newEq = currentEquation.trim().slice(0, -1).trim() + ' ' + op + ' ';
    } else {
      newEq = currentEquation + currentDisplay + ' ' + op + ' ';
    }
    
    setEquation(newEq);
    setDisplay('0');
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setEquation('');
  }, []);

  const handleCalculate = useCallback(() => {
    const currentDisplay = displayRef.current;
    const currentEquation = equationRef.current;

    if (currentDisplay === 'Error') return;
    
    const fullExpression = (currentEquation + currentDisplay).trim();
    if (!fullExpression) return;

    try {
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
      setEquation('');
    }
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error' || prev.length === 0) return '0';
      const next = prev.slice(0, -1);
      return next === '' ? '0' : next;
    });
  }, []);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent double triggers by checking if target is an input (unlikely here but good practice)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Numbers
      if (/[0-9]/.test(e.key)) {
        handleNumber(e.key);
      } 
      // Operators
      else if (['+', '-', '*', '/'].includes(e.key)) {
        handleOperator(e.key);
      } 
      // Calculate
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } 
      // Clear
      else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      } 
      // Backspace
      else if (e.key === 'Backspace') {
        handleBackspace();
      }
      // Decimal
      else if (e.key === '.') {
        handleNumber('.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNumber, handleOperator, handleCalculate, handleClear, handleBackspace]);

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
        <div className="flex items-center gap-2 font-headline text-sm font-semibold text-primary">
          <CalculatorIcon className="h-4 w-4" />
          OX calculator
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
          <Button variant="outline" className="col-span-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 font-bold" onClick={handleClear}>Clear</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('/')}>÷</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('*')}>×</Button>
          
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('7')}>7</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('8')}>8</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('9')}>9</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('-')}>−</Button>

          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('4')}>4</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('5')}>5</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('6')}>6</Button>
          <Button variant="secondary" className="font-bold text-lg" onClick={() => handleOperator('+')}>+</Button>

          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('1')}>1</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('2')}>2</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('3')}>3</Button>
          <Button variant="default" className="row-span-2 bg-primary text-xl font-bold shadow-md hover:shadow-lg transition-shadow" onClick={handleCalculate}>=</Button>

          <Button variant="outline" size="lg" className="col-span-2 text-lg font-semibold" onClick={() => handleNumber('0')}>0</Button>
          <Button variant="outline" size="lg" className="text-lg font-semibold" onClick={() => handleNumber('.')}>.</Button>
        </div>
      </div>
    </div>
  );
}
