import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, GraduationCap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            VocabPractice
          </h1>
          <p className="text-xl text-muted-foreground">
            Master vocabulary through sentence writing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/student">
            <Card className="p-8 hover:shadow-glow transition-all cursor-pointer border-2 hover:border-primary">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">I'm a Student</h2>
                  <p className="text-muted-foreground">
                    Practice vocabulary by writing sentences with words from your teacher
                  </p>
                </div>
                <Button className="w-full" size="lg">
                  Start Practice
                </Button>
              </div>
            </Card>
          </Link>

          <Link to="/teacher/login">
            <Card className="p-8 hover:shadow-glow transition-all cursor-pointer border-2 hover:border-primary">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">I'm a Teacher</h2>
                  <p className="text-muted-foreground">
                    Create word sets and review student submissions
                  </p>
                </div>
                <Button className="w-full" size="lg">
                  Teacher Login
                </Button>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
