import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './style.css'
import App from './App'

const container = document.getElementById('root')
const root = createRoot(container!)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { enabled: false }, // Klustr drives queries through informer events, not query cache
  },
})

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
