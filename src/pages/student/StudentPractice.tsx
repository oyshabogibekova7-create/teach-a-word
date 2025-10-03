import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface Teacher {
  id: string;
  full_name: string;
}

interface WordSet {
  id: string;
  title: string;
}

interface Word {
  id: string;
  word: string;
  position: number;
}

export default function StudentPractice() {
  const [step, setStep] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [selectedWordSetId, setSelectedWordSetId] = useState("");
  
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentSentence, setCurrentSentence] = useState("");
  const [answers, setAnswers] = useState<{ word_id: string; sentence: string }[]>([]);
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
  }, []);

  useEffect(() => {
    if (selectedTeacherId) {
      loadWordSets();
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    if (selectedWordSetId) {
      loadWords();
    }
  }, [selectedWordSetId]);

  const loadTeachers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (error) {
      toast.error("Failed to load teachers");
    } else {
      setTeachers(data || []);
    }
  };

  const loadWordSets = async () => {
    const { data, error } = await supabase
      .from("word_sets")
      .select("id, title")
      .eq("teacher_id", selectedTeacherId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load word sets");
    } else {
      setWordSets(data || []);
    }
  };

  const loadWords = async () => {
    const { data, error } = await supabase
      .from("words")
      .select("id, word, position")
      .eq("word_set_id", selectedWordSetId)
      .order("position");

    if (error) {
      toast.error("Failed to load words");
    } else {
      setWords(data || []);
    }
  };

  const handleNextWord = () => {
    if (!currentSentence.trim()) {
      toast.error("Please write a sentence");
      return;
    }

    const newAnswers = [
      ...answers,
      { word_id: words[currentWordIndex].id, sentence: currentSentence.trim() },
    ];
    setAnswers(newAnswers);
    setCurrentSentence("");

    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (finalAnswers: { word_id: string; sentence: string }[]) => {
    setLoading(true);

    try {
      const { data: submission, error: subError } = await supabase
        .from("submissions")
        .insert({
          word_set_id: selectedWordSetId,
          student_name: studentName,
        })
        .select()
        .single();

      if (subError) throw subError;

      const answersToInsert = finalAnswers.map((a) => ({
        submission_id: submission.id,
        word_id: a.word_id,
        sentence: a.sentence,
      }));

      const { error: answersError } = await supabase.from("answers").insert(answersToInsert);

      if (answersError) throw answersError;

      toast.success("Great work! Your answers have been submitted.");
      setStep(5);
    } catch (error: any) {
      toast.error("Failed to submit answers");
    } finally {
      setLoading(false);
    }
  };

  const startPractice = () => {
    if (!selectedTeacherId || !studentName.trim() || !selectedWordSetId) {
      toast.error("Please complete all fields");
      return;
    }
    setStep(4);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Teacher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    setStep(2);
                  }}
                  className="w-full p-3 rounded-lg border border-input bg-background"
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Name</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g., Sarah Johnson"
                />
              </div>
              <Button onClick={() => setStep(3)} disabled={!studentName.trim()}>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose a Word Set</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wordSets.length === 0 ? (
                <p className="text-muted-foreground">No word sets available yet.</p>
              ) : (
                <div className="space-y-2">
                  {wordSets.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setSelectedWordSetId(ws.id);
                        startPractice();
                      }}
                      className="w-full p-4 text-left rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      {ws.title}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === 4 && words.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Word {currentWordIndex + 1} of {words.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <p className="text-4xl font-bold text-primary mb-2">
                  {words[currentWordIndex].word}
                </p>
                <p className="text-muted-foreground">Write a sentence using this word</p>
              </div>

              <div className="space-y-2">
                <Label>Your Sentence</Label>
                <Textarea
                  value={currentSentence}
                  onChange={(e) => setCurrentSentence(e.target.value)}
                  placeholder="Write your sentence here..."
                  rows={4}
                />
              </div>

              <Button onClick={handleNextWord} size="lg" className="w-full" disabled={loading}>
                {currentWordIndex < words.length - 1 ? (
                  <>
                    Next Word
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Submit All Answers
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 5 && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <CheckCircle className="w-16 h-16 mx-auto text-success" />
              <h2 className="text-2xl font-bold">Great Job!</h2>
              <p className="text-muted-foreground">
                Your sentences have been submitted to your teacher.
              </p>
              <Button onClick={() => navigate("/")} size="lg">
                Done
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
