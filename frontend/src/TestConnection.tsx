import React, { useState } from 'react';

const TestConnection: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing connection to:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setResult(`❌ Network Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing login to:', import.meta.env.VITE_API_URL);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Login Success: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ Login Error: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Login test error:', error);
      setResult(`❌ Login Network Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔧 Connection Test</h1>
      <p><strong>API URL:</strong> {import.meta.env.VITE_API_URL}</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testConnection} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Health Endpoint'}
        </button>
        
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test Login Endpoint'}
        </button>
      </div>
      
      {result && (
        <div style={{
          backgroundColor: result.includes('✅') ? '#d4edda' : '#f8d7da',
          color: result.includes('✅') ? '#155724' : '#721c24',
          padding: '15px',
          borderRadius: '5px',
          border: `1px solid ${result.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          whiteSpace: 'pre-wrap',
          fontSize: '12px'
        }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default TestConnection;