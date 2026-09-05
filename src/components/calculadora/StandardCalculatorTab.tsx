import React from 'react';
import { Card } from '../ui/Card';
import { Delete } from 'lucide-react';

interface StandardCalculatorTabProps {
  calcDisplay: string;
  calcExpression: string;
  onClear: () => void;
  onDelete: () => void;
  onEvaluate: () => void;
  onClickValue: (val: string) => void;
}

export const StandardCalculatorTab: React.FC<StandardCalculatorTabProps> = ({
  calcDisplay,
  calcExpression,
  onClear,
  onDelete,
  onEvaluate,
  onClickValue,
}) => {
  return (
    <div className="flex justify-center w-full animate-fadeIn">
      <Card className="w-full max-w-md p-6 flex flex-col gap-4 border-t-4 border-t-[#00FF88] shadow-2xl">
        {/* Visor Digital */}
        <div className="flex flex-col items-end justify-end p-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-2xl h-24 text-right">
          <span className="text-xs font-mono text-[#64748B] h-5">{calcExpression || '0'}</span>
          <span className="text-3xl font-black font-mono text-[#00FF88] tracking-wider overflow-x-auto max-w-full">
            {calcDisplay}
          </span>
        </div>

        {/* Grid de Teclas */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            onClick={onClear}
            className="h-12 rounded-xl bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold hover:bg-[#EF4444]/25"
          >
            C
          </button>
          <button
            onClick={() => onClickValue('(')}
            className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC]"
          >
            (
          </button>
          <button
            onClick={() => onClickValue(')')}
            className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC]"
          >
            )
          </button>
          <button
            onClick={() => onClickValue('/')}
            className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25"
          >
            ÷
          </button>

          <button
            onClick={() => onClickValue('7')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            7
          </button>
          <button
            onClick={() => onClickValue('8')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            8
          </button>
          <button
            onClick={() => onClickValue('9')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            9
          </button>
          <button
            onClick={() => onClickValue('*')}
            className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25"
          >
            ×
          </button>

          <button
            onClick={() => onClickValue('4')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            4
          </button>
          <button
            onClick={() => onClickValue('5')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            5
          </button>
          <button
            onClick={() => onClickValue('6')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            6
          </button>
          <button
            onClick={() => onClickValue('-')}
            className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25"
          >
            -
          </button>

          <button
            onClick={() => onClickValue('1')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            1
          </button>
          <button
            onClick={() => onClickValue('2')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            2
          </button>
          <button
            onClick={() => onClickValue('3')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            3
          </button>
          <button
            onClick={() => onClickValue('+')}
            className="h-12 rounded-xl bg-[#00FF88]/15 text-[#00FF88] border border-[#00FF88]/30 font-bold hover:bg-[#00FF88]/25"
          >
            +
          </button>

          <button
            onClick={() => onClickValue('0')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            0
          </button>
          <button
            onClick={() => onClickValue('.')}
            className="h-12 rounded-xl bg-[#121929] text-[#F8FAFC] border border-[#2E3B52] font-extrabold hover:bg-[#1E293B]"
          >
            .
          </button>
          <button
            onClick={onDelete}
            className="h-12 rounded-xl bg-[#162032] text-[#94A3B8] border border-[#2E3B52] font-bold hover:text-[#F8FAFC] flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={onEvaluate}
            className="h-12 rounded-xl bg-[#00FF88] text-[#090D16] font-black text-lg hover:bg-[#00E577] shadow-[0_0_12px_rgba(0,255,136,0.3)]"
          >
            =
          </button>
        </div>
      </Card>
    </div>
  );
};
