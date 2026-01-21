import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export const VoiceInput = ({ onResult }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Web Speech APIをチェック
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.lang = 'ja-JP';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onResult]);

  const toggleListening = () => {
    if (!recognition) {
      alert('お使いのブラウザは音声認識に対応していません');
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  return (
    <button
      onClick={toggleListening}
      className={`
        p-4 rounded-full shadow-lg transition-all duration-300
        ${isListening 
          ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
          : 'bg-blue-600 hover:bg-blue-700'
        }
      `}
      title="音声入力"
    >
      {isListening ? (
        <MicOff className="w-6 h-6 text-white" />
      ) : (
        <Mic className="w-6 h-6 text-white" />
      )}
    </button>
  );
};

// 音声コマンドをパース
export const parseVoiceCommand = (text: string): { type: string; duration?: number; amount?: number } | null => {
  const normalized = text.toLowerCase().replace(/\s+/g, '');

  // 授乳パターン
  if (normalized.includes('授乳') || normalized.includes('じゅにゅう')) {
    const match = normalized.match(/(\d+)分/);
    if (match) {
      return { type: 'feeding', duration: parseInt(match[1]) };
    }
    return { type: 'feeding' };
  }

  // 睡眠パターン
  if (normalized.includes('寝る') || normalized.includes('ねる') || normalized.includes('睡眠')) {
    return { type: 'sleep' };
  }

  // うんちパターン
  if (normalized.includes('うんち') || normalized.includes('排便')) {
    return { type: 'poop' };
  }

  // しっこパターン
  if (normalized.includes('しっこ') || normalized.includes('おしっこ') || normalized.includes('排尿')) {
    const match = normalized.match(/(\d+)回/);
    if (match) {
      return { type: 'pee', amount: parseInt(match[1]) };
    }
    return { type: 'pee' };
  }

  // お風呂パターン
  if (normalized.includes('お風呂') || normalized.includes('おふろ') || normalized.includes('風呂')) {
    return { type: 'bath' };
  }

  // 離乳食パターン
  if (normalized.includes('離乳食') || normalized.includes('りにゅうしょく') || normalized.includes('ごはん')) {
    return { type: 'baby_food' };
  }

  return null;
};
