import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github-dark.css";

const SUGGESTIONS = [
    "Explain how React hooks work",
    "Build a REST API with Node.js",
    "What is DSA and where to start?",
    "Write a resume for a web developer",
];

function MessageActions({ text, onRegenerate, isLast, loading }) {
    const [copied, setCopied] = useState(false);
    const [liked, setLiked] = useState(null);

    const copy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="msgActions">
            <button className="actionBtn" onClick={() => setLiked(l => l === true ? null : true)}>
                <i className={`fa-${liked === true ? "solid" : "regular"} fa-thumbs-up`}></i>
            </button>
            <button className="actionBtn" onClick={() => setLiked(l => l === false ? null : false)}>
                <i className={`fa-${liked === false ? "solid" : "regular"} fa-thumbs-down`}></i>
            </button>
            <button className="actionBtn" onClick={copy}>
                <i className={copied ? "fa-solid fa-check" : "fa-regular fa-copy"}></i>
                {copied ? " Copied" : " Copy"}
            </button>
            {isLast && onRegenerate && !loading && (
                <button className="actionBtn" onClick={onRegenerate}>
                    <i className="fa-solid fa-rotate-right"></i> Regenerate
                </button>
            )}
        </div>
    );
}

function Chat({ onRegenerate, loading, streamingReply }) {
    const { newChat, prevChats, setPrompt } = useContext(MyContext);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, streamingReply]);

    // last message is assistant only after streaming completes
    // during streaming, prevChats ends with user message, streamingReply is the live text
    const isStreaming = loading && streamingReply !== "";
    const displayChats = isStreaming ? prevChats : prevChats;
    const lastAssistant = !isStreaming && prevChats.length > 0 && prevChats[prevChats.length - 1].role === "assistant"
        ? prevChats[prevChats.length - 1]
        : null;
    const chatsToRender = lastAssistant ? prevChats.slice(0, -1) : prevChats;

    return (
        <>
            {newChat && !prevChats.length && (
                <div className="welcomeScreen">
                    <h1>What can I help with?</h1>
                    <div className="suggestions">
                        {SUGGESTIONS.map((s, i) => (
                            <div key={i} className="suggestionChip" onClick={() => setPrompt(s)}>{s}</div>
                        ))}
                    </div>
                </div>
            )}
            <div className="chats">
                {chatsToRender.map((chat, idx) => (
                    <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                        {chat.role === "user" ? (
                            <p className="userMessage">{chat.content}</p>
                        ) : (
                            <div className="gptMessage">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                    {chat.content}
                                </ReactMarkdown>
                                <MessageActions text={chat.content} isLast={false} loading={loading} />
                            </div>
                        )}
                    </div>
                ))}

                {/* live streaming message */}
                {isStreaming && (
                    <div className="gptDiv">
                        <div className="gptMessage streaming">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                {streamingReply}
                            </ReactMarkdown>
                            <span className="cursor">▋</span>
                        </div>
                    </div>
                )}

                {/* completed last assistant message */}
                {lastAssistant && (
                    <div className="gptDiv">
                        <div className="gptMessage">
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                                {lastAssistant.content}
                            </ReactMarkdown>
                            <MessageActions text={lastAssistant.content} onRegenerate={onRegenerate} isLast={true} loading={loading} />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </>
    );
}

export default Chat;
