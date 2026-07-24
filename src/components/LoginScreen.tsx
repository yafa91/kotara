import { useState } from 'react';
import './LoginScreen.css';

interface LoginScreenProps {
  onLogin: (identifiant: string, motDePasse: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(identifiant, motDePasse);
  };

  return (
    <div className="login-screen">
      <a href="#" className="login-aide">Aide</a>
      <p className="login-titre">
        <span className="login-k">K</span>otara
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Identifiant"
          value={identifiant}
          onChange={(e) => setIdentifiant(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}
