import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { BudgetMatcher } from './pages/BudgetMatcher'

function App() {
  return (
    <HashRouter>
      <div className="app">
        <header className="top-nav">
          <div className="brand">PlanATrip</div>
          <nav>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Trip Dashboard
            </NavLink>
            <NavLink to="/budget" className={({ isActive }) => (isActive ? 'active' : '')}>
              Budget Matcher
            </NavLink>
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/budget" element={<BudgetMatcher />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  )
}

export default App
