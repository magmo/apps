import * as React from 'react';


interface LoginErrorProps {
  error: string;
}

export default function LoginErrorPage(props: LoginErrorProps) {
  return (
    <div className="w-100 text-center mb-5">
      <h1 className="w-100">Login Error</h1>
      <div>
        <p>{props.error}</p>
      </div>
    </div>
  );
}

