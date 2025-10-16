import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { DashboardHeader, Sidebar } from '@/features/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { useBrokerContext } from '@/shared/context/BrokerContext'; // âœ… Hook correto
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // âœ… Usar hook correto useAvalon
  const { isConnected, isLoading: avalonLoading, connect, disconnect, checkStatus } = useBrokerContext();
  
  const [brokerId, setBrokerId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // âœ… FUNÃ‡ÃƒO getUser (SEM useEffect dentro)
  const getUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user);
        // Load profile data from profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const nameParts = profile.full_name?.split(' ') || ['', ''];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.slice(1).join(' ') || '');
          setWhatsapp(user.user_metadata?.whatsapp || '');
          // âœ… CARREGAR broker_user_id do banco
          setBrokerId(profile.broker_user_id || '');
        }
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      navigate('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  // âœ… useEffect SEPARADO (fora da funÃ§Ã£o getUser)
  useEffect(() => {
    getUser();
  }, []);

  // Check broker connection status when user is loaded
  useEffect(() => {
    if (user?.id) {
      checkStatus(user.id);
    }
  }, [user?.id, checkStatus]);

  // Handle profile data save
  const handleSaveProfile = async () => {
    if (!user) return;

    // Validation
    if (!firstName.trim()) {
      toast.error('Nome Ã© obrigatÃ³rio');
      return;
    }

    if (!lastName.trim()) {
      toast.error('Sobrenome Ã© obrigatÃ³rio');
      return;
    }

    if (whatsapp && !/^\+?\d{10,15}$/.test(whatsapp.replace(/[\s-]/g, ''))) {
      toast.error('NÃºmero de WhatsApp invÃ¡lido');
      return;
    }

    setIsSavingProfile(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          whatsapp: whatsapp,
        },
      });

      if (error) {
        console.error('âŒ Error updating user:', error);
        toast.error('Erro ao atualizar dados');
        return;
      }

      // âœ… TAMBÃ‰M ATUALIZAR na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: `${firstName} ${lastName}`,
          // âœ… SALVAR broker_user_id quando salvar perfil
          broker_user_id: brokerId || null,
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('âŒ Error updating profile:', profileError);
        toast.error('Erro ao atualizar perfil');
        return;
      }

      console.log('âœ… Profile updated successfully');
      toast.success('Dados salvos com sucesso!');
    } catch (err) {
      console.error('âŒ Unexpected error:', err);
      toast.error('Erro inesperado');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // âœ… NOVA FUNÃ‡ÃƒO - Salvar apenas broker settings
  const handleSaveBrokerSettings = async () => {
    if (!user || !brokerId.trim()) {
      toast.error('User ID da corretora Ã© obrigatÃ³rio');
      return;
    }
    
    setIsSavingProfile(true);
    try {
      console.log('ðŸ’¾ Salvando broker ID:', brokerId, 'para user:', user.id);
      
      // Salvar broker_user_id na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update({ broker_user_id: brokerId.trim() })
        .eq('user_id', user.id);

      if (error) {
        console.error('âŒ Error saving broker ID:', error);
        toast.error('Erro ao salvar ID da corretora');
        return;
      }

      console.log('âœ… Broker ID salvo com sucesso!');
      toast.success('ID da corretora salvo com sucesso!');
    } catch (err) {
      console.error('âŒ Unexpected error:', err);
      toast.error('Erro inesperado');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Senhas nÃ£o coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Senha deve ter no mÃ­nimo 6 caracteres');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error('Erro ao atualizar senha');
        return;
      }

      toast.success('Senha alterada com sucesso!');
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Erro inesperado');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <Sidebar />
        <main className="lg:ml-64 container mx-auto px-4 py-20 pb-24 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span>Carregando configurações...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {user ? (
        <DashboardHeader user={user} />
      ) : (
        <div className="fixed top-0 left-0 right-0 h-16 glass border-b border-border/50" />
      )}
      <Sidebar />
      <main className="lg:ml-64 container mx-auto px-4 py-6 pb-24">
        <div className="space-y-6 max-w-3xl mx-auto">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure your trading bot parameters
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Broker Connection */}
            <Card>
              <CardHeader>
                <CardTitle>Broker Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brokerId">User ID</Label>
                  <Input
                    id="brokerId"
                    type="text"
                    placeholder="Enter your Avalon Broker User ID"
                    value={brokerId}
                    onChange={(e) => setBrokerId(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={async () => {
                    if (!user) return;

                    await handleSaveBrokerSettings();

                    if (!isConnected) {
                      await connect(user.id);
                    } else {
                      await disconnect(user.id);
                    }
                  }}
                  disabled={avalonLoading || !brokerId.trim() || !user}
                  className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-11 md:h-10 text-base md:text-sm"
                >
                  {avalonLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    isConnected ? 'Disconnect' : 'Connect Broker'
                  )}
                </Button>

                <div className="flex items-center space-x-2">
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Dados Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="whatsapp">Número WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    placeholder="+55 11 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Usado para notificações e suporte</p>
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-1 bg-card/80"
                  />
                  <p className="text-sm text-muted-foreground mt-1">E-mail vinculado à sua conta</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Dados'
                    )}
                  </Button>

                  <Button onClick={() => setShowPasswordDialog(true)} variant="outline">
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Operation Parameters and Risk Management settings have been moved to the Operations page for easier access during trading.
            </p>
          </div>
        </div>
      </main>

      {/* Password Update Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite sua nova senha abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              disabled={isUpdatingPassword}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Senha'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
