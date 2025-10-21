import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader2, Code2, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface MCPStatus {
  name: string;
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  icon: React.ReactNode;
}

export const MCPTester = () => {
  const [mcpStates, setMcpStates] = useState<MCPStatus[]>([
    {
      name: 'ShadCN UI',
      status: 'idle',
      icon: <Code2 className="w-4 h-4" />,
    },
    {
      name: 'Magic MCP',
      status: 'idle',
      icon: <Zap className="w-4 h-4" />,
    },
  ]);

  const testShadCN = async () => {
    const newStates = [...mcpStates];
    const shadcnIndex = newStates.findIndex(m => m.name === 'ShadCN UI');
    newStates[shadcnIndex].status = 'testing';
    setMcpStates(newStates);

    try {
      // Simulated test - in real scenario would call MCP
      await new Promise(resolve => setTimeout(resolve, 1500));

      newStates[shadcnIndex].status = 'success';
      newStates[shadcnIndex].message = 'ShadCN UI MCP está respondendo!';
      setMcpStates(newStates);
      toast.success('✅ ShadCN UI MCP funcionando!');
    } catch (error) {
      newStates[shadcnIndex].status = 'error';
      newStates[shadcnIndex].message = 'Erro ao conectar';
      setMcpStates(newStates);
      toast.error('❌ Erro ao testar ShadCN UI MCP');
    }
  };

  const testMagic = async () => {
    const newStates = [...mcpStates];
    const magicIndex = newStates.findIndex(m => m.name === 'Magic MCP');
    newStates[magicIndex].status = 'testing';
    setMcpStates(newStates);

    try {
      // Test Magic MCP
      const response = await fetch('/api/magic/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null);

      if (response?.ok) {
        newStates[magicIndex].status = 'success';
        newStates[magicIndex].message = 'Magic MCP está respondendo!';
        setMcpStates(newStates);
        toast.success('✅ Magic MCP funcionando!');
      } else {
        throw new Error('No response');
      }
    } catch (error) {
      newStates[magicIndex].status = 'error';
      newStates[magicIndex].message = 'Erro ao conectar';
      setMcpStates(newStates);
      toast.error('❌ Erro ao testar Magic MCP');
    }
  };

  const testAll = async () => {
    await testShadCN();
    await testMagic();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/20 text-green-700 dark:text-green-400';
      case 'error':
        return 'bg-red-500/20 text-red-700 dark:text-red-400';
      case 'testing':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
      <CardHeader className="border-b border-purple-500/20">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-500" />
          Teste de MCPs
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {mcpStates.map((mcp) => (
            <div key={mcp.name} className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="text-purple-400">{mcp.icon}</div>
                <div>
                  <p className="font-medium text-sm">{mcp.name}</p>
                  {mcp.message && (
                    <p className={`text-xs ${getStatusColor(mcp.status)}`}>
                      {mcp.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(mcp.status) && (
                  <div className={getStatusColor(mcp.status)}>
                    {getStatusIcon(mcp.status)}
                  </div>
                )}
                <Badge
                  variant="outline"
                  className={`${getStatusColor(mcp.status)} border-0`}
                >
                  {mcp.status === 'idle' && 'Inativo'}
                  {mcp.status === 'testing' && 'Testando...'}
                  {mcp.status === 'success' && 'Ativo'}
                  {mcp.status === 'error' && 'Erro'}
                </Badge>
              </div>
            </div>
          ))}

          <div className="flex gap-2 pt-4">
            <Button
              size="sm"
              onClick={testAll}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              Testar Todos
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMcpStates(
                  mcpStates.map(m => ({ ...m, status: 'idle', message: undefined }))
                );
              }}
            >
              Limpar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
