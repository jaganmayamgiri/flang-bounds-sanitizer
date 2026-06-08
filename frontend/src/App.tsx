import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { Dashboard } from './pages/Dashboard';
import { TestRunner } from './pages/TestRunner';
import { TestDetail } from './pages/TestDetail';
import { Benchmarks } from './pages/Benchmarks';
import { PassInspector } from './pages/PassInspector';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/runner" element={<TestRunner />} />
          <Route path="/tests/:category/:testId" element={<TestDetail />} />
          <Route path="/benchmarks" element={<Benchmarks />} />
          <Route path="/inspector" element={<PassInspector />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
