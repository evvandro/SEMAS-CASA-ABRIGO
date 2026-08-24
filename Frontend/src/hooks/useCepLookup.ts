import axios from 'axios';
import { useRef, useState } from 'react';

export interface CepAddress {
  logradouro: string;
  bairro: string;
  municipio: string;
  uf: string;
}

/**
 * Consulta de endereço por CEP: ViaCEP com fallback BrasilAPI.
 * Usa axios "cru" (sem a instância `api`) para não enviar o Bearer token
 * nem disparar o toast global de erro em domínios externos.
 */
export function useCepLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCep = useRef('');

  const lookup = async (rawCep: string): Promise<CepAddress | null> => {
    const cep = rawCep.replace(/\D/g, '');
    if (cep.length !== 8 || cep === lastCep.current) return null;
    lastCep.current = cep;

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get<{
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      }>(`https://viacep.com.br/ws/${cep}/json/`, { timeout: 5000 });

      if (data.erro) {
        setError('CEP não encontrado.');
        return null;
      }

      return {
        logradouro: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        municipio: data.localidade ?? '',
        uf: data.uf ?? '',
      };
    } catch {
      try {
        const { data } = await axios.get<{
          street?: string;
          neighborhood?: string;
          city?: string;
          state?: string;
        }>(`https://brasilapi.com.br/api/cep/v2/${cep}`, { timeout: 5000 });

        return {
          logradouro: data.street ?? '',
          bairro: data.neighborhood ?? '',
          municipio: data.city ?? '',
          uf: data.state ?? '',
        };
      } catch {
        setError('Não foi possível consultar o CEP.');
        return null;
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    lastCep.current = '';
    setError(null);
  };

  return { lookup, loading, error, reset };
}
