-- Add lead scoring column to leads table
ALTER TABLE public.leads 
ADD COLUMN lead_score INTEGER DEFAULT 0,
ADD COLUMN score_category VARCHAR(20) DEFAULT 'cold',
ADD COLUMN last_score_update TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to calculate lead score
CREATE OR REPLACE FUNCTION public.calculate_lead_score(
  p_conversation_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_count INTEGER;
  v_avg_engagement DECIMAL;
  v_positive_emotions INTEGER;
  v_total_emotions INTEGER;
  v_lead_score INTEGER;
BEGIN
  -- Count messages in conversation
  SELECT COUNT(*) INTO v_message_count
  FROM messages
  WHERE conversation_id = p_conversation_id;

  -- Get average engagement score
  SELECT AVG(engagement_score) INTO v_avg_engagement
  FROM emotion_analysis
  WHERE conversation_id = p_conversation_id;

  -- Count positive vs total emotions
  SELECT 
    COUNT(CASE WHEN emotion IN ('joy', 'surprise') THEN 1 END),
    COUNT(*)
  INTO v_positive_emotions, v_total_emotions
  FROM emotion_analysis
  WHERE conversation_id = p_conversation_id;

  -- Calculate weighted score (0-100)
  v_lead_score := LEAST(100, GREATEST(0,
    (v_message_count * 5) + -- More messages = more engaged
    (COALESCE(v_avg_engagement, 50)) + -- Engagement score
    (CASE 
      WHEN v_total_emotions > 0 
      THEN (v_positive_emotions::DECIMAL / v_total_emotions * 30)
      ELSE 15
    END)::INTEGER -- Positive emotion ratio
  ));

  RETURN v_lead_score;
END;
$$;

-- Create function to update lead scores automatically
CREATE OR REPLACE FUNCTION public.update_lead_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead_id UUID;
  v_score INTEGER;
  v_category VARCHAR(20);
BEGIN
  -- Find lead for this conversation
  SELECT id INTO v_lead_id
  FROM leads
  WHERE conversation_id = NEW.conversation_id;

  IF v_lead_id IS NOT NULL THEN
    -- Calculate new score
    v_score := calculate_lead_score(NEW.conversation_id);

    -- Determine category
    v_category := CASE
      WHEN v_score >= 70 THEN 'hot'
      WHEN v_score >= 40 THEN 'warm'
      ELSE 'cold'
    END;

    -- Update lead
    UPDATE leads
    SET 
      lead_score = v_score,
      score_category = v_category,
      last_score_update = now()
    WHERE id = v_lead_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers to auto-update lead scores
CREATE TRIGGER update_lead_score_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_lead_score();

CREATE TRIGGER update_lead_score_on_emotion
AFTER INSERT ON emotion_analysis
FOR EACH ROW
EXECUTE FUNCTION update_lead_score();