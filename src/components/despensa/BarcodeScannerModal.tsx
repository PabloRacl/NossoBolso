import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Camera, X, Check, Search } from 'lucide-react';
import { PantryItem } from '../../tipos';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PantryItem[];
  onSelectFoundItem: (item: PantryItem) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  items,
  onSelectFoundItem,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Câmera não suportada neste navegador.');
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setCameraError('Permissão para acessar a câmera negada ou dispositivo indisponível.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    // Tentar localizar por nome ou termo parecido
    const found = items.find((i) =>
      i.name.toLowerCase().includes(manualCode.toLowerCase().trim())
    );

    if (found) {
      onSelectFoundItem(found);
      onClose();
    } else {
      alert(`Nenhum item em estoque encontrado para "${manualCode}".`);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Leitor de Código de Barras / Câmera">
      <div className="flex flex-col gap-4 py-2">
        {/* Visualização de Câmera */}
        <div className="relative w-full h-64 bg-[#0A0B0E] border-2 border-dashed border-[#00FF88]/50 rounded-2xl overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-4 text-center flex flex-col items-center gap-2 text-[#94A3B8]">
              <Camera className="w-10 h-10 text-[#FF4D6D]" />
              <p className="text-xs">{cameraError}</p>
              <p className="text-[11px] text-[#94A3B8]">
                Utilize a busca rápida manual abaixo para selecionar o item.
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Mira de Escaneamento */}
              <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-[#00FF88] rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.4)] pointer-events-none animate-pulse flex items-center justify-center">
                <span className="text-[10px] font-black uppercase text-[#00FF88] bg-[#0A0B0E]/80 px-2 py-0.5 rounded-md">
                  Posicione o código de barras aqui
                </span>
              </div>
            </>
          )}
        </div>

        {/* Busca Manual / Simulação de Leitura */}
        <form onSubmit={handleManualSearch} className="flex flex-col gap-2 pt-2 border-t border-[#1E2330]">
          <label className="text-xs font-bold text-[#94A3B8] uppercase">
            Ou busque / digite o nome do produto rápido:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex: Leite, Arroz, Sabão..."
              className="flex-1 h-11 px-4 bg-[#0A0B0E] border border-[#2E3B52] rounded-xl text-xs text-[#F8FAFC] focus:border-[#00FF88] focus:outline-none font-bold"
            />
            <Button variant="primary" type="submit" className="h-11">
              <Search className="w-4 h-4" />
              <span>Localizar</span>
            </Button>
          </div>
        </form>

        {/* Atalhos Rápidos dos Itens Necessários */}
        <div className="flex flex-col gap-1.5 pt-2">
          <span className="text-[10px] font-extrabold uppercase text-[#94A3B8]">
            Ou toque direto no item a marcar:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectFoundItem(item);
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#162032] border border-[#2E3B52] hover:border-[#00FF88] text-xs text-[#F8FAFC] font-bold transition-all text-left flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#00FF88]" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose} type="button">
            Fechar Câmera
          </Button>
        </div>
      </div>
    </Modal>
  );
};
