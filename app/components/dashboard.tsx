"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { BarChart, LineChart, PieChart } from "lucide-react"
import PayoutModal from "./payoutModal"
import Image from "next/image"
import dynamic from "next/dynamic"
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false })

interface NewsArticle {
  title: string
  description: string
  link: string
  image_url?: string
  source_id: string
  category: string[]
  pubDate: string
  creator?: string[]
}


interface DashboardState {
  news: NewsArticle[]
  isLoading: boolean
  error: string | null
}

interface Payout {
  title: string;
  creator: string[];
  payout: number;
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    news: [],
    isLoading: true,
    error: null,
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [filters, setFilters] = useState({
  author: '',
  startDate: '',
  endDate: '',
  type: '',
  searchTerm: ''
});
const [isModalOpen, setIsModalOpen] = useState(false);
const [payouts, setPayouts] = useState<Payout[]>([]);

const filteredNews = useMemo(() => {
  return state.news.filter((article) => {
    // Matching the author
    const matchesAuthor = filters.author
      ? article.creator?.some((name) =>
          name.toLowerCase().includes(filters.author.toLowerCase())
        )
      : true;

    // Matching the start date
    const matchesStartDate = filters.startDate
      ? new Date(article.pubDate) >= new Date(filters.startDate)
      : true;

    // Matching the end date
    const matchesEndDate = filters.endDate
      ? new Date(article.pubDate) <= new Date(filters.endDate)
      : true;

    // Matching the type/category
    const matchesType = filters.type
      ? article.category.includes(filters.type)
      : true;

    // Global search matches across multiple fields (author, title, content, etc.)
    const matchesGlobalSearch =
      filters.searchTerm
        ? article.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          article.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          article.creator?.some((name) =>
            name.toLowerCase().includes(filters.searchTerm.toLowerCase())
          )
        : true;

    return (
      matchesAuthor && matchesStartDate && matchesEndDate && matchesType && matchesGlobalSearch
    );
  });
}, [state.news, filters]);

// Open modal and pass filtered articles
  const openModal = () => {
    setIsModalOpen(true);
  };

  // Save payouts after editing
  const handleSavePayouts = (updatedPayouts: any[]) => {
    console.log("Saved payouts", updatedPayouts); // Implement saving logic
    setPayouts(updatedPayouts);
    localStorage.setItem("payouts", JSON.stringify(updatedPayouts));
  };


  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get("https://newsdata.io/api/1/news", {
          params: {
            apikey: process.env.NEXT_PUBLIC_NEWS_API_KEY,
            q: "football",
            language: "en",
            country: "us",
          },
        })
        console.log(response.data.results);
        if (response.data.results) {
          setState({
            news: response.data.results,
            isLoading: false,
            error: null,
          })
        } else {
          setState({
            news: [],
            isLoading: false,
            error: "No results found.",
          })
        }
      } catch (error: any) {
        setState({
          news: [],
          isLoading: false,
          error: error.message || "Something went wrong",
        })
      }
    }

    fetchNews()
  }, [])

  const countBySource = () => {
    const counts: Record<string, number> = {}
    state.news.forEach((article) => {
      counts[article.source_id] = (counts[article.source_id] || 0) + 1
    })
    return counts
  }

  const countByType = () => {
    const counts: Record<string, number> = {}
    state.news.forEach((article) => {
      ;(article.category || []).forEach((cat) => {
        counts[cat] = (counts[cat] || 0) + 1
      })
    })
    return counts
  }

  const countByDate = () => {
    const counts: Record<string, number> = {}
    state.news.forEach((article) => {
      const date = new Date(article.pubDate).toISOString().split("T")[0]
      counts[date] = (counts[date] || 0) + 1
    })
    return counts
  }

  const pieChartData = Object.entries(countBySource()).map(([name, value]) => ({ name, value }))
  const barChartData = Object.entries(countByType()).map(([name, value]) => ({ name, value }))
  const lineChartData = countByDate()

  // Generate and download PDF
  const downloadPDF = () => {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text("Payout Details", 14, 10);

  const tableData = payouts.map((payout) => {
    const creatorText = (payout.creator ?? ["Unknown Author"]).join(", ").replace(/,/g, " - ");
    const titleText = (payout.title ?? "Untitled Article").replace(/,/g, " - ");
    const payoutText = payout.payout?.toString() ?? "0";

    return [creatorText, titleText, `${payoutText}`];
  });

  autoTable(doc, {
    head: [["Author", "Article", "Payout (₹)"]],
    body: tableData,
    startY: 16,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [100, 100, 255] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 100 },
      2: { cellWidth: 30, halign: 'right' },
    }
  });

  doc.save("payout_details.pdf");
};


  // Generate and download CSV
  const downloadCSV = () => {
  const csvHeaders = ["Author", "Article", "Payout (₹)"];
  const csvRows = payouts.map((payout) => [
    `"${(payout.creator ?? ["Unknown Author"]).join(", ").replace(/"/g, '""')}"`, // Handle null or undefined creator
    `"${payout.title ?? "Untitled Article"}"`, // Enclose title in quotes to handle commas
    payout.payout,
  ]);

  const csvContent = [
    csvHeaders.join(","), // Add headers to the CSV
    ...csvRows.map((row) => row.join(",")), // Add the data rows
  ].join("\n");

  // Create a link element and trigger the download
  const link = document.createElement("a");
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  link.target = "_blank";
  link.download = "payout_details.csv";
  link.click();
};


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  }

  const cardVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
    hover: {
      scale: 1.02,
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400 },
    },
  }

  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="w-24 h-24 mb-8">
          <svg
            className="animate-spin w-full h-full text-purple-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Loading your news dashboard</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Fetching the latest insights...</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
        <div className="w-24 h-24 mb-8 text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">Error Loading Data</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{state.error}</p>
        <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-gray-400 text-white">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div
          className="container mx-auto px-6 py-12 relative z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className="w-12 h-12 rounded-full bg-white flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-6 h-6 text-purple-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold">NewsInsight</h1>
                <p className="text-purple-200">Your daily news analytics</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Badge variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-transparent">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Badge>
              <Badge variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-transparent">
                {state.news.length} Articles
              </Badge>
            </div>
          </div>

          <motion.div
            className="mt-8 max-w-2xl"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">News Dashboard</h2>
            <p className="text-lg text-purple-100">
              Explore the latest trends and insights from your news sources. Visualize data patterns and discover what's
              making headlines.
            </p>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent dark:from-slate-900"></div>
      </header>

      <main className="container mx-auto px-6 py-8 -mt-8 relative z-10">
        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-white dark:bg-slate-800 shadow-lg">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-300"
              >
                <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <BarChart className="w-4 h-4" />
                  <span>Overview</span>
                </motion.div>
              </TabsTrigger>
              <TabsTrigger
                value="articles"
                className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 dark:data-[state=active]:bg-purple-900/30 dark:data-[state=active]:text-purple-300"
              >
                <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    />
                  </svg>
                  <span>Articles</span>
                </motion.div>
              </TabsTrigger>
            </TabsList>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
  onClick={() => window.location.reload()}
  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 mr-2"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
  Refresh Data
</Button>

            </motion.div>
          </div>

          <TabsContent value="overview" className="mt-0">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              {/* Stats Cards */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-purple-200 text-sm font-medium">Total Articles</p>
                        <h3 className="text-4xl font-bold mt-2">{state.news.length}</h3>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm">
                      <span className="flex items-center text-green-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Updated today
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-pink-500 to-pink-700 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-pink-200 text-sm font-medium">Sources</p>
                        <h3 className="text-4xl font-bold mt-2">{Object.keys(countBySource()).length}</h3>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm">
                      <span className="flex items-center text-green-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Diverse coverage
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-gradient-to-br from-cyan-500 to-cyan-700 rounded-xl shadow-xl overflow-hidden"
                >
                  <div className="p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-cyan-200 text-sm font-medium">Payout</p>
                        <h3 className="text-4xl font-bold mt-2">{(payouts || []).reduce((sum, item) => sum + (item.payout || 0), 0)}</h3>
                      </div>
                      <div className="bg-white/20 p-3 rounded-lg">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center text-sm">
                      <span className="flex items-center text-green-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Total Payout
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Charts Section */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart - Articles by Source */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center mt-4">
                      <PieChart className="w-5 h-5 mr-2 text-purple-500" />
                      <CardTitle className="text-lg font-semibold">Articles by Source</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "item",
                          formatter: "{a} <br/>{b}: {c} ({d}%)",
                        },
                        legend: {
                          bottom: 0,
                          textStyle: {
                            color: "#94a3b8",
                          },
                        },
                        color: [
                          "#7c3aed",
                          "#ec4899",
                          "#06b6d4",
                          "#10b981",
                          "#f59e0b",
                          "#8b5cf6",
                          "#f472b6",
                          "#22d3ee",
                          "#34d399",
                          "#fbbf24",
                        ],
                        series: [
                          {
                            name: "Articles",
                            type: "pie",
                            radius: ["40%", "70%"],
                            avoidLabelOverlap: false,
                            itemStyle: {
                              borderRadius: 10,
                              borderColor: "#fff",
                              borderWidth: 2,
                            },
                            label: {
                              show: false,
                              position: "center",
                            },
                            emphasis: {
                              label: {
                                show: true,
                                fontSize: "14",
                                fontWeight: "bold",
                              },
                            },
                            labelLine: {
                              show: false,
                            },
                            data: pieChartData,
                          },
                        ],
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </motion.div>

                {/* Bar Chart - Articles by Type */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center mt-4">
                      <BarChart className="w-5 h-5 mr-2 text-pink-500" />
                      <CardTitle className="text-lg font-semibold">Articles by Category</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "axis",
                          axisPointer: {
                            type: "shadow",
                          },
                        },
                        grid: {
                          left: "3%",
                          right: "4%",
                          bottom: "3%",
                          containLabel: true,
                        },
                        xAxis: {
                          type: "category",
                          data: barChartData.map((item) => item.name),
                          axisLabel: {
                            rotate: 45,
                            color: "#94a3b8",
                          },
                          axisLine: {
                            lineStyle: {
                              color: "#cbd5e1",
                            },
                          },
                        },
                        yAxis: {
                          type: "value",
                          axisLabel: {
                            color: "#94a3b8",
                          },
                          axisLine: {
                            lineStyle: {
                              color: "#cbd5e1",
                            },
                          },
                          splitLine: {
                            lineStyle: {
                              color: "#e2e8f0",
                            },
                          },
                        },
                        series: [
                          {
                            data: barChartData.map((item) => ({
                              value: item.value,
                              itemStyle: {
                                color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                              },
                            })),
                            type: "bar",
                            showBackground: true,
                            backgroundStyle: {
                              color: "rgba(180, 180, 180, 0.1)",
                            },
                            itemStyle: {
                              borderRadius: 5,
                            },
                          },
                        ],
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </motion.div>

                {/* Line Chart - Articles Over Time */}
                <motion.div
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
                >
                  <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center mt-4">
                      <LineChart className="w-5 h-5 mr-2 text-cyan-500" />
                      <CardTitle className="text-lg font-semibold">Articles Over Time</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: "axis",
                          axisPointer: {
                            type: "cross",
                            label: {
                              backgroundColor: "#6a7985",
                            },
                          },
                        },
                        grid: {
                          left: "3%",
                          right: "4%",
                          bottom: "3%",
                          containLabel: true,
                        },
                        xAxis: {
                          type: "category",
                          boundaryGap: false,
                          data: Object.keys(lineChartData),
                          axisLabel: {
                            color: "#94a3b8",
                          },
                          axisLine: {
                            lineStyle: {
                              color: "#cbd5e1",
                            },
                          },
                        },
                        yAxis: {
                          type: "value",
                          axisLabel: {
                            color: "#94a3b8",
                          },
                          axisLine: {
                            lineStyle: {
                              color: "#cbd5e1",
                            },
                          },
                          splitLine: {
                            lineStyle: {
                              color: "#e2e8f0",
                            },
                          },
                        },
                        series: [
                          {
                            data: Object.values(lineChartData),
                            type: "line",
                            smooth: true,
                            symbol: "emptyCircle",
                            symbolSize: 8,
                            lineStyle: {
                              width: 3,
                              color: "#06b6d4",
                            },
                            areaStyle: {
                              color: {
                                type: "linear",
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                  {
                                    offset: 0,
                                    color: "rgba(6, 182, 212, 0.5)",
                                  },
                                  {
                                    offset: 1,
                                    color: "rgba(6, 182, 212, 0.05)",
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      }}
                      style={{ height: "300px" }}
                    />
                  </CardContent>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>

          <TabsContent value="articles" className="mt-0">
           


            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
              <motion.div variants={itemVariants} className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Latest Articles</h2>
              </motion.div>
              <div><Input
    placeholder="Search globally..."
    value={filters.searchTerm}
    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
  /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">Author</label>
    <Input
      placeholder="Search by author..."
      value={filters.author}
      onChange={(e) => setFilters({ ...filters, author: e.target.value })}
    />
  </div>

  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
    <Input
      type="date"
      value={filters.startDate}
      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
    />
  </div>

  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
    <Input
      type="date"
      value={filters.endDate}
      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
    />
  </div>

  <div>
    <label className="block mb-1 text-sm font-medium text-gray-700">Type</label>
    <Select
      value={filters.type || 'all'}
      onValueChange={(value: string) => {
        if (value === 'all') {
          setFilters({ ...filters, type: '' });
        } else {
          setFilters({ ...filters, type: value });
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="sports">Sports</SelectItem>
        <SelectItem value="top">Top News</SelectItem>
        <SelectItem value="entertainment">Entertainment</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <div className="flex items-end">
    <button
      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
      onClick={() =>
        setFilters({
          author: "",
          startDate: "",
          endDate: "",
          type: "", // Reset type as empty string
          searchTerm: ''
          
        })
      }
    >
      Reset Filters
    </button>
  </div>
</div>

              <motion.div variants={itemVariants}>
                <ScrollArea className="">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
                    <AnimatePresence>
                      {filteredNews.map((article, index) => (
                        <motion.div
                          key={index}
                          variants={cardVariants}
                          whileHover="hover"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: { delay: index * 0.05, duration: 0.5 },
                          }}
                          exit={{ opacity: 0, y: -20 }}
                          className="h-full"
                        >
                          <Card className="h-full flex flex-col overflow-hidden border-none shadow-lg dark:bg-slate-800">
                            <div className="relative h-48 overflow-hidden">
                              {article.image_url ? (
                                <Image
                                  src={article.image_url || "/placeholder.svg"}
                                  alt={article.title}
                                  fill
                                  className="object-cover transition-transform duration-500 hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-16 w-16 text-white opacity-50"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                    />
                                  </svg>
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-white/80 text-slate-800 hover:bg-white dark:bg-black/50 dark:text-white dark:hover:bg-black/70">
                                  {article.source_id}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="flex-grow p-5">
                              <div className="flex items-center gap-2 mb-3">
                                {article.category &&
                                  article.category.slice(0, 2).map((cat, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                    >
                                      {cat}
                                    </Badge>
                                  ))}
                                <span className="text-xs text-slate-500 ml-auto">
                                  {new Date(article.pubDate).toLocaleDateString()}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold mb-2 line-clamp-2 text-slate-800 dark:text-slate-200">
                                {article.title}
                              </h3>
                              {article.creator?.length && (
  <p className="text-xs text-slate-500 italic mb-2">
    By {article.creator.join(", ")}
  </p>
)}

                              
                              <p className="text-slate-600 dark:text-slate-400 line-clamp-3 text-sm mb-4">
                                {article.description || "No description available."}
                              </p>
                            </CardContent>
                            <CardFooter className="p-5 pt-0">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                                <Button
                                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                  asChild
                                >
                                  <a href={article.link} target="_blank" rel="noopener noreferrer">
                                    Read Full Article
                                  </a>
                                </Button>
                              </motion.div>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </motion.div>

              
            </motion.div>
            <div className="flex justify-between"><Button onClick={openModal}>Open Payout Modal</Button>
            {payouts.length > 0 && (
        <div>
          <Button onClick={downloadPDF}>Download PDF</Button>
          <Button onClick={downloadCSV} className="ml-4">
            Download CSV
          </Button>
        </div>
      )}</div>
            
               <PayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        articles={filteredNews}  // Directly pass filtered articles
        onSave={handleSavePayouts}
      />
          </TabsContent>
        </Tabs>
      </main>
      

      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-5 h-5 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">NewsInsight</h3>
                <p className="text-slate-400 text-sm">Your daily news analytics</p>
              </div>
            </div>
            <div className="text-slate-400 text-sm">© {new Date().getFullYear()} NewsInsight. All rights reserved.</div>
          </div>
          <Separator className="my-6 bg-slate-800" />
          <div className="text-center text-slate-500 text-xs">
            Powered by newsdata.io API. Data refreshed {new Date().toLocaleTimeString()}.
          </div>
        </div>
      </footer>
     
    </div>
  )
}
