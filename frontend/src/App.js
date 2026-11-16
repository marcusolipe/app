import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/react";
import ClerkAuthProvider from "@/components/auth/ClerkAuthProvider";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import SectionPage from "@/pages/SectionPage";
import PostDetail from "@/pages/PostDetail";
import Reels from "@/pages/Reels";
import Admin from "@/pages/Admin";
import Agenda from "@/pages/Agenda";

const AuthWrap = ({ children }) => (
  <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">{children}</div>
);

function App() {
  return (
    <BrowserRouter>
      <ClerkAuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/noticias" element={<SectionPage type="noticia" />} />
              <Route path="/entrevistas" element={<SectionPage type="entrevista" />} />
              <Route path="/videos" element={<SectionPage type="video" />} />
              <Route path="/colunas" element={<SectionPage type="coluna" />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/post/:id" element={<PostDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/sign-in/*" element={<AuthWrap><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" withSignUp fallbackRedirectUrl="/admin" /></AuthWrap>} />
              <Route path="/sign-up/*" element={<AuthWrap><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/admin" /></AuthWrap>} />
            </Routes>
          </main>
          <Footer />
        </div>
        <Toaster richColors position="top-center" />
      </ClerkAuthProvider>
    </BrowserRouter>
  );
}

export default App;
