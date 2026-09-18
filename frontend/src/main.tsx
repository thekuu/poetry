import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout.tsx';
import Home from './pages/Home.tsx';
import PoemDetail from './pages/PoemDetail.tsx';
import WritePoem from './pages/WritePoem.tsx';
import Admin from './pages/Admin.tsx';
import Login from './pages/Login.tsx';
import AdminLogin from './pages/AdminLogin.tsx';
import Register from './pages/Register.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="poems/:id" element={<PoemDetail />} />
                    <Route path="write" element={<WritePoem />} />
                    <Route path="admin" element={<Admin />} />
                    <Route path="login" element={<Login />} />
                    <Route path="admin-login" element={<AdminLogin />} />
                    <Route path="register" element={<Register />} />
                </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
);
