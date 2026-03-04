import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const showLoading = (message = 'Cargando...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage('');
  };

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-2xl flex flex-col items-center max-w-sm">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-lg font-semibold text-gray-800">{loadingMessage}</p>
            <p className="text-sm text-gray-500 mt-2">Por favor espera...</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export default LoadingContext;
