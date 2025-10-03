import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, User, RotateCcw, Edit, Trash2, Plus, X, Save } from "lucide-react";
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

interface Word {
  id: string;
  word: string;
  position: number;
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
  const [words, setWords] = useState<Word[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedWords, setEditedWords] = useState<Word[]>([]);

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

      const { data: wordsData, error: wordsError } = await supabase
        .from("words")
        .select("id, word, position")
        .eq("word_set_id", id)
        .order("position");

      if (wordsError) throw wordsError;
      setWords(wordsData || []);
      setEditedWords(wordsData || []);

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

  const handleDeleteWordSet = async () => {
    try {
      const { error } = await supabase
        .from("word_sets")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Word set deleted successfully");
      navigate("/teacher/dashboard");
    } catch (error: any) {
      toast.error("Failed to delete word set");
    }
  };

  const handleSaveWords = async () => {
    try {
      // Delete all existing words
      const { error: deleteError } = await supabase
        .from("words")
        .delete()
        .eq("word_set_id", id);

      if (deleteError) throw deleteError;

      // Insert updated words
      const wordsToInsert = editedWords
        .filter((w) => w.word.trim() !== "")
        .map((w, index) => ({
          word_set_id: id,
          word: w.word.trim(),
          position: index,
        }));

      const { error: insertError } = await supabase
        .from("words")
        .insert(wordsToInsert);

      if (insertError) throw insertError;

      toast.success("Words updated successfully");
      setEditMode(false);
      loadData();
    } catch (error: any) {
      toast.error("Failed to update words");
    }
  };

  const addWord = () => {
    setEditedWords([
      ...editedWords,
      { id: `temp-${Date.now()}`, word: "", position: editedWords.length },
    ]);
  };

  const removeWord = (index: number) => {
    setEditedWords(editedWords.filter((_, i) => i !== index));
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...editedWords];
    newWords[index].word = value;
    setEditedWords(newWords);
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
            <div className="flex items-center justify-between">
              <CardTitle>{wordSet.title}</CardTitle>
              <div className="flex gap-2">
                {editMode ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => {
                      setEditMode(false);
                      setEditedWords(words);
                    }}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveWords}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Words
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Set
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete word set?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this word set and all associated submissions.
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteWordSet}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {editMode ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Edit Words</h3>
                {editedWords.map((word, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={word.word}
                      onChange={(e) => updateWord(index, e.target.value)}
                      placeholder={`Word ${index + 1}`}
                    />
                    {editedWords.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeWord(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addWord} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Word
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Words ({words.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {words.map((word) => (
                      <span key={word.id} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm">
                        {word.word}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-semibold mb-4">Student Submissions</h3>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
