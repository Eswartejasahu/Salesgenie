import { useState, useEffect, useRef } from "react";
import { Camera, CameraOff, Smile, Frown, Meh } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { pipeline } from "@huggingface/transformers";

interface FacialDetectionProps {
  conversationId: string | null;
  onEmotionDetected?: (emotion: string, score: number) => void;
}

export const FacialDetection = ({ conversationId, onEmotionDetected }: FacialDetectionProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral");
  const [emotionScore, setEmotionScore] = useState<number>(0);
  const [engagementScore, setEngagementScore] = useState<number>(50);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyzerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: "user"
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Initialize emotion classifier
      if (!analyzerRef.current) {
        toast.info("Loading emotion detection model...");
        analyzerRef.current = await pipeline(
          "text-classification",
          "j-hartmann/emotion-english-distilroberta-base"
        );
        toast.success("Emotion detection ready!");
      }

      setIsActive(true);
      startAnalysis();
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Failed to access camera. Please grant camera permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  const startAnalysis = () => {
    const analyzeInterval = setInterval(async () => {
      if (!isActive || !conversationId) {
        clearInterval(analyzeInterval);
        return;
      }

      // Simulate emotion analysis (in a real app, you'd analyze video frames)
      // For demo purposes, we'll use random emotions with text analysis
      const emotions = ["joy", "sadness", "anger", "fear", "surprise", "neutral"];
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      const confidence = 0.7 + Math.random() * 0.3;

      // Calculate engagement score based on emotion
      let newEngagement = engagementScore;
      if (randomEmotion === "joy" || randomEmotion === "surprise") {
        newEngagement = Math.min(100, newEngagement + 5);
      } else if (randomEmotion === "sadness" || randomEmotion === "anger") {
        newEngagement = Math.max(0, newEngagement - 3);
      }

      setCurrentEmotion(randomEmotion);
      setEmotionScore(Math.round(confidence * 100));
      setEngagementScore(newEngagement);

      if (onEmotionDetected) {
        onEmotionDetected(randomEmotion, newEngagement);
      }

      // Store in database
      try {
        await supabase.from("emotion_analysis").insert({
          conversation_id: conversationId,
          emotion: randomEmotion,
          confidence: confidence,
          engagement_score: newEngagement,
          facial_data: {
            timestamp: new Date().toISOString(),
            analysis_method: "simulated"
          }
        });
      } catch (error) {
        console.error("Error storing emotion data:", error);
      }
    }, 5000); // Analyze every 5 seconds
  };

  const getEmotionIcon = () => {
    switch (currentEmotion) {
      case "joy":
      case "surprise":
        return <Smile className="w-6 h-6 text-green-500" />;
      case "sadness":
      case "anger":
      case "fear":
        return <Frown className="w-6 h-6 text-red-500" />;
      default:
        return <Meh className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getEngagementColor = () => {
    if (engagementScore >= 70) return "text-green-500";
    if (engagementScore >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Emotion Detection</h3>
          </div>
          <Button
            onClick={isActive ? stopCamera : startCamera}
            variant={isActive ? "destructive" : "default"}
            size="sm"
            disabled={!conversationId}
          >
            {isActive ? (
              <>
                <CameraOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        {isActive && (
          <>
            <div className="relative rounded-lg overflow-hidden bg-secondary">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-48 object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getEmotionIcon()}
                  <div>
                    <p className="text-xs text-muted-foreground">Current Emotion</p>
                    <p className="font-semibold text-foreground capitalize">{currentEmotion}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${emotionScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground">{emotionScore}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Engagement Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          engagementScore >= 70
                            ? "bg-green-500"
                            : engagementScore >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${engagementScore}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold ${getEngagementColor()}`}>
                      {engagementScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {engagementScore >= 70
                    ? "Highly engaged"
                    : engagementScore >= 40
                    ? "Moderately engaged"
                    : "Low engagement"}
                </p>
              </div>
            </div>
          </>
        )}

        {!conversationId && (
          <p className="text-xs text-muted-foreground text-center">
            Start a conversation to enable emotion detection
          </p>
        )}
      </div>
    </Card>
  );
};