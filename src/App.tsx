import { Suspense } from 'react'
import Scene from './components/Scene'
import UI from './components/UI/UI'
import LoadingScreen from './components/UI/LoadingScreen'
import './App.css'

function App() {
  return (
    <div className="app-container">
      <Suspense fallback={<LoadingScreen />}>
        <Scene />
      </Suspense>
      <UI />
    </div>
  )
}

export default App
