import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MessageSquare, Users, TrendingUp, Smile, Brain } from "lucide-react";

export const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalLeads: 0,
    activeToday: 0,
    avgEngagement: 0,
    topEmotion: "neutral",
  });

  useEffect(() => {
    fetchStats();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('analytics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emotion_analysis' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const [conversations, messages, leads, emotions] = await Promise.all([
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('emotion_analysis').select('*'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const { count: activeToday } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Calculate emotion analytics
      let avgEngagement = 0;
      let topEmotion = "neutral";
      
      if (emotions.data && emotions.data.length > 0) {
        avgEngagement = Math.round(
          emotions.data.reduce((sum, e) => sum + (e.engagement_score || 0), 0) / emotions.data.length
        );

        // Find most common emotion
        const emotionCounts = emotions.data.reduce((acc, e) => {
          acc[e.emotion] = (acc[e.emotion] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";
      }

      setStats({
        totalConversations: conversations.count || 0,
        totalMessages: messages.count || 0,
        totalLeads: leads.count || 0,
        activeToday: activeToday || 0,
        avgEngagement,
        topEmotion,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const statCards = [
    {
      title: "Total Conversations",
      value: stats.totalConversations,
      icon: MessageSquare,
      color: "text-primary",
    },
    {
      title: "Messages Exchanged",
      value: stats.totalMessages,
      icon: BarChart3,
      color: "text-accent",
    },
    {
      title: "Leads Captured",
      value: stats.totalLeads,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Active Today",
      value: stats.activeToday,
      icon: TrendingUp,
      color: "text-accent",
    },
    {
      title: "Avg Engagement",
      value: `${stats.avgEngagement}%`,
      icon: Brain,
      color: "text-primary",
    },
    {
      title: "Top Emotion",
      value: stats.topEmotion,
      icon: Smile,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="bg-card border-border hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground capitalize">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};