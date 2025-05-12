"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@heroui/react"
import { auth } from "../utils/firebaseConfig"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { User as FirebaseUser } from "firebase/auth"
import Dashboard from "../components/dashboard"

export default function dashboard() {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login")
      } else {
        setUser(currentUser)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-muted/50 dark:from-background dark:to-background/80">
      <header className="container flex h-16 items-center justify-between px-4 bg-white/30 backdrop-blur-md shadow-md dark:bg-black">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          
          <span className="text-xl font-bold">NewsInsight</span>
        </motion.div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button 
              variant="ghost"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {user && (
            <Button  onClick={handleSignOut}>
              Sign Out
            </Button>
          )}
        </div>
      </header>

      <Dashboard></Dashboard>
    </div>
  )
}
