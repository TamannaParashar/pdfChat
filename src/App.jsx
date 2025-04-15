import { useState } from 'react'
import './App.css'
import Home from './components/Home'
import { BrowserRouter as Router,Routes,Route } from 'react-router-dom'
import Summary from './components/Summary'

function App() {

  return (
    <div>
      <Router>
        <Routes>
          <Route path='/' element={<Home/>}></Route>
          <Route exact path='summary' element={<Summary/>}></Route>
        </Routes>
      </Router>
    </div>
  )
}

export default App
