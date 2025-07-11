import React from 'react';
import { Card } from 'antd';
import OpenAIChat from '@/components/OpenAIChat';

const OpenAITestPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OpenAI Integration Test</h1>
      <p>Enter your OpenAI API key and test the SQL generation!</p>
      
      <OpenAIChat 
        onSQLGenerated={(sql) => {
          console.log('Generated SQL:', sql);
          alert(`Generated SQL:\n${sql}`);
        }}
        databaseSchema="PostgreSQL sample database with users, orders, products tables"
      />
    </div>
  );
};

export default OpenAITestPage;cat .umirc.ts