
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Bot, User, Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if(isOpen && messages.length === 0) {
            setMessages([{ role: 'model', content: "Hello! How can I help you with Driving School Arwal today?" }]);
        }
    }, [isOpen, messages.length]);


    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: input }];
        setMessages(newMessages);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history: newMessages }),
            });

            if (!response.ok) {
                throw new Error("Failed to get response from AI");
            }

            const result = await response.json();
            setMessages(prev => [...prev, { role: 'model', content: result.response }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', content: "Sorry, I'm having trouble connecting. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
                aria-label="Toggle Chatbot"
            >
                {isOpen ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
            </Button>

            {isOpen && (
                <Card className="fixed bottom-20 right-4 z-50 w-[calc(100vw-3rem)] max-w-sm h-[70vh] flex flex-col shadow-2xl animate-in fade-in-20 slide-in-from-bottom-5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                                <Bot className="h-5 w-5" />
                            </Avatar>
                            <CardTitle>Driving School Arwal Assistant</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <div key={index} className={cn("flex items-end gap-3", message.role === 'user' ? 'justify-end' : '')}>
                                        {message.role === 'model' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted"
                                        )}>
                                            <p>{message.content}</p>
                                        </div>
                                         {message.role === 'user' && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                                            </Avatar>
                                        )}
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex items-end gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                                        </Avatar>
                                        <div className="bg-muted rounded-lg p-3 flex items-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}
        </>
    );
}
