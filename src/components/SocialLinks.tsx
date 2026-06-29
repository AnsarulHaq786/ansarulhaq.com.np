import { githubUrl, linkedinUrl } from '../constants/social-links'
import { GithubIcon } from './icons/GithubIcon'
import { LinkedinIcon } from './icons/LinkedinIcon'

export function SocialLinks() {
  return (
    <nav className="social-links" aria-label="Social links">
      <a href={githubUrl} target="_blank" rel="noreferrer" aria-label="GitHub profile">
        <GithubIcon />
      </a>
      <a href={linkedinUrl} target="_blank" rel="noreferrer" aria-label="LinkedIn profile">
        <LinkedinIcon />
      </a>
    </nav>
  )
}
