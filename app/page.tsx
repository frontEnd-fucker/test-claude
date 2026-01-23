import { redirect } from 'next/navigation'

// Redirect root to projects page as new homepage
export default function Home() {
  redirect('/projects')
}
