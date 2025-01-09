import React from 'react';
import './App.css';
import VimPortfolio from './vim';

function App() {
  return (
    <div className="App">
      <header className="header">
        <div className="ascii-art">
          {`
           __     ______  _    _  __          _______ _   _ 
           \\ \\   / / __ \\| |  | | \\ \\        / /_   _| \\ | |
            \\ \\_/ / |  | | |  | |  \\ \\  /\\  / /  | | |  \\| |
             \\   /| |  | | |  | |   \\ \\/  \\/ /   | | | . \` |
              | | | |__| | |__| |    \\  /\\  /   _| |_| |\\  |
              |_|  \\____/ \\____/      \\/  \\/   |_____|_| \\_|
          `}
        </div>
      </header>
      <VimPortfolio />
    </div>
  );
}

export default App;