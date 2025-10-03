import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Answer {
  word: string;
  sentence: string;
}

export default function StudentAnswers() {
  const { id, studentName } = useParams();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [wordSetTitle, setWordSetTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && studentName) {
      loadAnswers();
    }
  }, [id, studentName]);

  const loadAnswers = async () => {
    try {
      const { data: wordSet, error: setError } = await supabase
        .from("word_sets")
        .select("title")
        .eq("id", id)
        .single();

      if (setError) throw setError;
      setWordSetTitle(wordSet.title);

      const { data: submissions, error: subError } = await supabase
        .from("submissions")
        .select(`
          id,
          answers (
            sentence,
            words (word)
          )
        `)
        .eq("word_set_id", id)
        .eq("student_name", decodeURIComponent(studentName || ""))
        .order("created_at", { ascending: false })
        .limit(1);

      if (subError) throw subError;

      if (submissions && submissions[0]) {
        const answersData = (submissions[0].answers as any[]).map((a: any) => ({
          word: a.words.word,
          sentence: a.sentence,
        }));
        setAnswers(answersData);
      }
    } catch (error: any) {
      toast.error("Failed to load answers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          to={`/teacher/word-sets/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to submissions
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>
              {decodeURIComponent(studentName || "")} - {wordSetTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div key={index} className="p-4 rounded-lg border border-border">
                  <p className="text-sm font-medium text-primary mb-2">
                    Word: {answer.word}
                  </p>
                  <p className="text-foreground">{answer.sentence}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
