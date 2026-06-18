import "./Sidebar.css";
import { useContext, useEffect, useState, useRef } from "react";
import { MyContext } from "./MyContext.jsx";
import { useAuth } from "./AuthContext.jsx";
import { v1 as uuidv1 } from "uuid";
import { toast } from "sonner";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply,
        setCurrThreadId, setPrevChats, sidebarOpen, setSidebarOpen } = useContext(MyContext);
    const { token, user, logout } = useAuth();
    const [search, setSearch] = useState("");
    const [menuOpen, setMenuOpen] = useState(null);
    const [renaming, setRenaming] = useState(null);
    const [renameVal, setRenameVal] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const [pinned, setPinned] = useState(() => JSON.parse(localStorage.getItem("pinnedChats") || "[]"));
    const menuRef = useRef(null);

    const authHeaders = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

    const savePinned = (updated) => {
        setPinned(updated);
        localStorage.setItem("pinnedChats", JSON.stringify(updated));
    };

    const getAllThreads = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/thread`, { headers: authHeaders });
            const data = await res.json();
            setAllThreads(data.map(t => ({ threadId: t.threadId, title: t.title, updatedAt: t.updatedAt })));
        } catch (err) { console.log(err); }
    };

    useEffect(() => { getAllThreads(); }, [currThreadId]);

    useEffect(() => {
        const close = (e) => {
            if (!menuRef.current?.contains(e.target)) {
                setMenuOpen(null);
                setProfileOpen(false);
            }
        };
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    const createNewChat = () => {
        setNewChat(true); setPrompt(""); setReply(null);
        setCurrThreadId(uuidv1()); setPrevChats([]);
    };

    const changeThread = async (threadId) => {
        setCurrThreadId(threadId);
        try {
            const res = await fetch(`${API_BASE_URL}/thread/${threadId}`, { headers: authHeaders });
            const data = await res.json();
            setPrevChats(data); setNewChat(false); setReply(null);
        } catch (err) { console.log(err); }
    };

    const deleteThread = async (e, threadId) => {
        e.stopPropagation(); setMenuOpen(null);
        try {
            await fetch(`${API_BASE_URL}/thread/${threadId}`, { method: "DELETE", headers: authHeaders });
            setAllThreads(prev => prev.filter(t => t.threadId !== threadId));
            savePinned(pinned.filter(id => id !== threadId));
            if (threadId === currThreadId) createNewChat();
        } catch (err) { console.log(err); }
    };

    const startRename = (e, thread) => {
        e.stopPropagation(); setMenuOpen(null);
        setRenaming(thread.threadId); setRenameVal(thread.title);
    };

    const submitRename = async (threadId) => {
        if (!renameVal.trim()) { setRenaming(null); return; }
        try {
            await fetch(`${API_BASE_URL}/thread/${threadId}/rename`, {
                method: "PATCH",
                headers: authHeaders,
                body: JSON.stringify({ title: renameVal })
            });
            setAllThreads(prev => prev.map(t => t.threadId === threadId ? { ...t, title: renameVal } : t));
        } catch (err) { console.log(err); }
        setRenaming(null);
    };

    const togglePin = (e, threadId) => {
        e.stopPropagation(); setMenuOpen(null);
        const updated = pinned.includes(threadId)
            ? pinned.filter(id => id !== threadId)
            : [...pinned, threadId];
        savePinned(updated);
        toast.success(pinned.includes(threadId) ? "Unpinned" : "Pinned chat");
    };

    const shareChat = (e, threadId) => {
        e.stopPropagation(); setMenuOpen(null);
        navigator.clipboard.writeText(`${window.location.origin}?thread=${threadId}`);
        toast.success("Share link copied to clipboard!");
    };

    const groupThreads = (threads) => {
        const now = new Date();
        const groups = { pinned: [], today: [], yesterday: [], week: [], month: [], older: [] };
        threads.forEach(t => {
            if (pinned.includes(t.threadId)) { groups.pinned.push(t); return; }
            const diff = (now - new Date(t.updatedAt)) / (1000 * 60 * 60 * 24);
            if (diff < 1) groups.today.push(t);
            else if (diff < 2) groups.yesterday.push(t);
            else if (diff < 7) groups.week.push(t);
            else if (diff < 30) groups.month.push(t);
            else groups.older.push(t);
        });
        return groups;
    };

    const filtered = allThreads.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    const groups = groupThreads(filtered);

    const renderGroup = (label, threads, icon) => threads.length > 0 && (
        <div className="threadGroup">
            <p className="groupLabel">{icon && <i className={icon}></i>} {label}</p>
            {threads.map((t, i) => (
                <div key={i}
                    className={`threadItem ${t.threadId === currThreadId ? "active" : ""}`}
                    onClick={() => changeThread(t.threadId)}
                >
                    {renaming === t.threadId ? (
                        <input className="renameInput" value={renameVal} autoFocus
                            onChange={e => setRenameVal(e.target.value)}
                            onBlur={() => submitRename(t.threadId)}
                            onKeyDown={e => { if (e.key === "Enter") submitRename(t.threadId); if (e.key === "Escape") setRenaming(null); }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <span className="threadTitle">{t.title}</span>
                            <div className="threadMenuWrap" ref={menuOpen === t.threadId ? menuRef : null}>
                                <i className="fa-solid fa-ellipsis threadMenuIcon"
                                    onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === t.threadId ? null : t.threadId); }}
                                ></i>
                                {menuOpen === t.threadId && (
                                    <div className="threadMenu">
                                        <div className="threadMenuItem" onClick={e => startRename(e, t)}>
                                            <i className="fa-solid fa-pen"></i> Rename
                                        </div>
                                        <div className="threadMenuItem" onClick={e => togglePin(e, t.threadId)}>
                                            <i className="fa-solid fa-thumbtack"></i>
                                            {pinned.includes(t.threadId) ? " Unpin" : " Pin"}
                                        </div>
                                        <div className="threadMenuItem" onClick={e => shareChat(e, t.threadId)}>
                                            <i className="fa-solid fa-share-nodes"></i> Share
                                        </div>
                                        <div className="threadMenuItem danger" onClick={e => deleteThread(e, t.threadId)}>
                                            <i className="fa-solid fa-trash"></i> Delete
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    );

    if (!sidebarOpen) return (
        <section className="sidebarCollapsed">
            <button className="collapseBtn" onClick={() => setSidebarOpen(true)} title="Open sidebar">
                <i className="fa-solid fa-bars"></i>
            </button>
            <button className="collapseBtn" onClick={createNewChat} title="New chat">
                <i className="fa-solid fa-plus"></i>
            </button>
        </section>
    );

    return (
        <section className="sidebar">
            <div className="sidebarTop">
                <div className="sidebarHeader">
                    <img src="/Neura.png" alt="logo" className="logo" />
                    <span className="appName">NeuraChat</span>

                    <button className="iconBtn" onClick={() => setSidebarOpen(false)} title="Collapse sidebar">
                        <i className="fa-solid fa-sidebar"></i>
                    </button>
                </div>
                <button className="newChatBtn" onClick={createNewChat}>
                    <i className="fa-solid fa-plus"></i> New Chat
                </button>
                <div className="searchBox">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search chats..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="threadList">
                {allThreads.length === 0 && <p className="noChats">No chats yet. Start a new one!</p>}
                {renderGroup("Pinned", groups.pinned, "fa-solid fa-thumbtack")}
                {renderGroup("Today", groups.today)}
                {renderGroup("Yesterday", groups.yesterday)}
                {renderGroup("Previous 7 Days", groups.week)}
                {renderGroup("Previous 30 Days", groups.month)}
                {renderGroup("Older", groups.older)}
            </div>

            <div className="sidebarBottom">
                <div className="sidebarUser" onClick={e => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                    <div className="userAvatar"><i className="fa-solid fa-user"></i></div>
                    <span>{user?.name}</span>
                    <i className="fa-solid fa-ellipsis" style={{ marginLeft: "auto", fontSize: "13px", color: "#555" }}></i>
                </div>
                {profileOpen && (
                    <div className="profileMenu" ref={menuRef}>
                        <div className="profileMenuItem profileName">
                            <i className="fa-solid fa-user"></i> {user?.email}
                        </div>
                        <hr className="profileDivider" />
                        <div className="profileMenuItem"><i className="fa-solid fa-gear"></i> Settings</div>
                        <div className="profileMenuItem danger" onClick={() => { logout(); toast.success("Logged out"); }}>
                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default Sidebar;
