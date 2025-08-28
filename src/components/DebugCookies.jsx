import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

const DebugCookies = () => {
  const [cookieInfo, setCookieInfo] = useState({});

  useEffect(() => {
    const getAllCookies = () => {
      const allCookies = Cookies.get();
      const info = {};
      
      Object.keys(allCookies).forEach(key => {
        const value = allCookies[key];
        try {
          // Try to decode JWT if it looks like one
          if (value && value.includes('.') && value.split('.').length === 3) {
            const payload = JSON.parse(atob(value.split('.')[1]));
            info[key] = {
              value: value.substring(0, 50) + '...',
              payload: payload,
              expires: new Date(payload.exp * 1000).toLocaleString(),
              isExpired: payload.exp < (Date.now() / 1000)
            };
          } else {
            info[key] = { value: value };
          }
        } catch (error) {
          info[key] = { value: value, error: 'Could not decode' };
        }
      });
      
      setCookieInfo(info);
    };

    getAllCookies();
    const interval = setInterval(getAllCookies, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 left-4 bg-red-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs z-50">
      <div className="font-semibold mb-2">Debug Cookies</div>
      {Object.keys(cookieInfo).map(key => (
        <div key={key} className="mb-2 border-b border-red-700 pb-1">
          <div className="font-medium">{key}:</div>
          <div className="text-xs">
            {cookieInfo[key].error ? (
              <span className="text-red-300">{cookieInfo[key].error}</span>
            ) : (
              <>
                <div>Value: {cookieInfo[key].value}</div>
                {cookieInfo[key].payload && (
                  <>
                    <div>Expires: {cookieInfo[key].expires}</div>
                    <div className={cookieInfo[key].isExpired ? 'text-red-300' : 'text-green-300'}>
                      Status: {cookieInfo[key].isExpired ? 'EXPIRED' : 'VALID'}
                    </div>
                    <div>Username: {cookieInfo[key].payload.username || cookieInfo[key].payload.userName || 'N/A'}</div>
                    <div>Role: {cookieInfo[key].payload.role || 'N/A'}</div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DebugCookies;
