// src/App.js

import React from 'react';
import FlowEditor from './FlowChartComponent';
import idFlow from '../Settings/Options';

/**
 * @type {React.FC}
 */
const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Fluxograma Flowise - {idFlow}</h1>
      </header>
      <main>
        <FlowEditor />
      </main>
    </div>
  );
}

export default App;
