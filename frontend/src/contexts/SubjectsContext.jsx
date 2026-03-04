import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const SubjectsContext = createContext();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const useSubjects = () => {
  const context = useContext(SubjectsContext);
  if (!context) {
    throw new Error('useSubjects must be used within SubjectsProvider');
  }
  return context;
};

export const SubjectsProvider = ({ children }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/subjects`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else if (response.status === 401) {
        // Not authenticated, don't show error
        setSubjects([]);
      } else {
        throw new Error('Error al cargar asignaturas');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err.message);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshSubjects = () => {
    fetchSubjects();
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  return (
    <SubjectsContext.Provider value={{ subjects, loading, error, refreshSubjects }}>
      {children}
    </SubjectsContext.Provider>
  );
};

export default SubjectsContext;
