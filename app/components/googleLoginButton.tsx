
'use client';

import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginButton = ({ onSuccess, onFailure }: { onSuccess: (response: any) => void, onFailure: () => void }) => {
  return (
    <GoogleLogin 
      onSuccess={onSuccess}
      onError={onFailure}
      useOneTap
    />
  );
};

export default GoogleLoginButton;
