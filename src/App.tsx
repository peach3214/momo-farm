import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Statistics } from './pages/Statistics';
import { Dashboard } from './pages/Dashboard';
import { Outing } from './pages/Outing';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';
import { Checkups } from './pages/Checkups';
import { Temperature } from './pages/Temperature';
import { Shopping } from './pages/Shopping';
import { Achievements } from './pages/Achievements';
import { BottomNav } from './components/layout/BottomNav';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/outing" element={<Outing />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/checkups" element={<Checkups />} />
          <Route path="/temperature" element={<Temperature />} />
          <Route path="/shopping" element={<Shopping />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
