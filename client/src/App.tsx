import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>PledgeTrack Home</div>} />
        {/* TODO: Add routes for Login, Register, Pledges, etc. */}
      </Routes>
    </Router>
  )
}

export default App