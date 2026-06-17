import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { MyContext } from "./MyContext.jsx";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Auth from "./Auth.jsx";
import { useState } from 'react';
import { v1 as uuidv1 } from "uuid";
import { Toaster } from "sonner";

function AppContent() {
    const { user } = useAuth();
    const [prompt, setPrompt] = useState("");
    const [reply, setReply] = useState(null);
    const [currThreadId, setCurrThreadId] = useState(uuidv1());
    const [prevChats, setPrevChats] = useState([]);
    const [newChat, setNewChat] = useState(true);
    const [allThreads, setAllThreads] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    if (!user) return <Auth />;

    const providerValues = {
        prompt, setPrompt,
        reply, setReply,
        currThreadId, setCurrThreadId,
        newChat, setNewChat,
        prevChats, setPrevChats,
        allThreads, setAllThreads,
        sidebarOpen, setSidebarOpen
    };

    return (
        <div className='app'>
            <MyContext.Provider value={providerValues}>
                <Sidebar />
                <ChatWindow />
            </MyContext.Provider>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
            <Toaster position="top-right" theme="dark" richColors />
        </AuthProvider>
    );
}

export default App;
