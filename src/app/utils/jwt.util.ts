export interface JwtPayload {
  sub: string; // username = email
  exp: number;
  iat?: number;
  role?: 'user' | 'admin' | 'superadmin';
  user_id?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    let payload = parts[1];
    // Add padding if needed
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4 !== 0) {
      payload += '=';
    }

    const decoded = atob(payload);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}
