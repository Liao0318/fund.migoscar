import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionOptions {
  lang?: string;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export function useSpeechRecognition(options?: SpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (customLang?: string) => {
      setErrorMessage(null);
      setInterimTranscript('');
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        const err = '您的瀏覽器不支援 Web Speech 語音辨識 API（建議使用 Chrome / Safari / Edge）';
        setErrorMessage(err);
        options?.onError?.(err);
        return;
      }

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = customLang || options?.lang || 'zh-TW';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += text;
            } else {
              currentInterim += text;
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
          }

          if (finalTranscript) {
            setTranscript(finalTranscript);
            setInterimTranscript('');
            options?.onResult?.(finalTranscript, true);
          } else if (currentInterim) {
            options?.onResult?.(currentInterim, false);
          }
        };

        recognition.onerror = (event: any) => {
          let errorText = '語音辨識發生錯誤';
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            errorText = '請在瀏覽器網址列允許麥克風權限後重試';
          } else if (event.error === 'no-speech') {
            errorText = '未偵測到聲音，請靠靠近麥克風重試';
          } else if (event.error === 'network') {
            errorText = '網路連線異常，無法連線語音辨識服務';
          }
          setErrorMessage(errorText);
          setIsListening(false);
          options?.onError?.(errorText);
        };

        recognition.onend = () => {
          setIsListening(false);
          options?.onEnd?.();
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        const errorText = '啟動語音辨識失敗：' + (err?.message || '未知錯誤');
        setErrorMessage(errorText);
        setIsListening(false);
        options?.onError?.(errorText);
      }
    },
    [options]
  );

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    errorMessage,
    startListening,
    stopListening,
    toggleListening,
    setTranscript
  };
}
