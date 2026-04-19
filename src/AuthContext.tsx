import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { SUPER_ADMIN_EMAIL } from './adminConfig';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check if user exists in Firestore, if not create them
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        let role = 'user';
        if (
          SUPER_ADMIN_EMAIL &&
          firebaseUser.email &&
          firebaseUser.email === SUPER_ADMIN_EMAIL
        ) {
          role = 'admin';
        }

        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email,
            role: role
          });
          setIsAdmin(role === 'admin');
        } else {
          const currentData = userSnap.data();
          // Auto-correct role in DB if the hardcoded admin logs in but has 'user' role
          if (role === 'admin' && currentData.role !== 'admin') {
            try {
              await updateDoc(userRef, { role: 'admin' });
            } catch (e) {
              console.error("Could not update admin role in DB", e);
            }
          }
          setIsAdmin(currentData.role === 'admin' || role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
