'use client';  // This makes it a client-side component

import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleAuthProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProviderWrapper;