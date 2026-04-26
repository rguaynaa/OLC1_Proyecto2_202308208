
import axios from 'axios';
import type { InterpretRequest, InterpretResponse } from '../types';

const BASE_URL = '/api';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

/**
 * Send source code to the interpreter backend.
 * Always resolves — parse errors are returned inside the `errors` array,
 * not thrown as exceptions.
 */
export async function interpretCode(
  code: string
): Promise<InterpretResponse> {
  try {
    const payload: InterpretRequest = { code };
    const { data } = await client.post<InterpretResponse>('/interpret', payload);
    return data;
  } catch (err: any) {
    // Network / server error
    const message: string =
      err?.response?.data?.message ??
      err?.message ??
      'Error de conexión con el servidor.';

    return {
      ast: null,
      dot: '',
      output: [],
      errors: [
        {
          type: 'Semántico',
          description: `Error de red: ${message}`,
          line: 0,
          column: 0,
        },
      ],
      symbols: [],
    };
  }
}
