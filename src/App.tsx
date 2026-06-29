import { Identity } from './components/Identity'
import { MagicCursor } from './components/MagicCursor'
import { ThreeScene } from './components/ThreeScene'
import './styles/app.css'

function App() {
  return (
    <main className="site-shell">
      <MagicCursor />
      <ThreeScene />
      <Identity />
    </main>
  )
}

export default App
