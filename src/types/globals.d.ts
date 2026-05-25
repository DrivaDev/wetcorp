export {}

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: 'importador' | 'proveedor' | 'despachante'
    }
  }
}
