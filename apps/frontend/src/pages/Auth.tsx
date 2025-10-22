import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Mail, Lock, User, Loader2 } from "lucide-react";
import { z } from "zod";
import { DiagonalSection } from "@/components/ui/gamification";
// 🆕 IMPORTAR O SERVIÇO AVALON
import avalonService from "@/features/broker/services/avalon.service";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  fullName: z.string().trim().optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse(formData);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("Login realizado com sucesso!");
      navigate("/");
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  // 🆕 FUNÇÃO ATUALIZADA COM INTEGRAÇÃO AVALON
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse(formData);
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      // ✅ PASSO 1: Tentar criar na Avalon PRIMEIRO
      console.log('🔄 Testando criação na Avalon...');
      const avalonResult = await avalonService.createUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.fullName?.split(' ')[0] || 'Usuario',
        last_name: formData.fullName?.split(' ').slice(1).join(' ') || 'MivraTech',
        country_code: 'BR',
        locale: 'pt_BR',
      });

      if (!avalonResult.success) {
        toast.error(`Erro na corretora: ${avalonResult.error}`);
        console.error('❌ Falha na Avalon:', avalonResult);
        return;
      }

      console.log('✅ Usuário criado na Avalon:', avalonResult);

      // ✅ PASSO 2: Se Avalon OK, criar no Supabase
      console.log('🔄 Criando no Supabase...');
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName,
            avalon_user_id: avalonResult.userId, // 🆕 Salvar ID da Avalon
            avalon_created: true, // 🆕 Flag de controle
          },
        },
      });

      if (error) {
        console.error('❌ Erro no Supabase após Avalon criada:', error);
        toast.error(`Conta criada na corretora, mas erro no sistema: ${error.message}`);
        return;
      }

      console.log('✅ Usuário criado no Supabase');
      toast.success("Conta criada com sucesso nas duas plataformas! 🎉");
      navigate("/");

    } catch (error) {
      console.error('❌ Erro geral no cadastro:', error);
      toast.error("Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Organic Background Animation - REMOVED */}

      {/* Diagonal Header - Brand Section */}
      <DiagonalSection
        direction="top-left"
        gradientFrom="from-primary/40"
        className="h-48 lg:h-56 relative z-20"
      >
        <div className="relative z-30 flex flex-col items-center justify-center h-full text-center px-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Zap className="h-12 w-12 text-primary animate-pulse" />
            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              MivraTech
            </h1>
          </div>
          <p className="text-lg text-primary/80 font-semibold">Bot de Trading Automático</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Plataforma inteligente para negociação automática com segurança e rentabilidade
          </p>
        </div>
      </DiagonalSection>

      {/* Auth Form - Centered */}
      <div className="flex items-center justify-center px-4 -mt-24 lg:-mt-32 relative z-20">
        <Card className="w-full max-w-md glass shadow-2xl border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-xl">Acesso à Plataforma</CardTitle>
          <CardDescription className="text-center text-sm">
            Login ou cadastro para acessar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/20">
              <TabsTrigger value="login" className="text-muted-foreground data-[state=active]:text-foreground">
                Login
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-muted-foreground data-[state=active]:text-foreground">
                Cadastro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-sans">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-sans">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-sans"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-foreground font-sans">
                    Nome Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu Nome Completo"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup" className="text-foreground font-sans">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-signup"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup" className="text-foreground font-sans">
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password-signup"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 🆕 AVISO SOBRE A CORRETORA */}
                <div className="text-xs text-muted-foreground bg-slate-800/20 p-3 rounded border border-slate-700/30 font-sans">
                  <p>Ao se cadastrar, uma conta será criada automaticamente na nossa corretora parceira (Avalon Broker) usando seu email e senha.</p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-positive hover:bg-positive/90 text-positive-foreground font-sans"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Auth;
