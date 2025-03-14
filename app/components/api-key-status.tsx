// app/components/api-key-status.tsx
import { Badge } from './ui/badge';
import { Tooltip } from './ui/tooltip';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ApiKeyStatusProps {
  permissions: string[];
  isValidating: boolean;
}

export function ApiKeyStatus({ permissions, isValidating }: ApiKeyStatusProps) {
  const hasSpot = permissions.includes('spot');
  const hasMargin = permissions.includes('margin');
  const hasFutures = permissions.includes('futures');
  const hasWithdraw = permissions.includes('withdraw');
  
  // Determinar o nível de segurança
  const securityLevel = hasWithdraw 
    ? 'high-risk' 
    : (hasMargin || hasFutures) 
      ? 'medium-risk' 
      : 'safe';
  
  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant="outline" 
        className={`
          ${securityLevel === 'safe' ? 'bg-green-50 text-green-700 border-green-200' : ''}
          ${securityLevel === 'medium-risk' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
          ${securityLevel === 'high-risk' ? 'bg-red-50 text-red-700 border-red-200' : ''}
          ${isValidating ? 'animate-pulse' : ''}
        `}
      >
        {isValidating ? (
          'Validando...'
        ) : (
          <div className="flex items-center">
            {securityLevel === 'safe' && <ShieldCheck className="h-3 w-3 mr-1" />}
            {securityLevel === 'medium-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
            {securityLevel === 'high-risk' && <AlertTriangle className="h-3 w-3 mr-1" />}
            
            {securityLevel === 'safe' && 'Segura'}
            {securityLevel === 'medium-risk' && 'Moderada'}
            {securityLevel === 'high-risk' && 'Alto Risco'}
          </div>
        )}
      </Badge>
      
      <Tooltip content={`Permissões: ${permissions.join(', ')}`}>
        <Badge variant="outline" className="cursor-help">
          {permissions.length} permissões
        </Badge>
      </Tooltip>
    </div>
  );
}