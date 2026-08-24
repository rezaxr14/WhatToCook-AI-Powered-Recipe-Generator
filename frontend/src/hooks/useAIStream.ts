import { useState, useCallback, useRef } from 'react';
import i18n from '../i18n';

interface UseAIStreamOptions {
  onChunk?: (chunk: string, accumulated: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export const useAIStream = (options?: UseAIStreamOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (recipeName: string, provider: string = 'gemini') => {
      setIsStreaming(true);
      setStreamedText('');
      setError(null);

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const url = `/api/ai/stream/recipe/?recipe=${encodeURIComponent(recipeName)}&provider=${encodeURIComponent(provider)}&language=${encodeURIComponent(i18n.language)}`;
        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: {
            Accept: 'text/event-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`Stream request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported on this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.replace('data: ', '').trim();
              if (!jsonStr) continue;

              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.chunk) {
                  accumulated += parsed.chunk;
                  setStreamedText(accumulated);
                  options?.onChunk?.(parsed.chunk, accumulated);
                }
                if (parsed.done) {
                  break;
                }
              } catch {
                // If not JSON, treat raw
                accumulated += jsonStr;
                setStreamedText(accumulated);
              }
            }
          }
        }

        options?.onComplete?.(accumulated);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        const errMsg = err.message || 'Stream generation failed';
        setError(errMsg);
        options?.onError?.(err);
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamedText,
    error,
    startStream,
    stopStream,
  };
};
