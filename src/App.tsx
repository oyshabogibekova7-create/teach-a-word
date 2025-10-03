import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import StudentPractice from "./pages/student/StudentPractice";
import TeacherLogin from "./pages/teacher/Login";
import TeacherDashboard from "./pages/teacher/Dashboard";
import CreateWordSet from "./pages/teacher/CreateWordSet";
import WordSetDetail from "./pages/teacher/WordSetDetail";
import StudentAnswers from "./pages/teacher/StudentAnswers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/student" element={<StudentPractice />} />
            <Route path="/teacher/login" element={<TeacherLogin />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/word-sets/new" element={<CreateWordSet />} />
            <Route path="/teacher/word-sets/:id" element={<WordSetDetail />} />
            <Route path="/teacher/word-sets/:id/student/:studentName" element={<StudentAnswers />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
