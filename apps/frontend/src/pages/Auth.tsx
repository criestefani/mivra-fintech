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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-sans">MivraTech</h1>
          </div>
          <CardTitle className="text-2xl text-foreground font-sans">Bot de Trading Automático</CardTitle>
          <CardDescription className="text-muted-foreground">
            Faça login ou crie sua conta para começar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/40">
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
                <div className="text-xs text-muted-foreground bg-secondary/40 p-3 rounded border border-border font-sans">
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
  );
};

export default Auth;
