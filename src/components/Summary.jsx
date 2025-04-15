"use client"

import { useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import * as pdfjs from "pdfjs-dist"
import { GlobalWorkerOptions } from "pdfjs-dist/build/pdf"

// Set the worker source directly
GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

export default function Summary() {
  const [file, setFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [summary, setSummary] = useState("")
  const [error, setError] = useState("")
  const [pdfPreview, setPdfPreview] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [isLoaded, setIsLoaded] = useState(true)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0])
    }
  }, [])

  const handleFileUpload = (uploadedFile) => {
    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setFile(uploadedFile)
      setError("")
      setSummary("")

      // Create a preview of the first page
      const fileURL = URL.createObjectURL(uploadedFile)
      setPdfPreview(fileURL)

      // Load the PDF for preview
      loadPdfPreview(fileURL)
    } else {
      setError("Please upload a valid PDF file.")
      setFile(null)
      setPdfPreview(null)
    }
  }

  const loadPdfPreview = async (url) => {
    try {
      const loadingTask = pdfjs.getDocument(url)
      const pdf = await loadingTask.promise
      setNumPages(pdf.numPages)

      // Render the first page
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 0.5 })

      // Prepare canvas for rendering
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")
      canvas.height = viewport.height
      canvas.width = viewport.width

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise
    } catch (err) {
      console.error("Error loading PDF preview:", err)
    }
  }

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0]
    handleFileUpload(uploadedFile)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploading(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploading(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsUploading(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const extractTextFromPDF = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          const typedArray = new Uint8Array(event.target.result)
          const pdf = await pdfjs.getDocument(typedArray).promise
          let fullText = ""

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const textItems = textContent.items.map((item) => item.str).join(" ")
            fullText += textItems + "\n"
          }

          resolve(fullText)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const generateSummary = async () => {
    if (!file) {
      setError("Please upload a PDF file first.")
      return
    }

    try {
      setIsProcessing(true)
      setError("")

      // Extract text from PDF
      const extractedText = await extractTextFromPDF(file)

      // Call the API to generate summary
      const response = await fetch("http://localhost:3001/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: extractedText }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      console.error("Error generating summary:", err)
      setError("An error occurred while generating the summary. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white">
      <main className="flex-grow flex flex-col items-center justify-start px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : -20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-emerald-800 mb-2 sm:mb-4">PDF Summary</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xs sm:max-w-lg md:max-w-2xl mx-auto">
            Upload your PDF document and get an AI-powered summary in seconds.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div className="bg-white rounded-xl shadow-lg overflow-hidden p-6 mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                isUploading ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-800">Drag and drop your PDF here</p>
                    <p className="text-sm text-gray-500 mt-1">or</p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors duration-300"
                  >
                    Browse Files
                  </button>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                  <p className="text-xs text-gray-500 mt-2">Supported format: PDF</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-emerald-600 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-lg font-medium text-gray-800 truncate max-w-xs sm:max-w-sm md:max-w-md">
                      {file.name}
                    </span>
                  </div>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setFile(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                      Remove
                    </button>
                    <button
                      onClick={generateSummary}
                      disabled={isProcessing}
                      className={`px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg transition-colors duration-300 ${
                        isProcessing ? "opacity-70 cursor-not-allowed" : "hover:bg-emerald-700"
                      }`}
                    >
                      {isProcessing ? "Generating Summary..." : "Generate Summary"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}

            {file && !summary && !isProcessing && (
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-3 border-b">
                  <h3 className="font-medium text-gray-700">PDF Preview</h3>
                </div>
                <div className="p-4 flex justify-center">
                  <canvas ref={canvasRef} className="border shadow-sm"></canvas>
                </div>
                {numPages > 1 && (
                  <div className="p-3 bg-gray-50 border-t text-center text-sm text-gray-500">Page 1 of {numPages}</div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6 p-6 border rounded-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-gray-700">Analyzing your document and generating a summary...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a moment depending on the document size.</p>
              </div>
            )}

            {summary && (
              <div className="mt-6 border rounded-lg overflow-hidden">
                <div className="bg-emerald-50 p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium text-emerald-800">Summary</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(summary)
                      // You could add a toast notification here
                    }}
                    className="text-emerald-600 hover:text-emerald-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <div className="prose max-w-none">
                    {summary.split("\n").map((paragraph, index) =>
                      paragraph ? (
                        <p key={index} className="mb-4 last:mb-0">
                          {paragraph}
                        </p>
                      ) : null,
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer - Simplified version of the one from Home */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="bg-gray-800 text-white py-6"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h2 className="text-xl font-bold text-emerald-400 flex items-center justify-center md:justify-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                LearnSmart
              </h2>
            </div>
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} LearnSmart. All rights reserved.</p>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
