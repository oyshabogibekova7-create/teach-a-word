import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";

export default function CreateWordSet() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [words, setWords] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const addWord = () => {
    setWords([...words, ""]);
  };

  const removeWord = (index: number) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const updateWord = (index: number, value: string) => {
    const newWords = [...words];
    newWords[index] = value;
    setWords(newWords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredWords = words.filter((w) => w.trim() !== "");
    if (!title.trim() || filteredWords.length === 0) {
      toast.error("Please provide a title and at least one word");
      return;
    }

    setLoading(true);

    try {
      const { data: wordSet, error: setError } = await supabase
        .from("word_sets")
        .insert({ title, teacher_id: user?.id })
        .select()
        .single();

      if (setError) throw setError;

      const wordsToInsert = filteredWords.map((word, index) => ({
        word_set_id: wordSet.id,
        word: word.trim(),
        position: index,
      }));

      const { error: wordsError } = await supabase.from("words").insert(wordsToInsert);

      if (wordsError) throw wordsError;

      toast.success("Word set created successfully!");
      navigate("/teacher/dashboard");
    } catch (error: any) {
      toast.error("Failed to create word set");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Create New Word Set</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Word Set Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Lesson 1 Vocabulary"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Words</Label>
                {words.map((word, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={word}
                      onChange={(e) => updateWord(index, e.target.value)}
                      placeholder={`Word ${index + 1}`}
                    />
                    {words.length > 1 && (
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
                  Add Another Word
                </Button>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating..." : "Create Word Set"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
