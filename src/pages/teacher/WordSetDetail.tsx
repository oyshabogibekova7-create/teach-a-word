import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, User, RotateCcw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface WordSet {
  id: string;
  title: string;
}

interface Submission {
  id: string;
  student_name: string;
  created_at: string;
}

export default function WordSetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wordSet, setWordSet] = useState<WordSet | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      const { data: set, error: setError } = await supabase
        .from("word_sets")
        .select("id, title")
        .eq("id", id)
        .single();

      if (setError) throw setError;
      setWordSet(set);

      const { data: subs, error: subsError } = await supabase
        .from("submissions")
        .select("id, student_name, created_at")
        .eq("word_set_id", id)
        .order("created_at", { ascending: false });

      if (subsError) throw subsError;
      setSubmissions(subs || []);
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async (studentName: string) => {
    try {
      const { error } = await supabase
        .from("submissions")
        .delete()
        .eq("word_set_id", id)
        .eq("student_name", studentName);

      if (error) throw error;

      toast.success(`Restarted progress for ${studentName}`);
      loadData();
    } catch (error: any) {
      toast.error("Failed to restart student progress");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!wordSet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Word set not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{wordSet.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No submissions yet. Students will appear here once they complete the practice.
              </p>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary transition-colors"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/teacher/word-sets/${id}/student/${encodeURIComponent(sub.student_name)}`)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{sub.student_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sub.created_at).toLocaleString()}
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restart
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restart student progress?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete all submissions from {sub.student_name} for this word set.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRestart(sub.student_name)}>
                            Restart
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
