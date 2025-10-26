import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Snowflake, TrendingUp } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  lead_score: number;
  score_category: string;
  interest: string | null;
  status: string;
  created_at: string;
}

export const LeadScoring = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scoreStats, setScoreStats] = useState({
    hot: 0,
    warm: 0,
    cold: 0,
    avgScore: 0,
  });

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel("lead-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, fetchLeads)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("lead_score", { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        setLeads(data);

        const hot = data.filter((l) => l.score_category === "hot").length;
        const warm = data.filter((l) => l.score_category === "warm").length;
        const cold = data.filter((l) => l.score_category === "cold").length;
        const avgScore = data.length > 0
          ? Math.round(data.reduce((sum, l) => sum + l.lead_score, 0) / data.length)
          : 0;

        setScoreStats({ hot, warm, cold, avgScore });
      }
    } catch (error) {
      console.error("Error fetching leads:", error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "hot":
        return <Flame className="w-4 h-4" />;
      case "warm":
        return <Zap className="w-4 h-4" />;
      default:
        return <Snowflake className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "hot":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warm":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Lead Scoring</h2>
      </div>

      {/* Score Distribution */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Hot Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              <span className="text-2xl font-bold text-foreground">{scoreStats.hot}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Warm Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-foreground">{scoreStats.warm}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Cold Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Snowflake className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-foreground">{scoreStats.cold}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">{scoreStats.avgScore}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Leads */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Top Scored Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No leads yet. Start conversations to generate leads!
              </p>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getCategoryColor(lead.score_category)}>
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(lead.score_category)}
                        {lead.score_category.toUpperCase()}
                      </span>
                    </Badge>
                    <div>
                      <p className="font-semibold text-foreground">{lead.name}</p>
                      {lead.email && (
                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                      )}
                      {lead.interest && (
                        <p className="text-xs text-muted-foreground">
                          Interest: {lead.interest}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{lead.lead_score}</div>
                    <p className="text-xs text-muted-foreground">score</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
