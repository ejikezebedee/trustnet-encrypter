
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, Trash } from "lucide-react";

interface RecordVoiceMessageProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  language?: string;
}

export const RecordVoiceMessage: React.FC<RecordVoiceMessageProps> = ({
  onRecordingComplete,
  onCancel,
  language = "en"
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  // Translations
  const translations: Record<string, Record<string, string>> = {
    en: {
      startRecording: "Record voice message",
      stopRecording: "Stop recording",
      send: "Send",
      cancel: "Cancel",
      recording: "Recording",
    },
    es: {
      startRecording: "Grabar mensaje de voz",
      stopRecording: "Detener grabación",
      send: "Enviar",
      cancel: "Cancelar",
      recording: "Grabando",
    },
    ig: {
      startRecording: "Dee ozi olu",
      stopRecording: "Kwụsị ịdekọ",
      send: "Zie",
      cancel: "Kpochapụ",
      recording: "Na-edekọ",
    },
    sw: {
      startRecording: "Rekodi ujumbe wa sauti",
      stopRecording: "Acha kurekodi",
      send: "Tuma",
      cancel: "Ghairi",
      recording: "Inarekodi",
    },
    hi: {
      startRecording: "वॉइस संदेश रिकॉर्ड करें",
      stopRecording: "रिकॉर्डिंग रोकें",
      send: "भेजें",
      cancel: "रद्द करें",
      recording: "रिकॉर्डिंग",
    },
  };

  const t = (key: string): string => {
    return (translations[language] || translations.en)[key] || translations.en[key];
  };

  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks of the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Set timer to update recording time
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSendRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3 border rounded-lg bg-background">
      {!isRecording && !audioUrl ? (
        <div className="flex justify-center">
          <Button
            onClick={startRecording}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-primary" />
            {t("startRecording")}
          </Button>
        </div>
      ) : isRecording ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">{t("recording")}...</span>
            </div>
            <span className="text-sm font-mono">{formatTime(recordingTime)}</span>
          </div>
          
          <Button
            onClick={stopRecording}
            variant="outline"
            className="flex items-center gap-2 w-full"
          >
            <Square className="w-4 h-4 text-primary" />
            {t("stopRecording")}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {audioUrl && (
            <audio src={audioUrl} controls className="w-full" />
          )}
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSendRecording}
              className="flex items-center gap-2 flex-1"
            >
              <Send className="w-4 h-4" />
              {t("send")}
            </Button>
            
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
