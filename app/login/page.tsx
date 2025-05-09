"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { useTheme } from "next-themes"
import { Github, Moon, Sun, ArrowRight, Loader2 } from 'lucide-react'

import { Button, Input, Checkbox, Divider } from "@heroui/react"
import {Card, CardHeader, CardBody, CardFooter} from "@heroui/card";
import HeadImage from "../assets/pexels-cottonbro-3951353.jpg";

import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth"

import { auth, googleProvider, githubProvider } from "../utils/firebaseConfig"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log("Logged in successfully")
      router.push("/dashboard") // or your landing page
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "github") => {
    setIsLoading(true)
    try {
      const chosenProvider = provider === "google" ? googleProvider : githubProvider
      await signInWithPopup(auth, chosenProvider)
      console.log(`${provider} login success`)
      router.push("/dashboard")
    } catch (error: any) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-muted/50 dark:from-background dark:to-background/80">
      <header className="container flex h-16 items-center justify-between px-4 bg-[#ed6666]">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary" />
          <span className="text-xl font-bold">Sports Dunia</span>
        </motion.div>
        
        {mounted && (
          <Button 
            variant="ghost" 
            
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        )}
      </header>
      
      <main className="container flex flex-1 items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-6xl gap-6 flex items-center   justify-center ">
          {/* Left side - Hero Image */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-primary/80 to-primary lg:block flex justify-end align-end"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/40 p-8 text-primary-foreground ">
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-white">Welcome back</h1>
                  <p className="text-white">Sign in to continue your journey</p>
                </div>
                
                
                
              </div>
            </div>
            
            <Image 
              src={HeadImage}
              alt="Login illustration" 
              width={300} 
              height={600}
              className=" "
              priority
            />
          </motion.div>
          
          {/* Right side - Login Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-md border-none bg-card/50 shadow-xl backdrop-blur-sm dark:shadow-primary/5 p-10 rounded-2xl">
              <CardHeader className="space-y-1 flex flex-col">
                <div className="text-2xl font-bold">Sign in</div>
                
                <div>
                  Enter your credentials to access your account
                </div>
              </CardHeader>
              <CardBody className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                  
                    <Input
                     type="email"
                      id="email"
                      
                      value={email}
                      onChange={(e:any) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      
                      <Button  className="h-auto p-0 text-xs" >
                        <a href="/forgot-password">Forgot password?</a>
                      </Button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e:any) => setPassword(e.target.value)}
                      required
                      className="border-muted-foreground/20"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" />
                    <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Remember me
                    </label>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
                
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Divider className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button 
                      
                      className="w-full" 
                      onClick={() => handleSocialLogin("google")}
                      disabled={isLoading}
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                    
                  </div>
                </div>
              </CardBody>
              <CardFooter>
                <p className="text-center text-sm text-muted-foreground mt-5">
                  Don&apos;t have an account?{" "}
                  <Button  className="h-auto p-0">
                    <a href="/signup">Create an account</a>
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
