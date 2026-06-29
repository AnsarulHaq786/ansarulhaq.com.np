import { ProjectCard } from '../components/ProjectCard'
import { projects } from '../constants/projects'

export function ProjectsPage() {
  return (
    <section className="projects-page" aria-labelledby="projects-title">
      <header className="projects-header">
        <a className="home-link" href="/">
          Ansarul Haq
        </a>
        <div>
          <p>Selected experiments</p>
          <h1 id="projects-title">Projects</h1>
        </div>
      </header>

      <div className="projects-grid">
        {projects.map((project) => (
          <ProjectCard key={project.domain} project={project} />
        ))}
      </div>
    </section>
  )
}
