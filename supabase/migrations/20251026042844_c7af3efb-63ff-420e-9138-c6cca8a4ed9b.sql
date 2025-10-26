-- Create emotion_analysis table
CREATE TABLE public.emotion_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  emotion VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  facial_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emotion_analysis ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is a demo app)
CREATE POLICY "Allow all access to emotion_analysis"
ON public.emotion_analysis
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_emotion_analysis_conversation_id ON public.emotion_analysis(conversation_id);
CREATE INDEX idx_emotion_analysis_timestamp ON public.emotion_analysis(timestamp DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.emotion_analysis;