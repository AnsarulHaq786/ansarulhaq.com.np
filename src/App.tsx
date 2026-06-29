import { MagicCursor } from './components/MagicCursor'
import { HomePage } from './pages/HomePage'
import { ProjectsPage } from './pages/ProjectsPage'
import './styles/app.css'

function App() {
  const isProjectsRoute = window.location.pathname === '/projects'

  return (
    <main className={isProjectsRoute ? 'site-shell site-shell--projects' : 'site-shell'}>
      <MagicCursor />
      {isProjectsRoute ? <ProjectsPage /> : <HomePage />}
    </main>
  )
}

export default App
