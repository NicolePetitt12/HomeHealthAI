import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
  }
  return _client;
}

export async function requireAuthUser(
  req: Request,
  admin: SupabaseClient,
): Promise<{ id: string; email?: string }> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthError('Missing Authorization header');

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new AuthError('Invalid or expired token');

  return { id: data.user.id, email: data.user.email };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export class AuthError extends Error {
  readonly statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}
