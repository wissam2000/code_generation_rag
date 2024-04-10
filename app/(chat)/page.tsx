"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Code } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { OpenAI } from "openai";
import ReactMarkdown from "react-markdown";
import { useChat } from "ai/react";
import { Message } from "ai";

import { Heading } from "@/components/heading";
import { Empty } from "@/components/empty";
import { Loader } from "@/components/loader";

import { formSchema } from "./constants";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import TextareaAutosize from "react-textarea-autosize";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { stopStream } from "@/lib/stop_stream";

const CodePage = () => {
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ api: "/api/code" });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Effect to handle window resize
  const [maxRows, setMaxRows] = useState(5); // Default to the smaller value
  useEffect(() => {
    // Call scrollToBottom every time messages update
    scrollToBottom();
  }, [messages]); // Dependency on messages ensures this effect runs every time a new message is added

  // Helper function to debounce another function

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    // Function to determine maxRows based on window width
    function getMaxRows(width) {
      return width >= 1024 ? 9 : 5; // 1024px is typically the breakpoint for large (lg) screens
    }

    // Update maxRows based on the current window width
    setMaxRows(getMaxRows(window.innerWidth));

    // Handler to update maxRows on window resize
    function handleResize() {
      setMaxRows(getMaxRows(window.innerWidth));
    }

    window.addEventListener("resize", handleResize);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array means this effect runs once on mount

  const messagesEndRef = useRef(null); // Ref for scrolling to the bottom

  const formRef = useRef<HTMLFormElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Check if isLoading is true, if so, do not submit
      if (!isLoading) {
        event.preventDefault(); // Always prevent the default action to avoid inserting a new line

        formRef.current.requestSubmit(); // Triggers form submission
      }
    }
  };

  return (
    <div className="h-full flex flex-col h-full">
      <Heading
        title="Code Generation"
        description="Generate code using descriptive text."
        icon={Code}
        iconColor="text-indigo-500"
        bgColor="bg-indigo-500/10"
      />

      <div className="flex flex-col overflow-hidden justify-between h-full">
        {/* Messages container with max height and overflow */}

        <div className="flex-1 overflow-y-auto mt-4 ">
          <div className="px-10 lg:px-16">
            {messages.length === 0 && !isLoading && <div></div>}
            <div className="flex flex-col gap-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "p-8 w-full flex gap-x-8 rounded-lg",
                    (message.role as any) === "user"
                      ? "bg-white border border-black/10"
                      : "bg-muted"
                  )}
                >
                  {(message.role as any) === "user" ? (
                    <UserAvatar />
                  ) : (
                    <BotAvatar />
                  )}
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ...props }) => (
                        <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                          <pre {...props} />
                        </div>
                      ),
                      code: ({ node, ...props }) => (
                        <code
                          className="bg-black/10 rounded-lg p-1"
                          {...props}
                        />
                      ),
                    }}
                    className="text-sm overflow-hidden leading-7"
                  >
                    {message.content || ""}
                  </ReactMarkdown>
                </div>
              ))}
              <div ref={messagesEndRef} />

              {/* {isLoading && (
                <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
                  <Loader />
                </div>
              )} */}
            </div>
          </div>
        </div>
        <div className="flex pt-0 pb-4 px-4 lg:px-8 lg:pb-8 w-full">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="
                 flex
                  rounded-lg
                  border
                  w-full
                  p-4
                  px-3
                  md:px-6
                  focus-within:shadow-sm
                
                  gap-2
                  items-end"
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl className="m-0 p-0">
                      <TextareaAutosize
                        {...field}
                        onKeyDown={handleKeyDown}
                        value={input}
                        onChange={handleInputChange}
                        className="resize-none w-full border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        placeholder="e.g., simple toggle button using react hooks"
                        minRows={1}
                        maxRows={maxRows}
                        // onKeyDown={handleKeyDown} // Attach the onKeyDown handler here
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {isLoading ? (
                <Button
                  type="button"
                  onClick={stopStream}
                  disabled={!isLoading}
                >
                  Stop
                </Button>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  Go
                </Button>
              )}
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CodePage;
