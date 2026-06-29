export type Project = {
  name: string
  domain: string
  href: string
  githubUrl: string
  accent: 'bamboo' | 'amber' | 'pitch' | 'berry'
}

export const projects: Project[] = [
  {
    name: 'Panda',
    domain: 'panda.ansarulhaq.com.np',
    href: 'https://panda.ansarulhaq.com.np',
    githubUrl: 'https://github.com/AnsarulHaq786/react-projects/tree/main/panda',
    accent: 'bamboo',
  },
  {
    name: 'Guitar',
    domain: 'guitar.ansarulhaq.com.np',
    href: 'https://guitar.ansarulhaq.com.np',
    githubUrl: 'https://github.com/AnsarulHaq786/web-in-a-motion/tree/main/guitar',
    accent: 'amber',
  },
  {
    name: 'Goal',
    domain: 'goal.ansarulhaq.com.np',
    href: 'https://goal.ansarulhaq.com.np',
    githubUrl: 'https://github.com/AnsarulHaq786/web-in-a-motion/tree/main/goal-post',
    accent: 'pitch',
  },
  {
    name: 'Memory Game',
    domain: 'memorygame.ansarulhaq.com.np',
    href: 'https://memorygame.ansarulhaq.com.np',
    githubUrl: 'https://github.com/AnsarulHaq786/memory-game',
    accent: 'berry',
  },
]
