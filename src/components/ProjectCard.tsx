import type { Project } from '../constants/projects'
import { GithubIcon } from './icons/GithubIcon'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className={`project-card project-card--${project.accent}`}>
      <a className="project-card__main" href={project.href} target="_blank" rel="noreferrer">
        <span className="project-card__domain">{project.domain}</span>
        <h2>{project.name}</h2>
      </a>
      <a className="project-card__github" href={project.githubUrl} target="_blank" rel="noreferrer" aria-label={`${project.name} GitHub repository`}>
        <GithubIcon />
        <span>GitHub</span>
      </a>
    </article>
  )
}
