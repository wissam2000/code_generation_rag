"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Code } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { OpenAI } from "openai";
import ReactMarkdown from "react-markdown";

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

const CodePage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<OpenAI.Chat.ChatCompletionMessage[]>(
    []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  // Effect to handle window resize
  const [maxRows, setMaxRows] = useState(5); // Default to the smaller value

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Depend on messages array, so it runs every time messages update

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userMessage: OpenAI.Chat.ChatCompletionMessage = {
        role: "user",
        content: values.prompt,
      };
      const newMessages = [...messages, userMessage];

      const response = await axios.post("/api/code", {
        messages: newMessages,
      });

      setMessages((current) => [...current, userMessage, response.data]);

      form.reset();
    } catch (error: any) {
    } finally {
      router.refresh();
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
          <div className="px-4 lg:px-8">
            {isLoading && (
              <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
                <Loader />
              </div>
            )}
            {messages.length === 0 && !isLoading && <div></div>}
            <div className="flex flex-col gap-y-4">
              {messages.map((message) => (
                <div
                  key={message.content}
                  className={cn(
                    "p-8 w-full flex items-start gap-x-8 rounded-lg",
                    message.role === "user"
                      ? "bg-white border border-black/10"
                      : "bg-muted"
                  )}
                >
                  {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
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
            </div>
          </div>
        </div>
        <div className="flex pt-0 pb-4 px-4 lg:px-8 lg:pb-8 w-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
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
                        className="resize-none w-full border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading}
                        placeholder="e.g., simple toggle button using react hooks"
                        minRows={1}
                        maxRows={maxRows}
                        cacheMeasurements={true}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button disabled={isLoading}>GO</Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};
export default CodePage;
