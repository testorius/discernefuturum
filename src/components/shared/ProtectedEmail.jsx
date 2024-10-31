// src/components/shared/ProtectedEmail.jsx
import React from 'react';

export default function ProtectedEmail() {
  const [emailVisible, setEmailVisible] = React.useState(false);
  
  React.useEffect(() => {
    // Set a small timeout to ensure client-side execution
    const timer = setTimeout(() => setEmailVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!emailVisible) {
    return <p className="text-gray-600">E-Mail: Loading...</p>;
  }

  const emailParts = {
    start: 'hallo',
    at: '@',
    name: 'alexander',
    domain: 'paul.ch'
  };

  const email = `${emailParts.start}${emailParts.at}${emailParts.name}${emailParts.domain}`;

  return (
    <p className="text-gray-600">
      E-Mail:{' '}
      <a 
        href={`mailto:${email}`}
        className="hover:text-lime-600 transition-colors"
      >
        {email}
      </a>
    </p>
  );
}