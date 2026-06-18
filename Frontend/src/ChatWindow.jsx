import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it"];

function ChatWindow() {
    const { prompt, setPrompt, currThreadId, setPrevChats, setNewChat, prevChats, sidebarOpen, setSidebarOpen } = useContext(MyContext);
    const { token, user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [model, setModel] = useState(MODELS[0]);
    const [modelOpen, setModelOpen] = useState(false);
    const [lastPrompt, setLastPrompt] = useState("");
    const [streamingReply, setStreamingReply] = useState("");
    const textareaRef = useRef(null);
    const abortRef = useRef(null);

    const authHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };

    const sendMessage = async (message) => {
        if (!message.trim() || loading) return;
        setLoading(true);
        setNewChat(false);
        setLastPrompt(message);
        setStreamingReply("");
        setPrompt("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";

        setPrevChats(prev => [...prev, { role: "user", content: message }]);

        try {
            const controller = new AbortController();
            abortRef.current = controller;

            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
            const res = await fetch(`${API_BASE_URL}/chat/stream`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({ message, threadId: currThreadId, model }),
                signal: controller.signal,
            });

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let full = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data:"));
                for (const line of lines) {
                    const data = JSON.parse(line.slice(5));
                    if (data.done) { setPrevChats(prev => [...prev, { role: "assistant", content: full }]); setStreamingReply(""); break; }
                    if (data.error) { toast.error(data.error); break; }
                    full += data.token;
                    setStreamingReply(full);
                }
            }
        } catch (err) {
            if (err.name !== "AbortError") toast.error("Something went wrong. Try again.");
        }
        setLoading(false);
        abortRef.current = null;
    };

    const stopGenerating = () => {
        abortRef.current?.abort();
        setLoading(false);
        if (streamingReply) {
            setPrevChats(prev => [...prev, { role: "assistant", content: streamingReply }]);
            setStreamingReply("");
        }
    };

    const regenerate = () => {
        if (!lastPrompt || loading) return;
        setPrevChats(prev => prev.slice(0, -2));
        sendMessage(lastPrompt);
    };

    useEffect(() => {
        const close = () => { setIsOpen(false); setModelOpen(false); };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const handleTextarea = (e) => {
        setPrompt(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
    };

    const handleVoice = () => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
            toast.error("Voice input not supported in this browser. Try Chrome.");
            return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SR();
        toast.info("Listening...");
        recognition.onresult = (e) => { setPrompt(e.results[0][0].transcript); toast.success("Voice captured!"); };
        recognition.onerror = () => toast.error("Could not capture voice.");
        recognition.start();
    };

    const shortModel = (m) => m.split("-").slice(0, 2).join("-");

    return (
        <div className="chatWindow">
            <div className="navbar">
                {!sidebarOpen && (
                    <button className="navIconBtn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                        <i className="fa-solid fa-bars"></i>
                    </button>
                )}
                <div className="modelSelector" onClick={e => { e.stopPropagation(); setModelOpen(!modelOpen); }}>
                    <span className="modelName">{shortModel(model)}</span>
                    <i className="fa-solid fa-chevron-down chevron"></i>
                    {modelOpen && (
                        <div className="modelDropdown">
                            {MODELS.map((m, i) => (
                                <div key={i} className={`modelItem ${m === model ? "activeModel" : ""}`} onClick={() => setModel(m)}>
                                    <span>{m}</span>
                                    {m === model && <i className="fa-solid fa-check" style={{ fontSize: "11px", color: "#339cff" }}></i>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="navRight">
                    {prevChats.length > 0 && (
                        <button className="navIconBtn" title="Share chat" onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}?thread=${currThreadId}`);
                            toast.success("Share link copied!");
                        }}>
                            <i className="fa-solid fa-share-nodes"></i>
                        </button>
                    )}
                    <div className="userIconDiv" onClick={e => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                        <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                    </div>
                </div>
                {isOpen && (
                    <div className="dropDown">
                        <div className="dropDownItem dropDownUser">
                            <i className="fa-solid fa-user"></i> {user?.name}
                        </div>
                        <hr className="dropDownDivider" />
                        <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                        <div className="dropDownItem danger" onClick={() => { logout(); toast.success("Logged out"); }}>
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                        </div>
                    </div>
                )}
            </div>

            <Chat onRegenerate={regenerate} loading={loading} streamingReply={streamingReply} />

            {loading && (
                <div className="thinkingBar">
                    <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                    <span className="thinkingText">Thinking...</span>
                    <button className="stopBtn" onClick={stopGenerating}>
                        <i className="fa-solid fa-stop"></i> Stop
                    </button>
                </div>
            )}

            <div className="chatInput">
                <div className="inputBox">
                    <textarea
                        ref={textareaRef}
                        placeholder="Ask NeuraChat anything..."
                        value={prompt}
                        rows={1}
                        onChange={handleTextarea}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(prompt); } }}
                    />
                    <div className="inputActions">
                        <button className="inputIconBtn" title="Attach file" onClick={() => toast.info("File upload coming soon!", { icon: "🚧" })}>
                            <i className="fa-solid fa-paperclip"></i>
                        </button>
                        <button className="inputIconBtn" title="Voice input" onClick={handleVoice}>
                            <i className="fa-solid fa-microphone"></i>
                        </button>
                        <button id="submit" onClick={() => sendMessage(prompt)} disabled={loading || !prompt.trim()}>
                            <i className="fa-solid fa-arrow-up"></i>
                        </button>
                    </div>
                </div>
                <p className="info">NeuraChat can make mistakes. Verify important information.</p>
            </div>
        </div>
    );
}

export default ChatWindow;
