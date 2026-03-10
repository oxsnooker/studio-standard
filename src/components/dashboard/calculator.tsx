'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calculator as CalculatorIcon } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Calculator({ isOpen, onOpenChange }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');

  const handleNumber = (num: string) => {
    setDisplay((prev) => {
      if (prev === '0' || prev === 'Error') return num;
      return prev + num;
    });
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
  };

  const handleCalculate = () => {
    if (display === 'Error' || !equation) return;
    try {
      const expression = (equation + display).replace(/[^-0-9+*/.]/g, '');
      const result = new Function(`return ${expression}`)();
      const formattedResult = Number(Number(result).toFixed(8)).toString();
      setDisplay(formattedResult);
      setEquation('');
    } catch (e) {
      setDisplay('Error');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <CalculatorIcon className="h-5 w-5 text-primary" /> Calculator
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="bg-muted/50 p-4 rounded-lg text-right border shadow-inner">
            <div className="text-xs text-muted-foreground h-4 overflow-hidden whitespace-nowrap font-mono">
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
      </DialogContent>
    </Dialog>
  );
}
