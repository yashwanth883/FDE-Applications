export type AuthMode = 'basic_auth' | 'query_param' | 'oauth_flow';

export interface AuthCredentials {
  consumerKey: string;
  consumerSecret: string;
  authMode?: AuthMode;
}

export interface AuthHeaders {
  Authorization?: string;
  [key: string]: string | undefined;
}

export interface OAuthAuthorizeParams {
  storeUrl: string;
  appName: string;
  scope: 'read' | 'write' | 'read_write';
  userId: string;
  returnUrl: string;
  callbackUrl: string;
}

export interface AuthValidationResult {
  valid: boolean;
  storeName?: string;
  wcVersion?: string;
  error?: string;
}
