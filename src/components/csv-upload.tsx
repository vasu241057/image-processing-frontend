"use client";

import { useState, useRef } from "react";
import { Upload, X, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";
import fileDownload from "js-file-download";

export function CsvUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== "text/csv") {
      setError("Please upload a CSV file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }
    setFile(file);
    setError(null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
  };

  // const handleUpload = async () => {
  //   if (!file) return;
  //   setIsUploading(true);
  //   // Simulating upload process

  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   setIsUploading(false);
  //   // Handle actual upload logic here
  //   console.log("File uploaded:", file.name);
  // };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Make the POST request to upload the file
      const response = await axios.post(
        "https://inner-melanie-circuit-issh-626f3b5c.koyeb.app/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          responseType: "blob",
        }
      );

      console.log("request send");
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/['"]/g, "")
        : `output-${Date.now()}.csv`;

      fileDownload(response.data, filename);
      setError(null);

      console.log("File uploaded and downloaded successfully");
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorData = JSON.parse(reader.result);
              setError(
                errorData.error ||
                  "Failed to upload file or download the result. Please try again."
              );
            } catch (parseError) {
              setError("Failed to parse error response. Please try again.");
            }
          };
          reader.onerror = () => {
            setError("Failed to read error response. Please try again.");
          };
          reader.readAsText(error.response.data);
        } else {
          setError(
            "Failed to upload file or download the result. Please try again."
          );
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response received from the server. Please try again.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(
          "An error occurred while uploading the file. Please try again."
        );
      }
      console.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="w-10 h-10 bg-primary rounded-full" />
          <h1 className="text-3xl font-extrabold text-center flex-grow text-primary">
            Upload CSV
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="flex justify-center">
            <Upload size={48} className="text-primary" />
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          >
            <p className="text-gray-600 mb-2">
              Drag and drop your CSV file here
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
              ref={fileInputRef}
            />
            <label htmlFor="fileInput">
              <Button
                variant="outline"
                className="mt-2"
                onClick={triggerFileInput}
              >
                Browse
              </Button>
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between bg-gray-100 rounded p-2">
              <span className="text-sm text-gray-600 truncate">
                {file.name}
              </span>
              <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                <X size={16} />
              </Button>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center text-sm text-gray-500">
                  <HelpCircle size={16} className="mr-1" />
                  Max file size: 5MB
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Please ensure your CSV file is under 5MB in size.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>

          {error && (
            <div className="flex items-center text-red-500 text-sm">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 text-center text-sm text-gray-500">
        © 2024 Upload CSV. All rights reserved.
      </footer>
    </div>
  );
}
