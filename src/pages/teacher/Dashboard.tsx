import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, BookOpen, Users } from "lucide-react";
import { toast } from "sonner";

interface WordSet {
  id: string;
  title: string;
  created_at: string;
  word_count: number;
  submission_count: number;
}

export default function TeacherDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/teacher/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadWordSets();
    }
  }, [user]);

  const loadWordSets = async () => {
    try {
      const { data: sets, error: setsError } = await supabase
        .from("word_sets")
        .select("id, title, created_at")
        .eq("teacher_id", user?.id)
        .order("created_at", { ascending: false });

      if (setsError) throw setsError;

      const setsWithCounts = await Promise.all(
        (sets || []).map(async (set) => {
          const [wordsResult, submissionsResult] = await Promise.all([
            supabase.from("words").select("id", { count: "exact" }).eq("word_set_id", set.id),
            supabase.from("submissions").select("id", { count: "exact" }).eq("word_set_id", set.id),
          ]);

          return {
            ...set,
            word_count: wordsResult.count || 0,
            submission_count: submissionsResult.count || 0,
          };
        })
      );

      setWordSets(setsWithCounts);
    } catch (error: any) {
      toast.error("Failed to load word sets");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your word sets and review student work</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Button onClick={() => navigate("/teacher/word-sets/new")} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Create New Word Set
        </Button>

        {wordSets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No word sets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first word set to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wordSets.map((set) => (
              <Card
                key={set.id}
                className="cursor-pointer hover:shadow-glow transition-all hover:border-primary"
                onClick={() => navigate(`/teacher/word-sets/${set.id}`)}
              >
                <CardHeader>
                  <CardTitle>{set.title}</CardTitle>
                  <CardDescription>
                    {new Date(set.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{set.word_count} words</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{set.submission_count} submissions</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
