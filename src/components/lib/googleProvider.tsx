import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Remplacer par votre Client ID Google via le fichier .env
const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "VOTRE_CLIENT_ID_GOOGLE_ICI.apps.googleusercontent.com";

let cachedAccessToken: string | null = null;
let tokenClient: any = null;

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

interface GoogleContextType {
  isConnected: boolean;
  connect: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  error: string | null;
  user: any;
}

const GoogleContext = createContext<GoogleContextType | undefined>(undefined);

export const useGoogle = () => {
  const context = useContext(GoogleContext);
  if (!context) throw new Error("useGoogle must be used within a GoogleProvider");
  return context;
};

export function GoogleProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Charger le script externe de Google Identity Services
    const script = document.createElement('script');
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialise le client d'autorisation OAuth 2.0 (sans popup immédiat)
      if ((window as any).google?.accounts?.oauth2) {
        tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets',
          callback: () => {} // Sera remplacé dynamiquement
        });
      }
    };
    script.onerror = () => {
      setError("Erreur de chargement du script Google Identity Services.");
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const connect = (): Promise<boolean> => {
    return new Promise((resolve) => {
      setError(null);

      if (!tokenClient) {
        setError("L'API Google Identity n'est pas encore prête.");
        resolve(false);
        return;
      }
      if (!CLIENT_ID || CLIENT_ID.includes("VOTRE_CLIENT_ID")) {
        setError("Erreur : CLIENT_ID manquant (à définir dans le code ou .env).");
        resolve(false);
        return;
      }

      // Définit la fonction de rappel pour cette requête
      tokenClient.callback = async (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          cachedAccessToken = tokenResponse.access_token;
          setIsConnected(true);
          setError(null);
          
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${cachedAccessToken}` }
            });
            const data = await res.json();
            setUser(data);
          } catch(e) {
            console.error("Impossible de récupérer les infos de l'utilisateur", e);
          }
          
          resolve(true);
        } else {
          setError("Authentification échouée ou annulée.");
          resolve(false);
        }
      };

      try {
        // Déclenche la fenêtre pop-up Google Auth
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (err: any) {
        setError(err.message || "Impossible de lancer la connexion.");
        resolve(false);
      }
    });
  };

  const disconnect = async () => {
    if (cachedAccessToken) {
      (window as any).google?.accounts?.oauth2?.revoke(cachedAccessToken, () => {
         cachedAccessToken = null;
         setIsConnected(false);
         setUser(null);
      });
    } else {
      setIsConnected(false);
      setUser(null);
    }
  };

  return (
    <GoogleContext.Provider value={{ isConnected, connect, disconnect, error, user }}>
      {children}
    </GoogleContext.Provider>
  );
}
